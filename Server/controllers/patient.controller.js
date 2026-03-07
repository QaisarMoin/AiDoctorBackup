const patientService = require('../services/patient.service');

// --Qaisar: Dummy patient data loaded from separate JSON file (Server/json/dummy_patients.json)
// Replace with DB query when MySQL is connected
const DUMMY_PATIENTS = require('../json/dummy_patients.json');
const { createResponse } = require('../utils/response.util');

// Create new patient
const createPatient = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const patientData = {
      ...req.body,
      clinic_id: clinicId,
      // - Doctor role: always assign themselves
      // - Receptionist/Admin: use the doctor_id from the request body (chosen via dropdown/voice)
      doctor_id: req.user.role === 'doctor'
        ? req.user.id
        : (req.body.doctor_id || null)
    };
    
    const patient = await patientService.createPatient(patientData);
    
    res.status(201).json(
      createResponse(true, patient, 'Patient created successfully', 201)
    );
  } catch (error) {
    throw error;
  }
};

// Get all patients
const getAllPatients = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { page = 1, limit = 10, search, todayOnly } = req.query;
    const userRole = req.user?.role;

    // Doctors only see their own patients; admins and receptionists see entire clinic's patients
    const doctorFilter = userRole === 'doctor' ? req.user.id : null;
    
    const result = await patientService.getAllPatients({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      todayOnly,
      clinic_id: clinicId,
      doctor_id: doctorFilter
    });
    
    res.status(200).json(
      createResponse(true, result, 'Patients retrieved successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Get patient by ID
const getPatientById = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    
    const patient = await patientService.getPatientById(patientId, clinicId);
    
    if (!patient) {
      return res.status(404).json(
        createResponse(false, null, 'Patient not found', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, patient, 'Patient retrieved successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    const patientData = req.body;
    
    const patient = await patientService.updatePatient(patientId, clinicId, patientData);
    
    if (!patient) {
      return res.status(404).json(
        createResponse(false, null, 'Patient not found or unauthorized', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, patient, 'Patient updated successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    
    const result = await patientService.deletePatient(patientId, clinicId);
    
    if (!result) {
      return res.status(404).json(
        createResponse(false, null, 'Patient not found or unauthorized', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, null, 'Patient deleted successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Added by Qaisar: Update patient vitals
const updateVitals = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    const vitalsData = req.body;
    
    const patient = await patientService.updateVitals(patientId, clinicId, vitalsData);
    
    if (!patient) {
      return res.status(404).json(
        createResponse(false, null, 'Patient not found or could not update vitals', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, patient, 'Patient vitals updated successfully')
    );
  } catch (error) {
    throw error;
  }
};

// PATCH /patient/status/:patientId — update only the status field (lifecycle changes)
const updatePatientStatus = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json(createResponse(false, null, 'status is required', 400));

    const updated = await patientService.updatePatientStatus(patientId, clinicId, status);
    if (!updated) return res.status(404).json(createResponse(false, null, 'Patient not found', 404));

    res.status(200).json(createResponse(true, { status }, 'Patient status updated successfully'));
  } catch (error) {
    throw error;
  }
};

// GET /patient/migrate-stale — batch flip yesterday's 'in' patients to 'hold'
const migrateStalePatientsToHold = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned', 403));

    const count = await patientService.migrateStalePatientsToHold(clinicId);
    res.status(200).json(createResponse(true, { migrated: count }, `Migrated ${count} stale patients to hold`));
  } catch (error) {
    throw error;
  }
};

// --Qaisar: Dummy patients endpoint — returns in-memory data until DB is ready
const getDummyPatients = async (req, res) => {
  try {
    const { search } = req.query;
    let patients = DUMMY_PATIENTS;

    // --Qaisar: Simple search filter on name, phone, email
    if (search && search.trim()) {
      const q = search.toLowerCase();
      patients = patients.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }

    res.status(200).json(
      createResponse(true, { patients, pagination: { page: 1, limit: patients.length, total: patients.length, pages: 1 } }, 'Dummy patients retrieved successfully')
    );
  } catch (error) {
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
  getDummyPatients,
  updatePatientStatus,
  migrateStalePatientsToHold
};
