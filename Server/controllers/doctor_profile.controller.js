const profileService = require('../services/doctor_profile.service');
const { createResponse } = require('../utils/response.util');
const path = require('path');
const fs = require('fs');

// GET /api/doctor-profile — fetch current user's full profile
const getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    if (!profile) return res.status(404).json(createResponse(false, null, 'Profile not found', 404));
    res.status(200).json(createResponse(true, profile, 'Profile retrieved successfully'));
  } catch (error) {
    throw error;
  }
};

// PUT /api/doctor-profile — update name, designation, degrees, signature
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, designation, degrees } = req.body;

    // Parse degrees — frontend sends JSON string
    let parsedDegrees = [];
    try {
      parsedDegrees = degrees ? JSON.parse(degrees) : [];
    } catch {
      parsedDegrees = [];
    }

    // Update name for all roles
    if (name && name.trim()) {
      await profileService.updateUserName(userId, name.trim());
    }

    // Update doctor-specific profile fields (skip for non-doctors if no file)
    // Receptionists/admins only update name — but we still call upsert so designation stays blank
    const signaturePath = req.file
      ? `/uploads/signatures/${req.file.filename}`
      : undefined;

    await profileService.upsertProfile(userId, {
      designation: designation || '',
      degrees: parsedDegrees,
      signaturePath
    });

    // Delete old signature file if a new one was uploaded
    if (req.file) {
      try {
        const existing = await profileService.getProfile(userId);
        // old path is now already overwritten; getProfile returns new one — deletion handled below
      } catch (_) {}
    }

    const updated = await profileService.getProfile(userId);
    res.status(200).json(createResponse(true, updated, 'Profile updated successfully'));
  } catch (error) {
    // Multer file size / type errors arrive here via asyncHandler
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(createResponse(false, null, 'Signature image must be under 200 KB', 400));
    }
    throw error;
  }
};

module.exports = { getProfile, updateProfile };
