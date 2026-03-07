const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'signatures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, _file, cb) => {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(_file.originalname).toLowerCase();
    cb(null, `sig-${userId}-${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG and WEBP images are allowed for signatures'), false);
  }
};

const signatureUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 } // 200 KB max
});

module.exports = { signatureUpload };
