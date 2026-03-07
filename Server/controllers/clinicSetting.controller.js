const clinicSettingService = require('../services/clinicSetting.service');
const { createResponse } = require('../utils/response.util');

class ClinicSettingController {

  // ─── MEDICINES ───────────────────────────────────────────────────────────────

  getMedicines = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const medicines = await clinicSettingService.getMedicines(clinicId);
      res.status(200).json(createResponse(true, medicines, 'Medicines retrieved'));
    } catch (error) {
      console.error('getMedicines error:', error);
      res.status(500).json(createResponse(false, null, 'Error fetching medicines'));
    }
  };

  addMedicine = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const medicine = await clinicSettingService.addMedicine(clinicId, req.body);
      res.status(201).json(createResponse(true, medicine, 'Medicine added'));
    } catch (error) {
      console.error('addMedicine error:', error);
      res.status(500).json(createResponse(false, null, 'Error adding medicine'));
    }
  };

  updateMedicine = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const { id } = req.params;
      const medicine = await clinicSettingService.updateMedicine(id, clinicId, req.body);
      if (!medicine) return res.status(404).json(createResponse(false, null, 'Medicine not found'));
      res.status(200).json(createResponse(true, medicine, 'Medicine updated'));
    } catch (error) {
      console.error('updateMedicine error:', error);
      res.status(500).json(createResponse(false, null, 'Error updating medicine'));
    }
  };

  deleteMedicine = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const { id } = req.params;
      const deleted = await clinicSettingService.deleteMedicine(id, clinicId);
      if (!deleted) return res.status(404).json(createResponse(false, null, 'Medicine not found'));
      res.status(200).json(createResponse(true, null, 'Medicine deleted'));
    } catch (error) {
      console.error('deleteMedicine error:', error);
      res.status(500).json(createResponse(false, null, 'Error deleting medicine'));
    }
  };

  // ─── TESTS ───────────────────────────────────────────────────────────────────

  getTests = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const tests = await clinicSettingService.getTests(clinicId);
      res.status(200).json(createResponse(true, tests, 'Tests retrieved'));
    } catch (error) {
      console.error('getTests error:', error);
      res.status(500).json(createResponse(false, null, 'Error fetching tests'));
    }
  };

  addTest = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const test = await clinicSettingService.addTest(clinicId, req.body);
      res.status(201).json(createResponse(true, test, 'Test added'));
    } catch (error) {
      console.error('addTest error:', error);
      res.status(500).json(createResponse(false, null, 'Error adding test'));
    }
  };

  updateTest = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const { id } = req.params;
      const test = await clinicSettingService.updateTest(id, clinicId, req.body);
      if (!test) return res.status(404).json(createResponse(false, null, 'Test not found'));
      res.status(200).json(createResponse(true, test, 'Test updated'));
    } catch (error) {
      console.error('updateTest error:', error);
      res.status(500).json(createResponse(false, null, 'Error updating test'));
    }
  };

  deleteTest = async (req, res) => {
    try {
      const clinicId = req.user?.clinic_id;
      if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned'));
      const { id } = req.params;
      const deleted = await clinicSettingService.deleteTest(id, clinicId);
      if (!deleted) return res.status(404).json(createResponse(false, null, 'Test not found'));
      res.status(200).json(createResponse(true, null, 'Test deleted'));
    } catch (error) {
      console.error('deleteTest error:', error);
      res.status(500).json(createResponse(false, null, 'Error deleting test'));
    }
  };
}

module.exports = new ClinicSettingController();
