// ─── Review Controller ────────────────────────────────────────────────────────
const { Review } = require('../models/ReviewPrescription');
const { Prescription } = require('../models/ReviewPrescription');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');

const reviewController = {
  // GET /api/reviews/doctor/:doctorId
  getDoctorReviews: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
      const total = await Review.countDocuments({ doctor: req.params.doctorId, isPublic: true });
      const reviews = await Review.find({ doctor: req.params.doctorId, isPublic: true })
        .populate('patient', 'name avatar')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      res.json({ success: true, count: reviews.length, total, data: reviews });
    } catch (err) { next(err); }
  },

  // POST /api/reviews
  createReview: async (req, res, next) => {
    try {
      const { appointmentId, rating, title, body, categories } = req.body;
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return next(new AppError('Appointment not found', 404));
      if (appointment.patient.toString() !== req.user.id) {
        return next(new AppError('Not authorized', 403));
      }
      if (appointment.status !== 'completed') {
        return next(new AppError('Can only review completed appointments', 400));
      }

      const existing = await Review.findOne({ appointment: appointmentId });
      if (existing) return next(new AppError('You have already reviewed this appointment', 400));

      const review = await Review.create({
        patient: req.user.id,
        doctor: appointment.doctor,
        appointment: appointmentId,
        rating, title, body, categories
      });

      appointment.rating = review._id;
      await appointment.save();

      res.status(201).json({ success: true, data: review });
    } catch (err) { next(err); }
  },

  // PUT /api/reviews/:id/response (doctor responds)
  addDoctorResponse: async (req, res, next) => {
    try {
      const review = await Review.findById(req.params.id);
      if (!review) return next(new AppError('Review not found', 404));

      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor || review.doctor.toString() !== doctor._id.toString()) {
        return next(new AppError('Not authorized', 403));
      }

      review.doctorResponse = { text: req.body.text, respondedAt: new Date() };
      await review.save();
      res.json({ success: true, data: review });
    } catch (err) { next(err); }
  },

  // DELETE /api/reviews/:id
  deleteReview: async (req, res, next) => {
    try {
      const review = await Review.findById(req.params.id);
      if (!review) return next(new AppError('Review not found', 404));
      if (review.patient.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Not authorized', 403));
      }
      await review.remove();
      res.json({ success: true, message: 'Review deleted' });
    } catch (err) { next(err); }
  }
};

// ─── Video Controller ─────────────────────────────────────────────────────────
const videoController = {
  // POST /api/video/create-room
  createRoom: async (req, res, next) => {
    try {
      const { appointmentId } = req.body;
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return next(new AppError('Appointment not found', 404));

      // Create Daily.co room via API
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
        },
        body: JSON.stringify({
          name: `healing-${appointment.appointmentId}`,
          properties: {
            exp: Math.round(Date.now() / 1000) + 3600, // 1 hour
            max_participants: 2,
            enable_recording: false,
            start_video_off: false,
            start_audio_off: false
          }
        })
      });

      const room = await response.json();

      appointment.videoSession = {
        roomId: room.name,
        roomUrl: room.url,
        token: null
      };
      await appointment.save();

      res.json({ success: true, data: { roomUrl: room.url, roomId: room.name } });
    } catch (err) { next(err); }
  },

  // GET /api/video/token/:appointmentId
  getRoomToken: async (req, res, next) => {
    try {
      const appointment = await Appointment.findById(req.params.appointmentId);
      if (!appointment?.videoSession?.roomId) {
        return next(new AppError('Video room not created yet', 404));
      }

      // Create meeting token
      const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
        },
        body: JSON.stringify({
          properties: {
            room_name: appointment.videoSession.roomId,
            user_id: req.user.id,
            user_name: req.user.name,
            exp: Math.round(Date.now() / 1000) + 3600,
            is_owner: req.user.role === 'doctor'
          }
        })
      });

      const tokenData = await response.json();
      res.json({ success: true, data: { token: tokenData.token, roomUrl: appointment.videoSession.roomUrl } });
    } catch (err) { next(err); }
  }
};

// ─── Prescription Controller ──────────────────────────────────────────────────
const prescriptionController = {
  // GET /api/prescriptions (patient: own, doctor: issued)
  getPrescriptions: async (req, res, next) => {
    try {
      const filter = {};
      if (req.user.role === 'patient') filter.patient = req.user.id;
      else if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ user: req.user.id });
        filter.doctor = doctor?._id;
      }

      const prescriptions = await Prescription.find(filter)
        .populate('patient', 'name email avatar dateOfBirth')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
        .populate('appointment', 'appointmentId scheduledAt')
        .sort('-issuedAt');

      res.json({ success: true, data: prescriptions });
    } catch (err) { next(err); }
  },

  // POST /api/prescriptions
  createPrescription: async (req, res, next) => {
    try {
      if (req.user.role !== 'doctor') return next(new AppError('Only doctors can create prescriptions', 403));
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return next(new AppError('Doctor profile not found', 404));

      const rx = await Prescription.create({ ...req.body, doctor: doctor._id });
      const populated = await Prescription.findById(rx._id)
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } });

      res.status(201).json({ success: true, data: populated });
    } catch (err) { next(err); }
  },

  // GET /api/prescriptions/:id
  getPrescription: async (req, res, next) => {
    try {
      const rx = await Prescription.findById(req.params.id)
        .populate('patient', 'name email dateOfBirth bloodType allergies')
        .populate({ path: 'doctor', populate: { path: 'user', select: 'name email' } });

      if (!rx) return next(new AppError('Prescription not found', 404));

      const doctor = req.user.role === 'doctor' ? await Doctor.findOne({ user: req.user.id }) : null;
      const isOwner = rx.patient._id.toString() === req.user.id;
      const isIssuer = doctor && rx.doctor._id.toString() === doctor._id.toString();

      if (!isOwner && !isIssuer && req.user.role !== 'admin') {
        return next(new AppError('Not authorized', 403));
      }

      res.json({ success: true, data: rx });
    } catch (err) { next(err); }
  }
};

// ─── Admin Controller ─────────────────────────────────────────────────────────
const User = require('../models/User');

const adminController = {
  // GET /api/admin/stats
  getDashboardStats: async (req, res, next) => {
    try {
      const [totalUsers, totalDoctors, totalAppointments, pendingVerifications] = await Promise.all([
        User.countDocuments({ role: 'patient' }),
        Doctor.countDocuments(),
        Appointment.countDocuments(),
        Doctor.countDocuments({ isVerified: false })
      ]);

      const revenueData = await Appointment.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]);

      const appointmentsByStatus = await Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: last30Days } });
      const appointmentsThisMonth = await Appointment.countDocuments({ createdAt: { $gte: last30Days } });

      res.json({
        success: true,
        data: {
          totalUsers,
          totalDoctors,
          totalAppointments,
          pendingVerifications,
          totalRevenue: revenueData[0]?.total || 0,
          newUsersThisMonth,
          appointmentsThisMonth,
          appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      });
    } catch (err) { next(err); }
  },

  // PUT /api/admin/doctors/:id/verify
  verifyDoctor: async (req, res, next) => {
    try {
      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        { isVerified: req.body.isVerified, verifiedAt: new Date(), verifiedBy: req.user.id },
        { new: true }
      ).populate('user', 'name email');

      if (!doctor) return next(new AppError('Doctor not found', 404));
      res.json({ success: true, data: doctor });
    } catch (err) { next(err); }
  },

  // GET /api/admin/users
  getUsers: async (req, res, next) => {
    try {
      const { role, page = 1, limit = 20, search } = req.query;
      const filter = {};
      if (role) filter.role = role;
      if (search) filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];

      const total = await User.countDocuments(filter);
      const users = await User.find(filter)
        .sort('-createdAt')
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

      res.json({ success: true, total, data: users });
    } catch (err) { next(err); }
  },

  // PATCH /api/admin/users/:id/toggle-active
  toggleUserActive: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return next(new AppError('User not found', 404));
      user.isActive = !user.isActive;
      await user.save({ validateBeforeSave: false });
      res.json({ success: true, data: { isActive: user.isActive } });
    } catch (err) { next(err); }
  }
};

module.exports = { reviewController, videoController, prescriptionController, adminController };
