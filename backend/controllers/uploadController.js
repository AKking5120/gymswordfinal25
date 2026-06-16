const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { sendSuccess, sendError } = require('../utils/helpers');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
}).single('file');

const uploadImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) return sendError(res, err.message || 'Upload failed', 400);
    if (!req.file) return sendError(res, 'No file uploaded', 400);
    return sendSuccess(res, { url: `/uploads/${req.file.filename}` }, 'Uploaded');
  });
};

module.exports = { uploadImage };
