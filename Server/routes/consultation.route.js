const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultation.controller');
const { validate, schemas } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authenticateUser, requireRole } = require('../middlewares/auth.middleware');

// POST /api/consultation/save - Save new consultation (Added by Qaisar: protected, doctor only)
router.post('/save',
  authenticateUser,
  requireRole(['admin', 'doctor']),
  validate(schemas.consultation),
  asyncHandler(consultationController.saveConsultation)
);

// GET /api/consultation/:patientId - Get consultations by patient ID (Added by Qaisar: protected, doctor/receptionist)
router.get('/:patientId',
  authenticateUser,
  requireRole(['admin', 'doctor', 'receptionist']),
  validate(schemas.consultationQuery, 'query'),
  asyncHandler(consultationController.getConsultationsByPatientId)
);

// GET /api/consultation/:patientId/latest - Get latest consultation for patient (Added by Qaisar: protected, doctor/receptionist)
router.get('/:patientId/latest',
  authenticateUser,
  requireRole(['admin', 'doctor', 'receptionist']),
  asyncHandler(consultationController.getLatestConsultation)
);

// GET /api/consultation/:consultationId - Get specific consultation by ID (Added by Qaisar: protected, doctor/receptionist)
router.get('/detail/:consultationId',
  authenticateUser,
  requireRole(['admin', 'doctor', 'receptionist']),
  asyncHandler(consultationController.getConsultationById)
);

module.exports = router;
