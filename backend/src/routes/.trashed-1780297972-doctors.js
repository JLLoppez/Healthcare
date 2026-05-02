// routes/doctors.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors, getDoctor, createDoctorProfile, updateDoctorProfile,
  getDoctorAvailability, getFeaturedDoctors, getSpecializations
} = require('../controllers/doctorController');

router.get('/featured', getFeaturedDoctors);
router.get('/specializations', getSpecializations);
router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.get('/:id/availability', getDoctorAvailability);
router.post('/', protect, authorize('doctor', 'admin'), createDoctorProfile);
router.put('/:id', protect, authorize('doctor', 'admin'), updateDoctorProfile);

module.exports = router;
