const { executeQuery } = require('../config/db');

// List all receptionists for a specific clinic
const listReceptionists = async (clinicId) => {
  const query = `
    SELECT id, name, email, gender, mobile_number, status, role, created_at
    FROM users
    WHERE role = 'receptionist' AND clinic_id = ?
    ORDER BY created_at DESC
  `;
  return await executeQuery(query, [clinicId]);
};

// Update receptionist details (name, email, gender) within a clinic
const updateReceptionist = async (id, clinicId, { name, email, gender, mobile_number }) => {
  if (email) {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) throw new Error('Email is already in use by another account.');
  }
  const query = `
    UPDATE users
    SET name = COALESCE(?, name), email = COALESCE(?, email), gender = COALESCE(?, gender), mobile_number = COALESCE(?, mobile_number), updated_at = NOW()
    WHERE id = ? AND role = 'receptionist' AND clinic_id = ?
  `;
  const result = await executeQuery(query, [name || null, email || null, gender || null, mobile_number || null, id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Receptionist not found or you lack permission.');
  return await getStaffById(id, clinicId, 'receptionist');
};

const toggleStatus = async (id, clinicId, status) => {
  if (!['active', 'inactive'].includes(status)) throw new Error("Status must be 'active' or 'inactive'.");
  const query = `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND role = 'receptionist' AND clinic_id = ?`;
  const result = await executeQuery(query, [status, id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Receptionist not found or you lack permission.');
  return await getStaffById(id, clinicId, 'receptionist');
};

const deleteReceptionist = async (id, clinicId) => {
  const result = await executeQuery("DELETE FROM users WHERE id = ? AND role = 'receptionist' AND clinic_id = ?", [id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Receptionist not found or you lack permission.');
  return { id };
};


// List all doctors for a specific clinic
const listDoctors = async (clinicId) => {
  const query = `
    SELECT id, name, email, gender, mobile_number, status, role, created_at
    FROM users
    WHERE role = 'doctor' AND clinic_id = ?
    ORDER BY created_at DESC
  `;
  return await executeQuery(query, [clinicId]);
};

// Update doctor details
const updateDoctor = async (id, clinicId, { name, email, gender, mobile_number }) => {
  if (email) {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) throw new Error('Email is already in use by another account.');
  }
  const query = `
    UPDATE users
    SET name = COALESCE(?, name), email = COALESCE(?, email), gender = COALESCE(?, gender), mobile_number = COALESCE(?, mobile_number), updated_at = NOW()
    WHERE id = ? AND role = 'doctor' AND clinic_id = ?
  `;
  const result = await executeQuery(query, [name || null, email || null, gender || null, mobile_number || null, id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Doctor not found or you lack permission.');
  return await getStaffById(id, clinicId, 'doctor');
};

const toggleDoctorStatus = async (id, clinicId, status) => {
  if (!['active', 'inactive'].includes(status)) throw new Error("Status must be 'active' or 'inactive'.");
  const query = `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND role = 'doctor' AND clinic_id = ?`;
  const result = await executeQuery(query, [status, id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Doctor not found or you lack permission.');
  return await getStaffById(id, clinicId, 'doctor');
};

const deleteDoctor = async (id, clinicId) => {
  const result = await executeQuery("DELETE FROM users WHERE id = ? AND role = 'doctor' AND clinic_id = ?", [id, clinicId]);
  if (result.affectedRows === 0) throw new Error('Doctor not found or you lack permission.');
  return { id };
};

// Helper - get single staff by id
const getStaffById = async (id, clinicId, role) => {
  const rows = await executeQuery(
    'SELECT id, name, email, gender, mobile_number, status, role, created_at FROM users WHERE id = ? AND clinic_id = ? AND role = ?',
    [id, clinicId, role]
  );
  return rows[0] || null;
};

module.exports = { 
  listReceptionists, updateReceptionist, toggleStatus, deleteReceptionist,
  listDoctors, updateDoctor, toggleDoctorStatus, deleteDoctor
};
