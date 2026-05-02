// routes/reviews.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { reviewController: rc } = require('../controllers/otherControllers');

router.get('/doctor/:doctorId', rc.getDoctorReviews);
router.post('/', protect, authorize('patient'), rc.createReview);
router.put('/:id/response', protect, authorize('doctor'), rc.addDoctorResponse);
router.delete('/:id', protect, rc.deleteReview);

module.exports = router;
