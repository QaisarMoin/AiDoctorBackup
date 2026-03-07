const { executeQuery } = require('../config/db');

// Detect queue_entered_at column (cached)
let _hasQueueCol = null;
async function hasQueueEnteredAtColumn() {
  if (_hasQueueCol !== null) return _hasQueueCol;
  const rows = await executeQuery(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' AND COLUMN_NAME = 'queue_entered_at'`
  );
  _hasQueueCol = rows[0].cnt > 0;
  return _hasQueueCol;
}

// Verify a patient by phone number
const verifyPatient = async (phone) => {
  if (!phone) throw new Error('Phone number is required');

  const useQueueCol = await hasQueueEnteredAtColumn();

  const dateFilter = useQueueCol
    ? `DATE(COALESCE(p.queue_entered_at, p.created_at)) = CURDATE() AND p.status NOT IN ('hold', 'completed', 'cancelled')`
    : `(DATE(p.created_at) = CURDATE() AND p.status != 'hold') OR (p.status IN ('in', 'in progress'))`;

  const orderCol = useQueueCol
    ? `COALESCE(p.queue_entered_at, p.created_at)`
    : `p.created_at`;

  const rows = await executeQuery(
    `SELECT p.id, p.name, p.phone, p.status, p.clinic_id, p.doctor_id,
            u.name AS doctor_name,
            ROW_NUMBER() OVER (
              PARTITION BY p.doctor_id
              ORDER BY ${orderCol} ASC
            ) AS queue_position
     FROM patients p
     LEFT JOIN users u ON p.doctor_id = u.id
     WHERE p.phone = ? AND (${dateFilter})
     LIMIT 1`,
    [phone]
  );

  if (rows.length === 0) return null;
  return rows[0];
};

// Get today's full queue for a clinic, filtered by doctor
const getTodayQueue = async (clinicId, doctorId = null) => {
  if (!clinicId) throw new Error('Clinic ID is required');

  const useQueueCol = await hasQueueEnteredAtColumn();

  const dateFilter = useQueueCol
    ? `DATE(COALESCE(p.queue_entered_at, p.created_at)) = CURDATE() AND p.status NOT IN ('hold', 'completed', 'cancelled')`
    : `(DATE(p.created_at) = CURDATE() AND p.status != 'hold') OR (p.status IN ('in', 'in progress'))`;

  const orderCol = useQueueCol
    ? `COALESCE(p.queue_entered_at, p.created_at)`
    : `p.created_at`;

  // Build optional doctor filter
  const doctorFilter = doctorId ? `AND p.doctor_id = ?` : '';
  const queryParams = doctorId ? [clinicId, doctorId] : [clinicId];

  const rows = await executeQuery(
    `SELECT p.id, p.name, p.status, p.clinic_id, p.doctor_id,
            u.name AS doctor_name,
            p.created_at,
            ROW_NUMBER() OVER (
              ORDER BY ${orderCol} ASC
            ) AS queue_position
     FROM patients p
     LEFT JOIN users u ON p.doctor_id = u.id
     WHERE p.clinic_id = ? ${doctorFilter}
       AND (${dateFilter})
     ORDER BY ${orderCol} ASC`,
    queryParams
  );

  return rows;
};

// Update patient status
const updatePatientStatus = async (patientId, clinicId, status) => {
  const VALID_STATUSES = ['in', 'in progress', 'hold', 'completed', 'cancelled'];
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const check = await executeQuery(
    'SELECT id, status, created_at FROM patients WHERE id = ? AND clinic_id = ?',
    [patientId, clinicId]
  );
  if (check.length === 0) throw new Error('Patient not found or not in your clinic');

  const previousStatus = check[0].status;
  const createdAt = check[0].created_at;

  const useQueueCol = await hasQueueEnteredAtColumn();
  
  let isRequeueing = false;
  if (status === 'in') {
      const isHoldToIn = previousStatus === 'hold';
      const isPreviousDay = createdAt && new Date(createdAt).toDateString() !== new Date().toDateString();
      // If they are from a previous day and NOT currently 'in progress' (which means we're just going 'back')
      const isOldPatientEnteringQueue = isPreviousDay && previousStatus !== 'in progress';
      isRequeueing = isHoldToIn || isOldPatientEnteringQueue;
  }

  const queueUpdate = (isRequeueing && useQueueCol) ? ', queue_entered_at = NOW()' : '';

  await executeQuery(
    `UPDATE patients SET status = ?, updated_at = NOW()${queueUpdate} WHERE id = ?`,
    [status, patientId]
  );

  return { id: patientId, status };
};

module.exports = { verifyPatient, getTodayQueue, updatePatientStatus };
