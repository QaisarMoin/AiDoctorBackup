// Added by Qaisar: Fix require for createResponse which is exported as part of an object
const { createResponse } = require('../utils/response.util');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // MySQL duplicate key error
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry found';
    error = { message, statusCode: 409 };
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced record not found';
    error = { message, statusCode: 400 };
  }

  // Validation error (Joi)
  if (err.isJoi) {
    const message = err.details[0].message;
    error = { message, statusCode: 400 };
  }

  // JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format';
    error = { message, statusCode: 400 };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json(
    createResponse(false, null, message, statusCode)
  );
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
