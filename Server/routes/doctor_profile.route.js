const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { signatureUpload } = require('../middlewares/upload.middleware');
const { getProfile, updateProfile } = require('../controllers/doctor_profile.controller');

// GET /api/doctor-profile — all authenticated roles
router.get('/', authenticateUser, asyncHandler(getProfile));

// PUT /api/doctor-profile — all authenticated roles (doctors get extra fields)
router.put(
  '/',
  authenticateUser,
  signatureUpload.single('signature'), // multer parses multipart — optional file
  asyncHandler(updateProfile)
);

module.exports = router;
