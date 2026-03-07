const { pool, executeQuery } = require('../config/db');
const { hashPassword, generateDefaultPassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');

// Find user by email
const findUserByEmail = async (email) => {
  try {
    const query = `
      SELECT id, name, email, gender, organization_name, password, status, 
             google_id, profile_picture, email_verified, role, clinic_id, created_at, updated_at
      FROM users 
      WHERE email = ?
    `;
    
    const users = await executeQuery(query, [email]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Find user by Google ID
const findUserByGoogleId = async (googleId) => {
  try {
    const query = `
      SELECT id, name, email, gender, organization_name, password, status, 
             google_id, profile_picture, email_verified, role, clinic_id, created_at, updated_at
      FROM users 
      WHERE google_id = ?
    `;
    
    const users = await executeQuery(query, [googleId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error finding user by Google ID:', error);
    throw error;
  }
};

// Create new user from Google OAuth
const createGoogleUser = async (googleProfile) => {
  try {
    const { email, name, googleId, profilePicture, verified } = googleProfile;
    
    // Generate default password and hash it
    const defaultPassword = generateDefaultPassword();
    const hashedPassword = await hashPassword(defaultPassword);
    
    const query = `
      INSERT INTO users (
        name, email, password, status, google_id, profile_picture, 
        email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      name,
      email,
      hashedPassword,
      googleId,
      profilePicture || null,
      verified || false
    ];
    
    const result = await executeQuery(query, params);
    
    // Return the created user without password
    return await findUserByEmail(email);
  } catch (error) {
    console.error('Error creating Google user:', error);
    throw error;
  }
};

// Handle Google OAuth login/registration
const handleGoogleAuth = async (googleProfile) => {
  try {
    const { email, googleId } = googleProfile;
    
    // First check if user exists by Google ID
    let user = await findUserByGoogleId(googleId);
    
    if (user) {
      // User exists with Google ID - check status
      if (user.status !== 'active') {
        throw new Error('Your account is deactivated. Please contact Doaguru Team.');
      }
      
      console.log('Existing Google user logged in:', email);
      return user;
    }
    
    // Check if user exists by email (might have been created manually)
    user = await findUserByEmail(email);
    
    if (user) {
      // User exists by email but no Google ID - update with Google ID
      const updateQuery = `
        UPDATE users 
        SET google_id = ?, profile_picture = ?, email_verified = ?, updated_at = NOW()
        WHERE id = ?
      `;
      
      await executeQuery(updateQuery, [
        googleId,
        googleProfile.profilePicture || user.profile_picture,
        googleProfile.verified || user.email_verified,
        user.id
      ]);
      
      // Check status
      if (user.status !== 'active') {
        throw new Error('Your account is deactivated. Please contact Doaguru Team.');
      }
      
      console.log('Existing email user linked to Google:', email);
      return await findUserByEmail(email);
    }
    
    // User doesn't exist - create new user
    console.log('Creating new Google user:', email);
    user = await createGoogleUser(googleProfile);
    
    return user;
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

// Generate user response with JWT token
const generateAuthResponse = (user) => {
  try {
    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    
    // Added by Qaisar: Determine accessible modules based on role (same as getProfile)
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

    // Attach to user payload
    userWithoutPassword.accessible_modules = accessible_modules;
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clinic_id: user.clinic_id
    });
    
    return {
      user: userWithoutPassword,
      token,
      expiresIn: '24h'
    };
  } catch (error) {
    console.error('Error generating auth response:', error);
    throw error;
  }
};

// Logout user (dummy implementation for now)
const logoutUser = async () => {
  // In a real implementation, you might:
  // - Add token to blacklist
  // - Clear session data
  // - Update last logout time
  
  console.log('User logged out successfully');
  return { message: 'Logged out successfully' };
};

// Added by Qaisar: Register a new user with email and password, creating a clinic if Doctor
const registerUser = async (userData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { email, password, name, gender, organization_name, role, clinic_name, clinic_address, clinic_phone, clinic_id, mobile_number } = userData;

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = ?';
    const [existingUsers] = await connection.query(existingUserQuery, [email]);
    if (existingUsers.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Default to 'doctor' unless explicitly provided
    let userRole = 'doctor';
    if (role === 'receptionist' || role === 'Receptionist') userRole = 'receptionist';
    else if (role === 'admin' || role === 'Admin') userRole = 'admin';

    // Insert user into database
    const insertUserQuery = `
      INSERT INTO users (
        name, email, password, gender, organization_name, mobile_number, status,
        email_verified, role, clinic_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', false, ?, ?, NOW(), NOW())
    `;
    // For receptionists and doctors registered by an admin, they MUST have a clinic_id assigned
    const finalClinicId = (userRole === 'receptionist' || userRole === 'doctor') ? (clinic_id || null) : null;
    
    const userParams = [
      name, email, hashedPassword, gender || null, organization_name || null, mobile_number || null, userRole, finalClinicId
    ];
    
    const [userResult] = await connection.query(insertUserQuery, userParams);
    const newUserId = userResult.insertId;

    // If the user is an admin, they are creating a new clinic
    if (userRole === 'admin') {
      const insertClinicQuery = `
        INSERT INTO clinics (name, address, phone, doctor_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      // Fallback names if frontend hasn't sent clinic specific fields yet
      const cName = clinic_name || organization_name || `${name}'s Clinic`;
      
      const [clinicResult] = await connection.query(insertClinicQuery, [
        cName, clinic_address || null, clinic_phone || null, newUserId
      ]);
      const newClinicId = clinicResult.insertId;

      // Update the user's clinic_id to link them to their newly created clinic
      await connection.query('UPDATE users SET clinic_id = ? WHERE id = ?', [newClinicId, newUserId]);
    }

    // Return the created user
    await connection.commit();
    return await findUserByEmail(email);
  } catch (error) {
    await connection.rollback();
    console.error('Error registering user:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Added by Qaisar: Login user with email and password
const loginUser = async (email, password) => {
  try {
    // Find user by email
    const user = await findUserByEmail(email);
    
    // If no user found, return null (handled by controller as invalid credentials)
    if (!user) {
      return null;
    }

    // Checking if user has a password (they might be a Google-only auth user if they haven't set a password)
    if (!user.password) {
       throw new Error('Please login with Google.');
    }

    // Compare provided password with hashed password
    const isMatch = await require('../utils/password.util').comparePassword(password, user.password);
    
    if (!isMatch) {
      return null;
    }

    // Check user status
    if (user.status !== 'active') {
      throw new Error('Your account is deactivated. Please contact Doaguru Team.');
    }

    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserByGoogleId,
  createGoogleUser,
  handleGoogleAuth,
  generateAuthResponse,
  logoutUser,
  registerUser,
  loginUser
};
