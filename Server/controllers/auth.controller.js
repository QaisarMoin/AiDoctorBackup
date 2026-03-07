const authService = require('../services/auth.service');
const { createResponse } = require('../utils/response.util');

// Handle Google OAuth success callback
const googleAuthCallback = async (req, res) => {
  try {
    // Get user data from Passport (attached by Google strategy)
    const googleProfile = req.user;
    
    if (!googleProfile) {
      return res.status(400).json(
        createResponse(false, null, 'Google authentication failed', 400)
      );
    }
    
    // Handle Google OAuth (login or registration)
    const user = await authService.handleGoogleAuth(googleProfile);
    
    // Generate auth response with JWT token
    const authResponse = await authService.generateAuthResponse(user);
    
    // Redirect to frontend with token and user data
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?success=true&token=${authResponse.token}&user=${encodeURIComponent(JSON.stringify(authResponse.user))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google auth callback error:', error);
    
    // Handle specific error for inactive users
    if (error.message.includes('deactivated')) {
      const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?success=false&error=${encodeURIComponent(error.message)}`;
      return res.redirect(redirectUrl);
    }
    
    // Handle other errors
    const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?success=false&error=${encodeURIComponent('Authentication failed. Please try again.')}`;
    res.redirect(redirectUrl);
  }
};

// Handle Google OAuth failure
const googleAuthFailure = (req, res) => {
  const error = req.query.error || 'Authentication failed';
  const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?success=false&error=${encodeURIComponent(error)}`;
  
  res.redirect(redirectUrl);
};

// Logout user (dummy implementation)
const logout = async (req, res) => {
  try {
    await authService.logoutUser();
    
    res.status(200).json(
      createResponse(true, null, 'Logged out successfully')
    );
  } catch (error) {
    console.error('Logout error:', error);
    
    res.status(500).json(
      createResponse(false, null, 'Logout failed', 500)
    );
  }
};

// Get current user profile (protected route)
const getProfile = async (req, res) => {
  try {
    // User is attached to request by JWT middleware
    const userId = req.user.id;
    
    // Get user from database (without password)
    const user = await authService.findUserByEmail(req.user.email);
    
    if (!user) {
      return res.status(404).json(
        createResponse(false, null, 'User not found', 404)
      );
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    // Added by Qaisar: Determine accessible modules based on role
    let accessible_modules = [];
    if (user.role === 'receptionist') {
      accessible_modules = ['new_consultation', 'patient_records'];
    } else if (user.role === 'admin') {
      // Clinic admins get all access
      accessible_modules = ['new_consultation', 'doctor_assistant', 'register_doctor', 'register_receptionist', 'patient_records'];
    } else {
      // Default to doctor
      accessible_modules = ['new_consultation', 'doctor_assistant', 'register_receptionist', 'patient_records'];
    }
    
    res.status(200).json(
      createResponse(true, { ...userWithoutPassword, accessible_modules }, 'Profile retrieved successfully')
    );
  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json(
      createResponse(false, null, 'Failed to retrieve profile', 500)
    );
  }
};

// Health check for auth service
const authHealthCheck = async (req, res) => {
  try {
    res.status(200).json(
      createResponse(true, {
        service: 'authentication',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        googleOAuth: {
          configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          callbackUrl: process.env.GOOGLE_CALLBACK_URL
        }
      }, 'Authentication service is healthy')
    );
  } catch (error) {
    console.error('Auth health check error:', error);
    
    res.status(500).json(
      createResponse(false, null, 'Authentication service unhealthy', 500)
    );
  }
};

// Added by Qaisar: Local authentication - Register
const register = async (req, res) => {
  try {
    const userData = req.body;
    
    // Basic validation
    if (!userData.email || !userData.password || !userData.name) {
      return res.status(400).json(
        createResponse(false, null, 'Name, email, and password are required', 400)
      );
    }

    // Call service to register
    const user = await authService.registerUser(userData);
    
    // Generate auth response with JWT token
    const authResponse = authService.generateAuthResponse(user);
    
    res.status(201).json(
      createResponse(true, authResponse, 'Registration successful', 201)
    );
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'Email already registered') {
       return res.status(409).json(
         createResponse(false, null, error.message, 409)
       );
    }
    
    res.status(500).json(
      createResponse(false, null, 'Registration failed', 500)
    );
  }
};

// Added by Qaisar: Local authentication - Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json(
        createResponse(false, null, 'Email and password are required', 400)
      );
    }

    // Call service to login
    const user = await authService.loginUser(email, password);
    
    if (!user) {
      return res.status(401).json(
        createResponse(false, null, 'Invalid email or password', 401)
      );
    }
    
    // Generate auth response with JWT token
    const authResponse = authService.generateAuthResponse(user);
    
    res.status(200).json(
      createResponse(true, authResponse, 'Login successful')
    );
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('deactivated') || error.message.includes('login with Google')) {
      return res.status(403).json(
        createResponse(false, null, error.message, 403)
      );
    }
    
    res.status(500).json(
      createResponse(false, null, 'Login failed', 500)
    );
  }
};

// Added by Qaisar: Register Receptionist controller (Restricted endpoint)
const registerReceptionist = async (req, res) => {
  try {
    const userData = req.body;
    
    // Basic validation
    if (!userData.email || !userData.password || !userData.name) {
      return res.status(400).json(
        createResponse(false, null, 'Name, email, and password are required', 400)
      );
    }

    // Attempt to register the receptionist role through the service layer
    const user = await authService.registerReceptionist(userData);
    
    // Generate auth response if we want the token immediately (optional for receptionists being created by doctors, but commonly expected format)
    const authResponse = authService.generateAuthResponse(user);
    
    res.status(201).json(
      createResponse(true, authResponse, 'Receptionist registered successfully', 201)
    );
  } catch (error) {
    console.error('Receptionist Registration error:', error);
    if (error.message === 'Email already registered') {
       return res.status(409).json(
         createResponse(false, null, error.message, 409)
       );
    }
    
    res.status(500).json(
      createResponse(false, null, 'Receptionist Registration failed', 500)
    );
  }
};

module.exports = {
  googleAuthCallback,
  googleAuthFailure,
  logout,
  getProfile,
  authHealthCheck,
  register,
  login,
  registerReceptionist
};