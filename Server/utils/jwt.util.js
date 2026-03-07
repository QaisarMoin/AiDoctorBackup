const jwt = require('jsonwebtoken');

// Generate JWT token for authenticated user
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h', // Token expires in 24 hours
      issuer: 'audio-doctor',
      audience: 'audio-doctor-users'
    });
  } catch (error) {
    console.error('JWT generation error:', error);
    throw new Error('Failed to generate token');
  }
};

// Verify and decode JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'audio-doctor',
      audience: 'audio-doctor-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

// Extract token from Authorization header
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        statusCode: 401
      });
    }
    
    const decoded = verifyToken(token);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed',
      statusCode: 401
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  authenticateToken
};
