const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protect, requireRole } = require('../middleware/authMiddleware');

// POST /api/upload - Upload a file to Cloudinary
router.post('/', protect, requireRole('organizer'), upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return the Cloudinary URL
    res.status(200).json({
      success: true,
      data: {
        url: req.file.path,
        filename: req.file.filename,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
