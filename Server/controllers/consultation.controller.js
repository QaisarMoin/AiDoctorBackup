const consultationService = require('../services/consultation.service');
const patientService = require('../services/patient.service');
const { createResponse } = require('../utils/response.util');

// Save / upsert consultation
const saveConsultation = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const consultationData = req.body;
    const doctorId = req.user.id;

    const consultation = await consultationService.saveConsultation(consultationData, doctorId, clinicId);
    const { _action, ...data } = consultation;

    // Mark patient as completed now that diagnosis has been saved
    try {
      await patientService.updatePatientStatus(consultationData.patientId, clinicId, 'completed');
    } catch (statusErr) {
      console.warn('Could not update patient status to completed:', statusErr.message);
    }

    if (_action === 'no_changes') {
      return res.status(200).json(
        createResponse(true, { ...data, no_changes: true }, 'No changes detected — already up to date', 200)
      );
    }

    if (_action === 'updated') {
      return res.status(200).json(
        createResponse(true, { ...data, updated: true }, 'Consultation updated successfully', 200)
      );
    }

    // inserted
    return res.status(201).json(
      createResponse(true, data, 'Consultation saved successfully', 201)
    );
  } catch (error) {
    throw error;
  }
};

// Get consultations by patient ID
const getConsultationsByPatientId = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    
    const result = await consultationService.getConsultationsByPatientId(
      patientId,
      clinicId,
      { page: parseInt(page), limit: parseInt(limit), startDate, endDate }
    );
    
    res.status(200).json(
      createResponse(true, result, 'Consultations retrieved successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Get latest consultation for patient
const getLatestConsultation = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { patientId } = req.params;
    
    const consultation = await consultationService.getLatestConsultation(patientId, clinicId);
    
    if (!consultation) {
      return res.status(404).json(
        createResponse(false, null, 'No consultations found for this patient', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, consultation, 'Latest consultation retrieved successfully')
    );
  } catch (error) {
    throw error;
  }
};

// Get specific consultation by ID
const getConsultationById = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { consultationId } = req.params;
    
    const consultation = await consultationService.getConsultationById(consultationId, clinicId);
    
    if (!consultation) {
      return res.status(404).json(
        createResponse(false, null, 'Consultation not found or unauthorized', 404)
      );
    }
    
    res.status(200).json(
      createResponse(true, consultation, 'Consultation retrieved successfully')
    );
  } catch (error) {
    throw error;
  }
};

module.exports = {
  saveConsultation,
  getConsultationsByPatientId,
  getLatestConsultation,
  getConsultationById
};
