const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { validatePatient } = require('../middlewares/validate.middleware');
const { authenticateUser, requireRole } = require('../middlewares/auth.middleware');

// Added by Qaisar: Apply authentication and role authorization generically to these patient routes
const authAndRoleLayer = [authenticateUser, requireRole(['admin', 'doctor', 'receptionist'])];

// Patient routes
router.post('/create', ...authAndRoleLayer, validatePatient, patientController.createPatient);
router.get('/all', ...authAndRoleLayer, patientController.getAllPatients);
router.get('/dummy', patientController.getDummyPatients);
router.get('/migrate-stale', ...authAndRoleLayer, patientController.migrateStalePatientsToHold);
router.get('/get/:patientId', ...authAndRoleLayer, patientController.getPatientById);
router.put('/update/:patientId', ...authAndRoleLayer, validatePatient, patientController.updatePatient);
router.put('/vitals/:patientId', ...authAndRoleLayer, patientController.updateVitals);
router.patch('/status/:patientId', ...authAndRoleLayer, patientController.updatePatientStatus);
router.delete('/delete/:patientId', ...authAndRoleLayer, patientController.deletePatient);

module.exports = router;

