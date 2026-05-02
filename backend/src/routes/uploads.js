const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');

// ─── Multer: memory storage, 10MB limit, images + PDFs ───────────────────────
const storage = multer.memoryStorage();

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new AppError('Only image files are allowed', 400), false);
  },
});

const certUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Only images (JPG/PNG/WEBP) and PDFs are allowed', 400), false);
  },
});

// ─── Helper: get Cloudinary instance ─────────────────────────────────────────
function getCloudinary() {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

// ─── POST /api/uploads/avatar ─────────────────────────────────────────────────
router.post('/avatar', protect, imageUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('Please upload a file', 400));

    const cloudinary = getCloudinary();
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'healing/avatars',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      public_id: `user_${req.user.id}`,
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true }
    );

    res.json({ success: true, data: { avatar: user.avatar } });
  } catch (err) { next(err); }
});

// ─── POST /api/uploads/certificates ──────────────────────────────────────────
// Doctor uploads one or more certificate documents (PDF or image).
// On first upload, certificatesSubmittedAt is stamped and profileVerified becomes true.
router.post(
  '/certificates',
  protect,
  authorize('doctor'),
  certUpload.array('certificates', 10), // up to 10 files at once
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return next(new AppError('Please upload at least one file', 400));
      }

      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return next(new AppError('Doctor profile not found', 404));

      const cloudinary = getCloudinary();
      const uploaded = [];

      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataUri = `data:${file.mimetype};base64,${b64}`;

        const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'healing/certificates',
          resource_type: resourceType,
          public_id: `cert_${req.user.id}_${Date.now()}`,
        });

        // Use the original filename (without extension) as the cert name,
        // or fall back to a generic label
        const certName = req.body[`name_${uploaded.length}`]
          || file.originalname.replace(/\.[^.]+$/, '')
          || `Certificate ${doctor.certificateDocuments.length + uploaded.length + 1}`;

        uploaded.push({
          name: certName,
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date(),
        });
      }

      // Push new certs and stamp submission time on first upload
      const isFirstUpload = doctor.certificateDocuments.length === 0;
      doctor.certificateDocuments.push(...uploaded);
      if (isFirstUpload) {
        doctor.certificatesSubmittedAt = new Date();
      }

      await doctor.save();

      res.status(201).json({
        success: true,
        message: `${uploaded.length} certificate(s) uploaded successfully. Your profile now shows as verified.`,
        data: {
          certificateDocuments: doctor.certificateDocuments,
          profileVerified: doctor.profileVerified,
          certificatesSubmittedAt: doctor.certificatesSubmittedAt,
        },
      });
    } catch (err) { next(err); }
  }
);

// ─── DELETE /api/uploads/certificates/:certId ─────────────────────────────────
// Doctor removes a specific certificate document.
router.delete(
  '/certificates/:certId',
  protect,
  authorize('doctor'),
  async (req, res, next) => {
    try {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return next(new AppError('Doctor profile not found', 404));

      const cert = doctor.certificateDocuments.id(req.params.certId);
      if (!cert) return next(new AppError('Certificate not found', 404));

      // Remove from Cloudinary
      if (cert.publicId) {
        const cloudinary = getCloudinary();
        const resourceType = cert.url.includes('/raw/') ? 'raw' : 'image';
        await cloudinary.uploader.destroy(cert.publicId, { resource_type: resourceType }).catch(() => {});
      }

      cert.remove();
      await doctor.save();

      res.json({
        success: true,
        message: 'Certificate removed',
        data: { certificateDocuments: doctor.certificateDocuments },
      });
    } catch (err) { next(err); }
  }
);

module.exports = router;
