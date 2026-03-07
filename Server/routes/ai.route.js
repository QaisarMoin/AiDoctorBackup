const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const Joi = require('joi');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// AI extraction validation schema
const aiExtractionSchema = Joi.object({
  text: Joi.string().min(1).max(10000).required(),
  language: Joi.string().valid('en', 'hindi').default('en')
});

// AI extraction endpoint - protected by authentication
router.post('/extract-medical-data',
  authMiddleware.authenticateUser,
  validate(aiExtractionSchema),
  asyncHandler(aiController.extractMedicalData)
);

module.exports = router;
