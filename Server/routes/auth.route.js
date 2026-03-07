const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../utils/jwt.util');
const { getGoogleAuthUrl, handleGoogleCallback } = require('../config/passport');

// Google OAuth initiation
router.get('/google', getGoogleAuthUrl());

// Google OAuth callback
router.get('/google/callback', handleGoogleCallback(), authController.googleAuthCallback);

// Google OAuth failure
router.get('/google/failure', authController.googleAuthFailure);

// Added by Qaisar: Local Email/Password Registration
router.post('/register', authController.register);

// Added by Qaisar: Local Email/Password Login
router.post('/login', authController.login);

// Logout endpoint
router.post('/logout', authController.logout);

// Protected route - Get current user profile
router.get('/profile', authenticateToken, authController.getProfile);

// Auth service health check
router.get('/health', authController.authHealthCheck);

module.exports = router;
