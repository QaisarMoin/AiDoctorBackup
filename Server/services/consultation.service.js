const { executeQuery, executeTransaction } = require('../config/db');
const auditService = require('./audit.service');

// Helper: safely parse a value that may already be a parsed object (MySQL JSON columns auto-parse)
const safeJsonParse = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') return value; // already parsed by MySQL driver
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch (e) { return value; }
  }
  return value;
};

// Helper: compare two JSON-serialisable values by stringified form
const jsonEqual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// Upsert consultation — UPDATE today's existing row if different, INSERT if new day, no-op if same
const saveConsultation = async (consultationData, doctorId, clinic_id) => {
  try {
    const {
      patientId,
      diagnosisProvisional,
      diagnosisNotes,
      testsRecommended,
      medications,
      doctorAdvice,
      followUpDays,
      followUpInstructions,
      voiceTranscript,
      aiAnalysis
    } = consultationData;

    if (!patientId) throw new Error('Patient ID is required');
    if (!diagnosisProvisional) throw new Error('Provisional diagnosis is required');

    // Confirm patient exists and belongs to the user's clinic
    const patientResult = await executeQuery('SELECT id FROM patients WHERE id = ? AND clinic_id = ?', [patientId, clinic_id]);
    if (patientResult.length === 0) throw new Error('Patient not found or unauthorized for your clinic');

    // Prepare JSON strings for comparison and storage
    const testsJson     = testsRecommended?.length  ? JSON.stringify(testsRecommended)  : null;
    const medsJson      = medications?.length        ? JSON.stringify(medications)        : null;
    const aiJson        = aiAnalysis                 ? JSON.stringify(aiAnalysis)         : null;

    // Check if a consultation already exists for this patient TODAY
    const todayRows = await executeQuery(
      `SELECT * FROM consultations WHERE patient_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1`,
      [patientId]
    );

    if (todayRows.length > 0) {
      const existing = todayRows[0];

      // Parse existing JSON fields for comparison
      const existingTests = safeJsonParse(existing.tests_recommended);
      const existingMeds  = safeJsonParse(existing.medications);

      // Compare every field that the doctor can edit
      const hasChanges =
        (existing.diagnosis_provisional  || '') !== (diagnosisProvisional  || '') ||
        (existing.diagnosis_notes        || '') !== (diagnosisNotes        || '') ||
        (existing.doctor_advice          || '') !== (doctorAdvice          || '') ||
        (existing.follow_up_days)               !== (followUpDays          ?? 7)  ||
        (existing.follow_up_instructions || '') !== (followUpInstructions  || '') ||
        (existing.voice_transcript       || '') !== (voiceTranscript       || '') ||
        !jsonEqual(existingTests, testsRecommended ?? []) ||
        !jsonEqual(existingMeds,  medications       ?? []);

      if (!hasChanges) {
        // Nothing changed — return existing row with a no_changes flag
        const parsed = { ...existing };
        parsed.tests_recommended = existingTests;
        parsed.medications       = existingMeds;
        parsed.ai_analysis       = safeJsonParse(existing.ai_analysis);
        parsed.vitals            = safeJsonParse(existing.vitals);
        return { ...parsed, _action: 'no_changes' };
      }

      // Data changed — UPDATE the existing row
      await executeQuery(
        `UPDATE consultations SET
          diagnosis_provisional   = ?,
          diagnosis_notes         = ?,
          tests_recommended       = ?,
          medications             = ?,
          doctor_advice           = ?,
          follow_up_days          = ?,
          follow_up_instructions  = ?,
          voice_transcript        = ?,
          ai_analysis             = ?,
          doctor_id               = ?,
          updated_at              = NOW()
         WHERE id = ?`,
        [
          diagnosisProvisional,
          diagnosisNotes      || null,
          testsJson,
          medsJson,
          doctorAdvice        || null,
          followUpDays        ?? 7,
          followUpInstructions|| null,
          voiceTranscript     || null,
          aiJson,
          doctorId,
          existing.id
        ]
      );

      const updated = await getConsultationById(existing.id, clinic_id);
      return { ...updated, _action: 'updated' };
    }

    // No consultation today — INSERT new row
    
    // First, fetch the most recent vitals and chief complaint across all time to carry them forward
    const lastVisit = await executeQuery(
      `SELECT vitals, chief_complaint FROM consultations WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`,
      [patientId]
    );
    const lastVitals = lastVisit.length > 0 ? lastVisit[0].vitals : null;
    const lastChiefComp = lastVisit.length > 0 ? lastVisit[0].chief_complaint : 'Patient consultation';

    const result = await executeQuery(
      `INSERT INTO consultations (
          patient_id, chief_complaint, history, vitals,
          diagnosis_provisional, diagnosis_notes, tests_recommended, medications,
          doctor_advice, follow_up_days, follow_up_instructions,
          voice_transcript, ai_analysis, doctor_id, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        patientId,
        lastChiefComp,          // propagate last chief complaint
        null,                   // history placeholder
        lastVitals,             // propagate last vitals
        diagnosisProvisional,
        diagnosisNotes      || null,
        testsJson,
        medsJson,
        doctorAdvice        || null,
        followUpDays        ?? 7,
        followUpInstructions|| null,
        voiceTranscript     || null,
        aiJson,
        doctorId,
        'active'
      ]
    );

    const consultationId = result.insertId;
    await auditService.createConsultationAudit({ consultationId, ...consultationData }, doctorId);

    const inserted = await getConsultationById(consultationId, clinic_id);
    return { ...inserted, _action: 'inserted' };
  } catch (error) {
    console.error('Error saving consultation:', error);
    throw error;
  }
};

// Get consultations by patient ID with pagination
const getConsultationsByPatientId = async (patientId, clinic_id, options = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.patient_id = ? AND p.clinic_id = ?';
    let params = [patientId, clinic_id];

    if (startDate) {
      whereClause += ' AND DATE(c.created_at) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(c.created_at) <= ?';
      params.push(endDate);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM consultations c JOIN patients p ON c.patient_id = p.id ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;

    // Get consultations with new schema
    const query = `
      SELECT 
        c.id, c.patient_id, c.chief_complaint, c.history, c.vitals,
        c.diagnosis_provisional, c.diagnosis_notes, c.tests_recommended, c.medications,
        c.doctor_advice, c.follow_up_days, c.follow_up_instructions,
        c.voice_transcript, c.ai_analysis, c.status, c.created_at, c.updated_at
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      ${whereClause}
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const consultations = await executeQuery(query, [...params, limit, offset]);

    // Parse JSON fields (safeJsonParse handles cases where MySQL already auto-parsed)
    consultations.forEach(consultation => {
      if (consultation.tests_recommended) {
        consultation.tests_recommended = safeJsonParse(consultation.tests_recommended);
      }
      if (consultation.medications) {
        consultation.medications = safeJsonParse(consultation.medications);
      }
      if (consultation.ai_analysis) {
        consultation.ai_analysis = safeJsonParse(consultation.ai_analysis);
      }
      if (consultation.vitals) {
        consultation.vitals = safeJsonParse(consultation.vitals);
      }
    });

    return {
      consultations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error getting consultations:', error);
    throw error;
  }
};

// Get latest consultation for patient
const getLatestConsultation = async (patientId, clinic_id) => {
  try {
    const query = `
      SELECT 
        c.id, c.patient_id, c.chief_complaint, c.history, c.vitals,
        c.diagnosis_provisional, c.diagnosis_notes, c.tests_recommended, c.medications,
        c.doctor_advice, c.follow_up_days, c.follow_up_instructions,
        c.voice_transcript, c.ai_analysis, c.status, c.created_at, c.updated_at
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      WHERE c.patient_id = ? AND p.clinic_id = ?
      ORDER BY c.created_at DESC 
      LIMIT 1
    `;

    const consultations = await executeQuery(query, [patientId, clinic_id]);
    
    if (consultations.length === 0) {
      return null;
    }

    const consultation = consultations[0];
    
    // Parse JSON fields (safeJsonParse handles MySQL auto-parsed objects)
    if (consultation.tests_recommended) {
      consultation.tests_recommended = safeJsonParse(consultation.tests_recommended);
    }
    if (consultation.medications) {
      consultation.medications = safeJsonParse(consultation.medications);
    }
    if (consultation.ai_analysis) {
      consultation.ai_analysis = safeJsonParse(consultation.ai_analysis);
    }
    if (consultation.vitals) {
      consultation.vitals = safeJsonParse(consultation.vitals);
    }

    return consultation;
  } catch (error) {
    console.error('Error getting latest consultation:', error);
    throw error;
  }
};

// Get specific consultation by ID (clinic_id is optional for internal calls)
const getConsultationById = async (consultationId, clinic_id) => {
  try {
    let query;
    let params;

    if (clinic_id) {
      query = `
        SELECT 
          c.id, c.patient_id, c.chief_complaint, c.history, c.vitals,
          c.diagnosis_provisional, c.diagnosis_notes, c.tests_recommended, c.medications,
          c.doctor_advice, c.follow_up_days, c.follow_up_instructions,
          c.voice_transcript, c.ai_analysis, c.status, c.created_at, c.updated_at
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.id = ? AND p.clinic_id = ?
      `;
      params = [consultationId, clinic_id];
    } else {
      // Internal call without clinic context (e.g. after INSERT)
      query = `
        SELECT 
          c.id, c.patient_id, c.chief_complaint, c.history, c.vitals,
          c.diagnosis_provisional, c.diagnosis_notes, c.tests_recommended, c.medications,
          c.doctor_advice, c.follow_up_days, c.follow_up_instructions,
          c.voice_transcript, c.ai_analysis, c.status, c.created_at, c.updated_at
        FROM consultations c
        WHERE c.id = ?
      `;
      params = [consultationId];
    }

    const consultations = await executeQuery(query, params);
    
    if (consultations.length === 0) {
      return null;
    }

    const consultation = consultations[0];
    
    // Parse JSON fields (safeJsonParse handles MySQL auto-parsed objects)
    if (consultation.tests_recommended) {
      consultation.tests_recommended = safeJsonParse(consultation.tests_recommended);
    }
    if (consultation.medications) {
      consultation.medications = safeJsonParse(consultation.medications);
    }
    if (consultation.ai_analysis) {
      consultation.ai_analysis = safeJsonParse(consultation.ai_analysis);
    }
    if (consultation.vitals) {
      consultation.vitals = safeJsonParse(consultation.vitals);
    }

    return consultation;
  } catch (error) {
    console.error('Error getting consultation by ID:', error);
    throw error;
  }
};

// Create patient (helper function)
const createPatient = async (patientData) => {
  try {
    const { name, age, gender, phone, email, address } = patientData;

    const query = `
      INSERT INTO patients (name, age, gender, phone, email, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [name, age, gender, phone || null, email || null, address || null];
    
    const result = await executeQuery(query, params);
    
    return { id: result.insertId, ...patientData };
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

module.exports = {
  saveConsultation,
  getConsultationsByPatientId,
  getLatestConsultation,
  getConsultationById,
  createPatient
};
