const authService = require('./services/auth.service');
const { pool } = require('./config/db');

async function checkDoc() {
  try {
    const q1 = "SELECT id, name, clinic_id FROM users WHERE email='doctor22@clinic.com'";
    const [rows] = await pool.query(q1);
    if (rows.length > 0) {
      console.log('Doc exists: ', rows[0]);
    } else {
      console.log('No doc, registering...');
      const user = await authService.registerUser({
        name: 'Test Doc',
        email: 'doctor22@clinic.com',
        password: 'password123',
        role: 'doctor',
        clinic_id: 1 // Assuming clinic 1 exists
      });
      console.log('Created: ', user.name, ' Clinic ID: ', user.clinic_id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
checkDoc();
