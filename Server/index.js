const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { passport } = require('./config/passport');
const healthRoutes = require('./routes/health.route');
const consultationRoutes = require('./routes/consultation.route');
const authRoutes = require('./routes/auth.route');
const patientRoutes = require('./routes/patient.route');
const aiRoutes = require('./routes/ai.route');
const staffRoutes = require('./routes/staff.route');
const statRoutes = require('./routes/stat.route');
const { errorHandler } = require('./middlewares/error.middleware');
const doctorProfileRoutes = require('./routes/doctor_profile.route');
const queueRoutes = require('./routes/queue.route');  // Patient waiting queue
const clinicSettingRoutes = require('./routes/clinicSetting.routes'); // Clinic customization settings
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5050;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://aidoctorassist.dentalguru.software',
      'https://www.aidoctorassist.dentalguru.software'
    ];
    // Allow no-origin requests (Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for Passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/patient', patientRoutes);

// Added by Qaisar: Mount auth routes under API
app.use('/api/auth', authRoutes);

app.use('/api/ai', aiRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/stat', statRoutes);
app.use('/api/doctor-profile', doctorProfileRoutes);
app.use('/api/queue', queueRoutes);  // Public patient waiting queue
app.use('/api/settings', clinicSettingRoutes); // Clinic custom medicines, tests, vitals

// Serve uploaded files (signatures, etc.) as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('--- EXPRESS UNHANDLED ERROR ---', err);
  errorHandler(err, req, res, next);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Starting server without database connection');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

const cron = require('node-cron');
const patientService = require('./services/patient.service');

// Default Express logic
startServer();

// --- CRON JOBS ---
// Run every minute (for testing/development) to clear out the queue for the next day
cron.schedule('* * * * *', async () => {
  console.log('--- 🕛 Running Cron Job: Migrating Stale Patients ---');
  try {
    const migratedCount = await patientService.migrateAllStalePatientsToHold();
    if (migratedCount > 0) {
      console.log(`✅ Cron Job Success: Migrated ${migratedCount} stale patients to 'hold'`);
    }
  } catch (error) {
    console.error('❌ Cron Job Failed:', error.message);
  }
});

module.exports = app;