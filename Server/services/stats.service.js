const { executeQuery } = require('../config/db');

// Dashboard summary stats
// doctor_id is optional — when provided (role=doctor), stats are scoped to that doctor's patients only
const getDashboardStats = async (clinic_id, doctor_id = null) => {
  // Build conditional filter fragments
  const doctorPatientFilter = doctor_id ? ' AND doctor_id = ?' : '';
  const doctorJoinFilter    = doctor_id ? ' AND p.doctor_id = ?' : '';
  const basePatientParams   = doctor_id ? [clinic_id, doctor_id] : [clinic_id];
  const baseConsultParams   = doctor_id ? [clinic_id, doctor_id] : [clinic_id];

  // Total & today's patients
  const [patientStats] = await executeQuery(`
    SELECT 
      COUNT(*) AS total_patients,
      SUM(DATE(created_at) = CURDATE()) AS today_patients
    FROM patients
    WHERE clinic_id = ?${doctorPatientFilter}
  `, basePatientParams);

  // Consultations total
  const [consultStats] = await executeQuery(`
    SELECT COUNT(*) AS total_consultations 
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    WHERE p.clinic_id = ?${doctorJoinFilter}
  `, baseConsultParams);

  // Staff counts — always clinic-wide regardless of role
  const [staffStats] = await executeQuery(`
    SELECT
      COUNT(*) AS total_staff,
      SUM(status = 'active') AS active_staff,
      SUM(status = 'inactive') AS inactive_staff
    FROM users 
    WHERE role = 'receptionist' AND clinic_id = ?
  `, [clinic_id]);

  // Monthly patient registrations (current year)
  const monthlyData = await executeQuery(`
    SELECT 
      MONTH(created_at) AS month,
      COUNT(*) AS count
    FROM patients
    WHERE YEAR(created_at) = YEAR(CURDATE()) AND clinic_id = ?${doctorPatientFilter}
    GROUP BY month
    ORDER BY month
  `, basePatientParams);

  // Daily patient registrations (last 7 days)
  const weeklyData = await executeQuery(`
    SELECT 
      DAYOFWEEK(created_at) AS dow,
      DATE(created_at) AS date,
      COUNT(*) AS count
    FROM patients
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND clinic_id = ?${doctorPatientFilter}
    GROUP BY date, dow
    ORDER BY date
  `, basePatientParams);

  // Monthly consultations (current year)
  const monthlyConsultations = await executeQuery(`
    SELECT 
      MONTH(c.created_at) AS month,
      COUNT(*) AS count
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    WHERE YEAR(c.created_at) = YEAR(CURDATE()) AND p.clinic_id = ?${doctorJoinFilter}
    GROUP BY month
    ORDER BY month
  `, baseConsultParams);

  return {
    patients: {
      total: patientStats.total_patients || 0,
      today: patientStats.today_patients || 0,
    },
    consultations: {
      total: consultStats.total_consultations || 0,
    },
    staff: {
      total: staffStats.total_staff || 0,
      active: staffStats.active_staff || 0,
      inactive: staffStats.inactive_staff || 0,
    },
    chart: {
      monthly: monthlyData,
      weekly: weeklyData,
      monthlyConsultations,
    }
  };
};

module.exports = { getDashboardStats };
