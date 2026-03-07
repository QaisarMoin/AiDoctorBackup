const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticateToken } = require('../utils/jwt.util');

// All staff routes are protected
router.use(authenticateToken);

// --- RECEPTIONISTS ---
router.post('/register', staffController.registerReceptionist); // Protected route - Registering a receptionist (only doctors can do this, assigns doctor's clinic)
router.get('/receptionists', staffController.listReceptionists); // GET /api/staff/receptionists - List all receptionists
router.put('/:id', staffController.updateReceptionist); // PUT /api/staff/:id - Update receptionist name/email/gender
router.patch('/:id/status', staffController.toggleStatus); // PATCH /api/staff/:id/status - Toggle active/inactive
router.delete('/:id', staffController.deleteReceptionist); // DELETE /api/staff/:id - Delete receptionist account

// --- DOCTORS ---
router.post('/register/doctor', staffController.registerDoctor);
router.get('/doctors', staffController.listDoctors);
router.put('/doctor/:id', staffController.updateDoctor);
router.patch('/doctor/:id/status', staffController.toggleDoctorStatus);
router.delete('/doctor/:id', staffController.deleteDoctor);

module.exports = router;
