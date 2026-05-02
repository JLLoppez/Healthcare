const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Get all doctors (with filtering, sorting, pagination)
// @route   GET /api/doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const {
      specialization, minRating, maxFee, minFee, city,
      isAcceptingPatients, telemedicine, search,
      sort = '-averageRating', page = 1, limit = 12
    } = req.query;

    const filter = { isVerified: true };
    if (specialization) filter.specialization = specialization;
    if (minRating) filter.averageRating = { $gte: parseFloat(minRating) };
    if (minFee || maxFee) {
      filter.consultationFee = {};
      if (minFee) filter.consultationFee.$gte = parseFloat(minFee);
      if (maxFee) filter.consultationFee.$lte = parseFloat(maxFee);
    }
    if (city) filter['hospital.city'] = { $regex: city, $options: 'i' };
    if (isAcceptingPatients === 'true') filter.isAcceptingPatients = true;
    if (telemedicine === 'true') filter.telemedicineEnabled = true;

    let query = Doctor.find(filter).populate('user', 'name email avatar phone');

    // Full-text search
    if (search) {
      query = Doctor.find({ ...filter, $text: { $search: search } })
        .populate('user', 'name email avatar phone')
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Sort options
      const sortMap = {
        '-averageRating': '-averageRating',
        'rating': '-averageRating',
        'fee_asc': 'consultationFee',
        'fee_desc': '-consultationFee',
        'experience': '-experience',
        'newest': '-createdAt'
      };
      query = query.sort(sortMap[sort] || sort);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Doctor.countDocuments(filter);
    const doctors = await query.skip(skip).limit(parseInt(limit));

    res.json({
      success: true,
      count: doctors.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: doctors
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'name email avatar phone gender dateOfBirth');

    if (!doctor) return next(new AppError('Doctor not found', 404));

    // Increment profile views
    await Doctor.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });

    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// @desc    Create doctor profile
// @route   POST /api/doctors
exports.createDoctorProfile = async (req, res, next) => {
  try {
    const existing = await Doctor.findOne({ user: req.user.id });
    if (existing) return next(new AppError('Doctor profile already exists', 400));

    const doctor = await Doctor.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    let doctor = await Doctor.findById(req.params.id);
    if (!doctor) return next(new AppError('Doctor not found', 404));

    // Only the doctor or admin can update
    if (doctor.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    // Protect sensitive fields from user update
    const disallowed = ['isVerified', 'averageRating', 'totalReviews', 'totalPatients'];
    disallowed.forEach(f => delete req.body[f]);

    doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('user', 'name email avatar');

    res.json({ success: true, data: doctor });
  } catch (err) {
    next(err);
  }
};

// @desc    Get doctor availability slots for a specific date
// @route   GET /api/doctors/:id/availability?date=2024-01-15
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return next(new AppError('Please provide a date', 400));

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return next(new AppError('Doctor not found', 404));

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    const dayAvailability = doctor.availability.find(
      a => a.dayOfWeek === dayOfWeek && a.isAvailable
    );

    if (!dayAvailability) {
      return res.json({ success: true, data: [], message: 'Doctor not available on this day' });
    }

    // Generate slots
    const Appointment = require('../models/Appointment');
    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      scheduledAt: {
        $gte: new Date(date + 'T00:00:00'),
        $lt: new Date(date + 'T23:59:59')
      },
      status: { $nin: ['cancelled', 'no-show'] }
    }).select('scheduledAt duration');

    const bookedTimes = new Set(
      bookedAppointments.map(a => a.scheduledAt.toISOString().slice(11, 16))
    );

    const slots = [];
    const [startH, startM] = dayAvailability.startTime.split(':').map(Number);
    const [endH, endM] = dayAvailability.endTime.split(':').map(Number);
    const slotDuration = doctor.slotDuration || 30;
    const breakDuration = doctor.breakDuration || 10;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + slotDuration <= endMinutes) {
      const hh = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
      const mm = String(currentMinutes % 60).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      slots.push({
        time: timeStr,
        datetime: `${date}T${timeStr}:00`,
        available: !bookedTimes.has(timeStr)
      });

      currentMinutes += slotDuration + breakDuration;
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured/top doctors
// @route   GET /api/doctors/featured
exports.getFeaturedDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isVerified: true, featured: true })
      .populate('user', 'name avatar')
      .sort('-averageRating')
      .limit(6);

    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
};

// @desc    Get specializations list
// @route   GET /api/doctors/specializations
exports.getSpecializations = async (req, res, next) => {
  try {
    const specializations = await Doctor.distinct('specialization', { isVerified: true });
    res.json({ success: true, data: specializations });
  } catch (err) {
    next(err);
  }
};
