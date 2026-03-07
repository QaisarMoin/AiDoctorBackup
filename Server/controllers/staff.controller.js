const staffService = require('../services/staff.service');
const authService = require('../services/auth.service');
const { createResponse } = require('../utils/response.util');

// --- RECEPTIONISTS ---

const registerReceptionist = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const userData = { ...req.body, role: 'receptionist', clinic_id: clinicId };
    const user = await authService.registerUser(userData);
    res.status(201).json(createResponse(true, { user }, 'Receptionist registered successfully', 201));
  } catch (err) {
    if (err.message === 'Email already registered') return res.status(409).json(createResponse(false, null, err.message, 409));
    res.status(500).json(createResponse(false, null, 'Registration failed', 500));
  }
};

const listReceptionists = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const receptionists = await staffService.listReceptionists(clinicId);
    res.json(createResponse(true, { receptionists }, 'Receptionists fetched'));
  } catch (err) {
    res.status(500).json(createResponse(false, null, err.message));
  }
};

const updateReceptionist = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    const updated = await staffService.updateReceptionist(id, clinicId, req.body);
    res.json(createResponse(true, { receptionist: updated }, 'Receptionist updated'));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json(createResponse(false, null, err.message));
  }
};

const toggleStatus = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    const { status } = req.body;
    const updated = await staffService.toggleStatus(id, clinicId, status);
    res.json(createResponse(true, { receptionist: updated }, `Status set to ${status}`));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json(createResponse(false, null, err.message));
  }
};

const deleteReceptionist = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    await staffService.deleteReceptionist(id, clinicId);
    res.json(createResponse(true, null, 'Receptionist deleted'));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json(createResponse(false, null, err.message));
  }
};

// --- DOCTORS ---

const registerDoctor = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const userData = { ...req.body, role: 'doctor', clinic_id: clinicId };
    const user = await authService.registerUser(userData);
    res.status(201).json(createResponse(true, { user }, 'Doctor registered successfully', 201));
  } catch (err) {
    if (err.message === 'Email already registered') return res.status(409).json(createResponse(false, null, err.message, 409));
    res.status(500).json(createResponse(false, null, 'Registration failed', 500));
  }
};

const listDoctors = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const doctors = await staffService.listDoctors(clinicId);
    res.json(createResponse(true, { doctors }, 'Doctors fetched'));
  } catch (err) {
    res.status(500).json(createResponse(false, null, err.message));
  }
};

const updateDoctor = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    const updated = await staffService.updateDoctor(id, clinicId, req.body);
    res.json(createResponse(true, { doctor: updated }, 'Doctor updated'));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json(createResponse(false, null, err.message));
  }
};

const toggleDoctorStatus = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    const { status } = req.body;
    const updated = await staffService.toggleDoctorStatus(id, clinicId, status);
    res.json(createResponse(true, { doctor: updated }, `Status set to ${status}`));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 400).json(createResponse(false, null, err.message));
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    const { id } = req.params;
    await staffService.deleteDoctor(id, clinicId);
    res.json(createResponse(true, null, 'Doctor deleted'));
  } catch (err) {
    res.status(err.message.includes('not found') ? 404 : 500).json(createResponse(false, null, err.message));
  }
};

module.exports = { 
  registerReceptionist, listReceptionists, updateReceptionist, toggleStatus, deleteReceptionist,
  registerDoctor, listDoctors, updateDoctor, toggleDoctorStatus, deleteDoctor
};
