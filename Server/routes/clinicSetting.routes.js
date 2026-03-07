const express = require('express');
const router = express.Router();
const clinicSettingController = require('../controllers/clinicSetting.controller');
const { authenticateUser, requireRole } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateUser);

const adminOnly = requireRole(['admin']);

// --- MEDICINES ROUTES ---
router.get('/medicines',        clinicSettingController.getMedicines);   // all roles can read
router.post('/medicines',       adminOnly, clinicSettingController.addMedicine);
router.put('/medicines/:id',    adminOnly, clinicSettingController.updateMedicine);
router.delete('/medicines/:id', adminOnly, clinicSettingController.deleteMedicine);

// --- TESTS ROUTES ---
router.get('/tests',        clinicSettingController.getTests);           // all roles can read
router.post('/tests',       adminOnly, clinicSettingController.addTest);
router.put('/tests/:id',    adminOnly, clinicSettingController.updateTest);
router.delete('/tests/:id', adminOnly, clinicSettingController.deleteTest);

module.exports = router;
