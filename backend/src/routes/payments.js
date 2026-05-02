// routes/payments.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createPaymentIntent, webhookHandler, refundPayment, getPaymentHistory } = require('../controllers/paymentController');

router.post('/webhook', webhookHandler); // raw body, no auth
router.use(protect);
router.post('/create-intent', createPaymentIntent);
router.post('/refund/:appointmentId', authorize('admin'), refundPayment);
router.get('/history', getPaymentHistory);

module.exports = router;
