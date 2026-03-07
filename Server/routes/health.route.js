const express = require('express');
const router = express.Router();

// Simple health check route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    const { testConnection } = require('../config/db');
    const isConnected = await testConnection();
    
    res.status(200).json({
      success: true,
      message: isConnected ? 'Database connected' : 'Database connection failed',
      database: {
        connected: isConnected,
        host: process.env.DB_HOST || 'localhost',
        name: process.env.DB_NAME || 'audio_doctor'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
