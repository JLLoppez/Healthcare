const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');

// @desc    Create payment intent for appointment
// @route   POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

    if (!appointment) return next(new AppError('Appointment not found', 404));
    if (appointment.patient.toString() !== req.user.id) {
      return next(new AppError('Not authorized', 403));
    }
    if (appointment.payment.status === 'paid') {
      return next(new AppError('This appointment has already been paid', 400));
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(appointment.payment.amount * 100), // cents
      currency: appointment.payment.currency.toLowerCase(),
      metadata: {
        appointmentId: appointment._id.toString(),
        patientId: req.user.id,
        doctorId: appointment.doctor._id.toString()
      },
      description: `Consultation with ${appointment.doctor.user.name} - ${appointment.appointmentId}`,
      automatic_payment_methods: { enabled: true }
    });

    appointment.payment.stripePaymentIntentId = paymentIntent.id;
    await appointment.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: appointment.payment.amount,
      currency: appointment.payment.currency
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
exports.webhookHandler = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const appointment = await Appointment.findOne({
        'payment.stripePaymentIntentId': pi.id
      });
      if (appointment) {
        appointment.payment.status = 'paid';
        appointment.payment.paidAt = new Date();
        appointment.status = 'confirmed';
        await appointment.save();
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await Appointment.findOneAndUpdate(
        { 'payment.stripePaymentIntentId': pi.id },
        { 'payment.status': 'failed' }
      );
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object;
      await Appointment.findOneAndUpdate(
        { 'payment.stripeChargeId': charge.id },
        { 'payment.status': 'refunded', 'payment.refundedAt': new Date() }
      );
      break;
    }
  }

  res.json({ received: true });
};

// @desc    Refund appointment payment
// @route   POST /api/payments/refund/:appointmentId
exports.refundPayment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return next(new AppError('Appointment not found', 404));
    if (appointment.payment.status !== 'paid') {
      return next(new AppError('This appointment has not been paid', 400));
    }

    const refund = await stripe.refunds.create({
      payment_intent: appointment.payment.stripePaymentIntentId,
      reason: req.body.reason || 'requested_by_customer'
    });

    appointment.payment.status = 'refunded';
    appointment.payment.refundedAt = new Date();
    await appointment.save();

    res.json({ success: true, message: 'Refund processed', refundId: refund.id });
  } catch (err) {
    next(err);
  }
};

// @desc    Get payment history for patient
// @route   GET /api/payments/history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user.id,
      'payment.status': { $in: ['paid', 'refunded'] }
    })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .select('appointmentId scheduledAt payment type status')
      .sort('-payment.paidAt');

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};
