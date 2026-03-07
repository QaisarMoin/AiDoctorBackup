const { executeQuery } = require('../config/db');

// Get full profile: users JOIN doctor_profiles
const getProfile = async (userId) => {
  const rows = await executeQuery(
    `SELECT
       u.id, u.name, u.email, u.role, u.organization_name, u.created_at,
       c.name AS clinic_name,
       dp.designation,
       dp.degree,
       dp.signature
     FROM users u
     LEFT JOIN clinics c ON c.id = u.clinic_id
     LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );
  if (!rows.length) return null;
  const row = rows[0];

  // Parse degrees JSON array (stored as '[\"MBBS\",\"MD\"]')
  let degrees = [];
  try {
    degrees = row.degree ? JSON.parse(row.degree) : [];
  } catch {
    // If it's a plain comma-separated legacy value, split it
    degrees = row.degree ? row.degree.split(',').map(d => d.trim()).filter(Boolean) : [];
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    // For clinic admins, organization_name is their own clinic name
    // For doctors/receptionists, clinic_name comes from the joined clinic owner row
    organization_name: row.clinic_name || row.organization_name || null,
    created_at: row.created_at,
    designation: row.designation || '',
    degrees,
    signature: row.signature || null
  };
};

// Upsert doctor_profiles row
const upsertProfile = async (userId, { designation, degrees, signaturePath }) => {
  const degreeJson = JSON.stringify(Array.isArray(degrees) ? degrees : []);

  if (signaturePath !== undefined) {
    // Signature was uploaded — update everything including signature
    await executeQuery(
      `INSERT INTO doctor_profiles (user_id, designation, degree, signature)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         designation = VALUES(designation),
         degree = VALUES(degree),
         signature = VALUES(signature),
         updated_at = NOW()`,
      [userId, designation || '', degreeJson, signaturePath]
    );
  } else {
    // No new signature — preserve existing signature
    await executeQuery(
      `INSERT INTO doctor_profiles (user_id, designation, degree)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         designation = VALUES(designation),
         degree = VALUES(degree),
         updated_at = NOW()`,
      [userId, designation || '', degreeJson]
    );
  }
};

// Update name in users table
const updateUserName = async (userId, name) => {
  await executeQuery(
    'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
    [name.trim(), userId]
  );
};

module.exports = { getProfile, upsertProfile, updateUserName };
