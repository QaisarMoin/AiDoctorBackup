const { executeQuery } = require('../config/db');

// Detect queue_entered_at column via INFORMATION_SCHEMA (cached, never throws)
let _hasQueueCol = null;
async function hasQueueEnteredAtColumn() {
  if (_hasQueueCol !== null) return _hasQueueCol;
  const rows = await executeQuery(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'queue_entered_at'`
  );
  _hasQueueCol = rows[0].cnt > 0;
  return _hasQueueCol;
}

// Create new patient
const createPatient = async (patientData) => {
  try {
    const {
      name, age, gender, phone, email, address, status, chief_complaint, clinic_id, doctor_id
    } = patientData;

    if (!clinic_id) throw new Error('Clinic ID is required to create a patient');

    const query = `
      INSERT INTO patients (
        name, age, gender, phone, email, address, status, clinic_id, doctor_id, queue_entered_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `;

    const params = [
      name, parseInt(age), gender, phone || null, email || null, address || null, status || 'in', clinic_id, doctor_id || null
    ];

    const result = await executeQuery(query, params);
    const patientId = result.insertId;

    // Insert an initial consultation row to hold the chief complaint
    const complaintText = chief_complaint ? chief_complaint.trim() : 'Patient consultation';
    const consultQuery = `
      INSERT INTO consultations (
        patient_id, chief_complaint, status, created_at, updated_at
      ) VALUES (?, ?, 'active', NOW(), NOW())
    `;
    await executeQuery(consultQuery, [patientId, complaintText]);

    // Return the created patient
    return await getPatientById(patientId, clinic_id);
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

// Get all patients with pagination and search
const getAllPatients = async (options = {}) => {
  try {
    const { page = 1, limit = 10, search, todayOnly } = options;
    const offset = (page - 1) * limit;

    // Build query dynamically - join with consultations for latest vitals and chief complaint
    let query = `
      SELECT p.*, 
             COALESCE(c.vitals, '{}') as latest_vitals,
             c.chief_complaint,
             c.created_at as last_visit
      FROM patients p
      LEFT JOIN (
          SELECT patient_id, vitals, created_at, chief_complaint,
                 ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY created_at DESC) as rn
          FROM consultations
      ) c ON p.id = c.patient_id AND c.rn = 1
    `;
    let params = [];

    let conditions = ['p.clinic_id = ?'];
    params.push(options.clinic_id);

    // Doctor-level isolation: if a doctor_id is passed, only return their own patients
    if (options.doctor_id) {
      conditions.push('p.doctor_id = ?');
      params.push(options.doctor_id);
    }

    if (search && search.trim()) {
      conditions.push('(p.name LIKE ? OR p.phone LIKE ? OR p.email LIKE ? OR p.address LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (todayOnly === 'true' || todayOnly === true) {
      const useQueueCol = await hasQueueEnteredAtColumn();
      if (useQueueCol) {
        // queue_entered_at is available: use it for precise today-filter and ordering
        conditions.push(`(
          (DATE(p.created_at) = CURDATE() AND p.status != 'hold')
          OR 
          (DATE(p.created_at) < CURDATE() AND DATE(p.queue_entered_at) = CURDATE() AND p.status IN ('in', 'in progress'))
        )`);
      } else {
        // Fallback: column not yet migrated, use original logic
        conditions.push(`(
          (DATE(p.created_at) = CURDATE() AND p.status != 'hold')
          OR 
          (DATE(p.created_at) < CURDATE() AND p.status IN ('in', 'in progress'))
        )`);
      }
    } else if (todayOnly === 'false' || todayOnly === false) {
      // Previous patients page
      const useQueueCol = await hasQueueEnteredAtColumn();
      if (useQueueCol) {
        conditions.push(`(
          (DATE(p.created_at) < CURDATE() AND NOT (DATE(p.queue_entered_at) = CURDATE() AND p.status IN ('in', 'in progress')))
          OR
          (DATE(p.created_at) = CURDATE() AND p.status = 'hold')
        )`);
      } else {
        conditions.push(`(
          (DATE(p.created_at) < CURDATE() AND p.status NOT IN ('in', 'in progress'))
          OR
          (DATE(p.created_at) = CURDATE() AND p.status = 'hold')
        )`);
      }
    }

    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
    }

    // --Qaisar: Get total count AND status counts
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(status IN ('in', 'in progress', 'hold')) as active_count,
        SUM(status = 'cancelled') as critical_count
      FROM patients p ${whereClause}
    `;
    const statsResult = await executeQuery(statsQuery, params);
    const total = statsResult[0].total || 0;
    const active_count = statsResult[0].active_count || 0;
    const critical_count = statsResult[0].critical_count || 0;

    // ─── Ordering ─────────────────────────────────────────────────────────────
    // Patient Records page (no todayOnly): ALWAYS by created_at ASC
    //   → original entry order, never affected by status changes
    // Today's Queue (todayOnly=true): by queue_entered_at ASC
    //   → hold→in patients go to END of queue, not beginning
    if (todayOnly === 'true' || todayOnly === true) {
      const useQueueCol = await hasQueueEnteredAtColumn();
      query += useQueueCol
        ? ' ORDER BY COALESCE(p.queue_entered_at, p.created_at) ASC'
        : ' ORDER BY p.created_at ASC';
    } else {
      // Patient Records page & Voice Assistant — newest registrations first
      query += ' ORDER BY p.created_at DESC';
    }
    query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const patients = await executeQuery(query, params);

    // Parse latest_vitals JSON and merge it up into the patient object structure for React
    const formattedPatients = patients.map(p => {
      let parsedVitals = {};
      if (typeof p.latest_vitals === 'string' && p.latest_vitals !== '{}') {
        try {
          parsedVitals = JSON.parse(p.latest_vitals);
        } catch (e) {
          console.error(`Error parsing vitals for patient ${p.id}:`, e);
        }
      } else if (typeof p.latest_vitals === 'object') {
        parsedVitals = p.latest_vitals;
      }
      
      const { latest_vitals, ...patientData } = p;
      return {
        ...patientData,
        ...parsedVitals
      };
    });

    return {
      patients: formattedPatients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        active: parseInt(active_count),
        critical: parseInt(critical_count)
      }
    };
  } catch (error) {
    console.error('Error getting patients:', error);
    throw error;
  }
};

// Get patient by ID with latest vitals
const getPatientById = async (patientId, clinic_id) => {
  try {
    const query = `
      SELECT p.*, 
             COALESCE(c.vitals, '{}') as latest_vitals,
             c.chief_complaint,
             c.created_at as last_visit
      FROM patients p
      LEFT JOIN (
          SELECT patient_id, vitals, created_at, chief_complaint,
                 ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY created_at DESC) as rn
          FROM consultations
      ) c ON p.id = c.patient_id AND c.rn = 1
      WHERE p.id = ? AND p.clinic_id = ?
    `;
    const patients = await executeQuery(query, [patientId, clinic_id]);
    
    if (patients.length === 0) return null;

    const p = patients[0];
    let parsedVitals = {};
    if (typeof p.latest_vitals === 'string' && p.latest_vitals !== '{}') {
      try { parsedVitals = JSON.parse(p.latest_vitals); } catch (e) {}
    } else if (typeof p.latest_vitals === 'object') {
      parsedVitals = p.latest_vitals;
    }

    const { latest_vitals, ...patientData } = p;
    return { ...patientData, ...parsedVitals };
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    throw error;
  }
};

// Update patient
const updatePatient = async (patientId, clinic_id, patientData) => {
  try {
    const {
      name, age, gender, phone, email, address, status, doctor_id, chief_complaint
    } = patientData;

    // Only update status if explicitly provided — never default to 'in' on an update
    const setClause = status !== undefined
      ? 'name = ?, age = ?, gender = ?, phone = ?, email = ?, address = ?, status = ?, doctor_id = ?, updated_at = NOW()'
      : 'name = ?, age = ?, gender = ?, phone = ?, email = ?, address = ?, doctor_id = ?, updated_at = NOW()';

    const query = `UPDATE patients SET ${setClause} WHERE id = ? AND clinic_id = ?`;

    const params = status !== undefined
      ? [name, parseInt(age), gender, phone || null, email || null, address || null, status, doctor_id || null, patientId, clinic_id]
      : [name, parseInt(age), gender, phone || null, email || null, address || null, doctor_id || null, patientId, clinic_id];

    const result = await executeQuery(query, params);
    
    // 2. Update active chief complaint if provided
    if (chief_complaint !== undefined) {
      const activeConsultQuery = `
        UPDATE consultations 
        SET chief_complaint = ?, updated_at = NOW() 
        WHERE patient_id = ? AND status = 'active' 
        ORDER BY created_at DESC LIMIT 1
      `;
      // We only execute this if someone is deliberately putting in a new chief complaint
      await executeQuery(activeConsultQuery, [chief_complaint, patientId]);
    }

    if (result.affectedRows === 0) {
      return null;
    }
    
    return await getPatientById(patientId, clinic_id);
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// Delete patient
const deletePatient = async (patientId, clinic_id) => {
  try {
    const query = 'DELETE FROM patients WHERE id = ? AND clinic_id = ?';
    const result = await executeQuery(query, [patientId, clinic_id]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Update patient status only (used for lifecycle: in → in progress → completed / hold)
const updatePatientStatus = async (patientId, clinic_id, status) => {
  try {
    const VALID = ['in', 'in progress', 'hold', 'completed', 'cancelled'];
    if (!VALID.includes(status)) throw new Error(`Invalid status: ${status}`);

    // Fetch current status before updating so we know the transition
    const current = await executeQuery(
      'SELECT status, created_at FROM patients WHERE id = ? AND clinic_id = ?',
      [patientId, clinic_id]
    );
    const previousStatus = current[0]?.status;
    const createdAt = current[0]?.created_at;

    // Refresh queue_entered_at if:
    // 1. Patient was 'hold' and is now 'in' (today's patient being re-queued or old patient)
    // 2. OR patient is from a previous day and is being put 'in' directly.
    // Do NOT refresh on in-progress → in (doctor going back): that would
    // reset queue_entered_at to NOW() and push the patient to the end.
    let isRequeueing = false;
    if (status === 'in') {
        const isHoldToIn = previousStatus === 'hold';
        const isPreviousDay = createdAt && new Date(createdAt).toDateString() !== new Date().toDateString();
        // If they are from a previous day and NOT currently 'in progress' (which means we're just going 'back')
        const isOldPatientEnteringQueue = isPreviousDay && previousStatus !== 'in progress';
        isRequeueing = isHoldToIn || isOldPatientEnteringQueue;
    }

    const queueUpdate = isRequeueing ? ', queue_entered_at = NOW()' : '';

    const result = await executeQuery(
      `UPDATE patients SET status = ?, updated_at = NOW()${queueUpdate} WHERE id = ? AND clinic_id = ?`,
      [status, patientId, clinic_id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
};

// Batch-migrate stale 'in' patients (registered before today) to 'hold'
const migrateStalePatientsToHold = async (clinic_id) => {
  try {
    const useQueueCol = await hasQueueEnteredAtColumn();
    const dateCheck = useQueueCol
      ? 'DATE(COALESCE(queue_entered_at, created_at)) < CURDATE()'
      : 'DATE(created_at) < CURDATE()';

    const result = await executeQuery(
      `UPDATE patients
       SET status = 'hold', updated_at = NOW()
       WHERE clinic_id = ? AND status IN ('in', 'in progress') AND ${dateCheck}`,
      [clinic_id]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error migrating stale patients:', error);
    throw error;
  }
};

// Global batch-migrate stale 'in' patients (for cron job across all clinics)
const migrateAllStalePatientsToHold = async () => {
  try {
    const useQueueCol = await hasQueueEnteredAtColumn();
    const dateCheck = useQueueCol
      ? 'DATE(COALESCE(queue_entered_at, created_at)) < CURDATE()'
      : 'DATE(created_at) < CURDATE()';

    const result = await executeQuery(
      `UPDATE patients
       SET status = 'hold', updated_at = NOW()
       WHERE status IN ('in', 'in progress') AND ${dateCheck}`
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Error in global cron migrating stale patients:', error);
    throw error;
  }
};

// Added by Qaisar: Update or Create active consultation with vitals
const updateVitals = async (patientId, clinic_id, vitalsData) => {
  try {
    // First verify patient belongs to clinic
    const patientExists = await getPatientById(patientId, clinic_id);
    if (!patientExists) throw new Error("Patient not found in this clinic");

    const jsonVitals = JSON.stringify(vitalsData);

    // 1. Check if an active consultation exists purely for vitals update
    const activeQuery = `
      SELECT id FROM consultations 
      WHERE patient_id = ? AND status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `;
    const activeResult = await executeQuery(activeQuery, [patientId]);

    // 2. We have an active record — update its vitals
    if (activeResult.length > 0) {
      const consultationId = activeResult[0].id;
      const updateQuery = `UPDATE consultations SET vitals = ?, updated_at = NOW() WHERE id = ?`;
      await executeQuery(updateQuery, [jsonVitals, consultationId]);
      return await getPatientById(patientId, clinic_id);
    } 
    
    // 3. We do NOT have an active consultation — create a new placeholder record
    const insertQuery = `
      INSERT INTO consultations (
        patient_id, chief_complaint, vitals, status, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', NOW(), NOW())
    `;
    await executeQuery(insertQuery, [patientId, 'Vitals recorded prior to consultation', jsonVitals]);
    
    return await getPatientById(patientId, clinic_id);
  } catch (error) {
    console.error('Error updating vitals:', error);
    throw error;
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  updateVitals,
  updatePatientStatus,
  migrateStalePatientsToHold,
  migrateAllStalePatientsToHold
};
