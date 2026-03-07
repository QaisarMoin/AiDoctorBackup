const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth.middleware');

// --- PUBLIC ROUTES (no auth needed — patients access these) ---

// Verify patient by phone number
router.post('/verify', queueController.verifyPatient);

// Get today's full queue for a clinic
router.get('/:clinicId', queueController.getTodayQueue);

// --- PROTECTED ROUTES (doctors and receptionists only) ---

// Update a patient's queue status
router.patch(
  '/:patientId/status',
  authenticateUser,
  requireRole(['admin', 'doctor', 'receptionist']),
  queueController.updateStatus
);

module.exports = router;
