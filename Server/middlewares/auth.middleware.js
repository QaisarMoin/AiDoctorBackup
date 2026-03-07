const jwt = require('jsonwebtoken');
const { createResponse } = require('../utils/response.util');
const { executeQuery } = require('../config/db');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authenticate user and treat as doctor (single-login model)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createResponse(false, null, 'Authorization token required', 401)
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user exists in database
      const userQuery = 'SELECT id, name, email, role, clinic_id, organization_name FROM users WHERE id = ? AND status = ?';
      const users = await executeQuery(userQuery, [decoded.id, 'active']);
      
      if (users.length === 0) {
        return res.status(401).json(
          createResponse(false, null, 'Invalid user credentials', 401)
        );
      }

      const user = users[0];

      // Attach user info as doctor info (single-login model)
      req.doctor = {
        id: user.id, // userId becomes doctorId
        name: user.name,
        email: user.email,
        role: user.role,
        clinic_id: user.clinic_id,
        organization_name: user.organization_name
      };
      
      // Also attach to req.user for generic routes
      req.user = req.doctor;
      
      next();
    } catch (jwtError) {
      return res.status(401).json(
        createResponse(false, null, 'Invalid or expired token', 401)
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(
      createResponse(false, null, 'Authentication service error', 500)
    );
  }
};

// Added by Qaisar: Middleware to restrict access based on user role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user object exists (authenticateUser must run first)
    if (!req.user || !req.user.role) {
      return res.status(403).json(
        createResponse(false, null, 'Access denied. Role not verified.', 403)
      );
    }

    // Check if the user's role is in the allowed string array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        createResponse(false, null, `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`, 403)
      );
    }

    // Role passes, proceed to controller
    next();
  };
};

module.exports = {
  authenticateUser, // This replaces authenticateDoctor
  requireRole,
  JWT_SECRET
};
