const bcrypt = require('bcrypt');

// Hash password using bcrypt with JWT secret as salt
const hashPassword = async (password) => {
  try {
    // Generate salt using JWT secret (consistent salt generation)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

// Compare plain password with hashed password
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Failed to compare password');
  }
};

// Generate default password for Google OAuth users
const generateDefaultPassword = () => {
  return 'Doaguru!@#123';
};

// Validate password strength (basic validation)
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }
  
  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, numbers, and special characters'
    };
  }
  
  return {
    isValid: true,
    message: 'Password meets strength requirements'
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateDefaultPassword,
  validatePasswordStrength
};
