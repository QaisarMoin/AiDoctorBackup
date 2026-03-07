const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  passReqToCallback: true // Pass request object to callback
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Extract user information from Google profile
    const googleUser = {
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName || profile.name.givenName + ' ' + profile.name.familyName,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      profilePicture: profile.photos[0].value,
      verified: profile.emails[0].verified
    };

    // Pass user data to next middleware/controller
    return done(null, googleUser);
  } catch (error) {
    console.error('Google OAuth strategy error:', error);
    return done(error, null);
  }
}));

// Serialize user for session (required by Passport)
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session (required by Passport)
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware to check if user is authenticated via Passport
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Authentication required',
    statusCode: 401
  });
};

// Get Google OAuth authentication URL
const getGoogleAuthUrl = () => {
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  });
};

// Handle Google OAuth callback
const handleGoogleCallback = () => {
  return passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: false // We'll use JWT instead of sessions
  });
};

module.exports = {
  passport,
  ensureAuthenticated,
  getGoogleAuthUrl,
  handleGoogleCallback
};
