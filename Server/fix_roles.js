const { pool } = require('./config/db');

async function fixRoles() {
  try {
    const query = `UPDATE users u JOIN clinics c ON u.id = c.doctor_id SET u.role = 'admin'`;
    const [result] = await pool.query(query);
    console.log(`Updated ${result.affectedRows} clinic owners to admin role`);
  } catch (error) {
    console.error('Error updating roles:', error);
  } finally {
    process.exit(0);
  }
}

fixRoles();
