const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticateToken } = require('../utils/jwt.util');

router.get('/dashboard', authenticateToken, statsController.getDashboardStats);

module.exports = router;
