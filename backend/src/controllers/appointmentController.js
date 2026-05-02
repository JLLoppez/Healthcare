const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/sendEmail');

// @desc    Get appointments (patient sees theirs, doctor sees theirs, admin sees all)
// @route   GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const { status, type, from, to, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) return next(new AppError('Doctor profile not found', 404));
      filter.doctor = doctor._id;
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to) filter.scheduledAt.$lte = new Date(to);
    }

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email avatar phone')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .sort('-scheduledAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: appointments.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: appointments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email avatar phone dateOfBirth bloodType allergies medicalHistory')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar email phone' } })
      .populate('rating');

    if (!appointment) return next(new AppError('Appointment not found', 404));

    // Access control
    const doctorProfile = req.user.role === 'doctor'
      ? await Doctor.findOne({ user: req.user.id })
      : null;

    const isPatient = appointment.patient._id.toString() === req.user.id;
    const isDoctor = doctorProfile && appointment.doctor._id.toString() === doctorProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return next(new AppError('Not authorized', 403));
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// @desc    Book appointment
// @route   POST /api/appointments
exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, scheduledAt, type, reason, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('user');
    if (!doctor) return next(new AppError('Doctor not found', 404));
    if (!doctor.isAcceptingPatients) return next(new AppError('Doctor is not accepting patients', 400));

    // Check slot availability
    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart.getTime() + (doctor.slotDuration || 30) * 60000);

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      status: { $nin: ['cancelled', 'no-show', 'rescheduled'] },
      scheduledAt: { $lt: slotEnd },
      endTime: { $gt: slotStart }
    });

    if (conflict) return next(new AppError('This time slot is already booked', 409));

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      scheduledAt,
      type: type || 'video',
      reason,
      symptoms,
      duration: doctor.slotDuration || 30,
      payment: {
        amount: doctor.consultationFee,
        currency: doctor.currency || 'USD',
        status: 'pending'
      }
    });

    // Increment doctor stats
    await Doctor.findByIdAndUpdate(doctorId, { $inc: { totalAppointments: 1 } });

    // Notifications
    try {
      const patient = await User.findById(req.user.id);
      await sendEmail({
        email: patient.email,
        subject: 'Appointment Booked - Healing',
        template: 'appointmentConfirmation',
        data: {
          patientName: patient.name,
          doctorName: doctor.user.name,
          scheduledAt: new Date(scheduledAt).toLocaleString(),
          appointmentId: appointment.appointmentId,
          type
        }
      });
    } catch (e) { /* non-blocking */ }

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email avatar')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Update appointment status (confirm, cancel, complete, etc.)
// @route   PATCH /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError('Appointment not found', 404));

    const doctorProfile = req.user.role === 'doctor'
      ? await Doctor.findOne({ user: req.user.id })
      : null;

    const isPatient = appointment.patient.toString() === req.user.id;
    const isDoctor = doctorProfile && appointment.doctor.toString() === doctorProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Role-based status transitions
    const allowedTransitions = {
      patient: ['cancelled'],
      doctor: ['confirmed', 'cancelled', 'completed', 'no-show', 'in-progress'],
      admin: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show', 'in-progress', 'rescheduled']
    };

    const userRole = isAdmin ? 'admin' : isDoctor ? 'doctor' : isPatient ? 'patient' : null;
    if (!userRole) return next(new AppError('Not authorized', 403));
    if (!allowedTransitions[userRole].includes(status)) {
      return next(new AppError(`Cannot set status to '${status}'`, 403));
    }

    appointment.status = status;
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = req.user.id;
    }
    if (notes) appointment.notes = { ...appointment.notes, ...notes };
    await appointment.save();

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    const original = await Appointment.findById(req.params.id);
    if (!original) return next(new AppError('Appointment not found', 404));

    const isPatient = original.patient.toString() === req.user.id;
    const doctorProfile = req.user.role === 'doctor'
      ? await Doctor.findOne({ user: req.user.id }) : null;
    const isDoctor = doctorProfile && original.doctor.toString() === doctorProfile._id.toString();

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    original.status = 'rescheduled';
    await original.save();

    const newAppointment = await Appointment.create({
      patient: original.patient,
      doctor: original.doctor,
      scheduledAt,
      type: original.type,
      reason: original.reason,
      duration: original.duration,
      payment: original.payment,
      rescheduledFrom: original._id
    });

    res.json({ success: true, data: newAppointment, message: 'Appointment rescheduled' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add doctor notes to appointment
// @route   PATCH /api/appointments/:id/notes
exports.addDoctorNotes = async (req, res, next) => {
  try {
    const { doctorNotes, diagnosis, followUpRequired, followUpDate, privateNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError('Appointment not found', 404));

    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile || appointment.doctor.toString() !== doctorProfile._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    appointment.notes = {
      ...appointment.notes,
      ...(doctorNotes && { doctor: doctorNotes }),
      ...(privateNotes && { private: privateNotes })
    };
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (typeof followUpRequired !== 'undefined') appointment.followUpRequired = followUpRequired;
    if (followUpDate) appointment.followUpDate = followUpDate;

    await appointment.save();
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/appointments/upcoming
exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const filter = {
      scheduledAt: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    };

    if (req.user.role === 'patient') {
      filter.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: req.user.id });
      filter.doctor = doctor?._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email avatar')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name avatar' } })
      .sort('scheduledAt')
      .limit(10);

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
};
