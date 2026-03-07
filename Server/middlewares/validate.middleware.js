const Joi = require('joi');
// Added by Qaisar: Fix require for createResponse which is exported as part of an object
const { createResponse } = require('../utils/response.util');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return res.status(400).json(
        createResponse(false, null, `Validation error: ${errorMessage}`, 400)
      );
    }

    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Patient validation schema
  patient: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    age: Joi.number().integer().min(0).max(150).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    // Phone is optional — voice input may produce non-numeric text, so we allow any string
    phone: Joi.string().max(30).optional().allow('', null),
    email: Joi.string().email().optional().allow('', null),
    address: Joi.string().max(500).optional().allow('', null),
    chief_complaint: Joi.string().optional().allow('', null),
    // Allow doctor_id and status to pass through from frontend
    doctor_id: Joi.number().integer().positive().optional().allow(null),
    status: Joi.string().optional().allow('', null)
  }),

  // Consultation validation schema - aligned with frontend Doctor module
  consultation: Joi.object({
    patientId: Joi.number().integer().positive().required(),
    diagnosisProvisional: Joi.string().min(1).max(1000).required(),
    diagnosisNotes: Joi.string().max(2000).optional().allow(''),
    testsRecommended: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        name: Joi.string().min(1).max(100).required(),
        category: Joi.string().valid('blood', 'imaging', 'laboratory', 'cardiac', 'other').required(),
        urgency: Joi.string().valid('routine', 'urgent', 'stat').default('routine'),
        instructions: Joi.string().max(500).optional().allow('')
      })
    ).optional().default([]),
    medications: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        name: Joi.string().min(1).max(100).required(),
        dosage: Joi.string().min(1).max(50).required(),
        timing: Joi.array()
          .items(Joi.string().valid('morning', 'afternoon', 'evening', 'night'))
          .min(1)
          .required(),
        foodRelation: Joi.string().valid('beforeFood', 'afterFood', 'withFood', 'noRelation').required(),
        duration: Joi.string().min(1).max(50).required(),
        instructions: Joi.string().max(500).optional().allow('')
      })
    ).optional().default([]),
    doctorAdvice: Joi.string().max(2000).optional().allow(''),
    followUpDays: Joi.number().integer().min(1).max(365).default(7),
    followUpInstructions: Joi.string().max(500).optional().allow(''),
    voiceTranscript: Joi.string().max(10000).optional().allow(''),
    aiAnalysis: Joi.object().optional().allow(null)
  }),

  // Consultation query parameters
  consultationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

module.exports = {
  validate,
  validatePatient: validate(schemas.patient),
  validateConsultation: validate(schemas.consultation),
  validateConsultationQuery: validate(schemas.consultationQuery, 'query'),
  schemas
};
