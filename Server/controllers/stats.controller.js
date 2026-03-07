const statsService = require('../services/stats.service');
const { createResponse } = require('../utils/response.util');

const getDashboardStats = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(403).json(createResponse(false, null, 'No clinic assigned to your account'));

    // Doctors see only their own patient stats; admins and receptionists see full clinic stats
    const doctorId = req.user?.role === 'doctor' ? req.user.id : null;

    const stats = await statsService.getDashboardStats(clinicId, doctorId);
    res.json(createResponse(true, stats, 'Stats fetched'));
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json(createResponse(false, null, err.message));
  }
};

module.exports = { getDashboardStats };
