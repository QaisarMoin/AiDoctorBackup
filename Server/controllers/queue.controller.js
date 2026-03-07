const queueService = require('../services/queue.service');
const { createResponse } = require('../utils/response.util');

// POST /api/queue/verify — public, patient enters phone number
const verifyPatient = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json(createResponse(false, null, 'Phone number is required', 400));

    const patient = await queueService.verifyPatient(phone.trim());
    if (!patient) {
      return res.status(404).json(createResponse(false, null, 'Phone number not found in today\'s patient list. Access denied.', 404));
    }

    res.json(createResponse(true, {
      patient_id: patient.id,
      patient_name: patient.name,
      clinic_id: patient.clinic_id,
      doctor_id: patient.doctor_id,        // ← needed for doctor-level queue filter
      queue_position: patient.queue_position,
      status: patient.status,
      doctor_name: patient.doctor_name
    }, 'Patient verified'));
  } catch (err) {
    res.status(500).json(createResponse(false, null, err.message));
  }
};

// GET /api/queue/:clinicId — public, live queue for a clinic
const getTodayQueue = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { doctor_id } = req.query;  // optional — filter by doctor
    if (!clinicId) return res.status(400).json(createResponse(false, null, 'Clinic ID is required', 400));

    const queue = await queueService.getTodayQueue(clinicId, doctor_id || null);
    res.json(createResponse(true, { queue, total: queue.length }, 'Queue fetched'));
  } catch (err) {
    res.status(500).json(createResponse(false, null, err.message));
  }
};

// PATCH /api/queue/:patientId/status — protected, receptionist/doctor updates status
const updateStatus = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account', 403));

    const { patientId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json(createResponse(false, null, 'Status is required', 400));

    const result = await queueService.updatePatientStatus(patientId, clinicId, status);
    res.json(createResponse(true, result, 'Status updated'));
  } catch (err) {
    const code = err.message.includes('not found') ? 404 : err.message.includes('Invalid') ? 400 : 500;
    res.status(code).json(createResponse(false, null, err.message, code));
  }
};

module.exports = { verifyPatient, getTodayQueue, updateStatus };
