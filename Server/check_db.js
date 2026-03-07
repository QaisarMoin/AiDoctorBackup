const { pool } = require('./config/db');
async function check() {
  const [rows] = await pool.query("SHOW COLUMNS FROM users WHERE Field = 'role'");
  console.log(rows[0]);
  process.exit(0);
}
check();
