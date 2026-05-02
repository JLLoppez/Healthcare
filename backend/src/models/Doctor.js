const mongoose = require('mongoose');

const AvailabilitySlotSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun
  startTime: String, // "09:00"
  endTime: String,   // "17:00"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Please add a specialization'],
    enum: [
      'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
      'Gastroenterology', 'Neurology', 'Oncology', 'Ophthalmology',
      'Orthopedics', 'Pediatrics', 'Psychiatry', 'Pulmonology',
      'Radiology', 'Rheumatology', 'Urology', 'Gynecology',
      'ENT', 'Nephrology', 'Hematology', 'Infectious Disease'
    ]
  },
  subSpecializations: [String],
  licenseNumber: {
    type: String,
    required: [true, 'Please add a license number'],
    unique: true
  },
  licenseExpiry: Date,
  experience: {
    type: Number,
    required: [true, 'Please add years of experience'],
    min: [0, 'Experience cannot be negative']
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    year: Number,
    expiry: Date
  }],
  languages: [String],
  bio: {
    type: String,
    maxlength: [2000, 'Bio cannot exceed 2000 characters']
  },
  consultationFee: {
    type: Number,
    required: [true, 'Please add a consultation fee'],
    min: [0, 'Fee cannot be negative']
  },
  followUpFee: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  availability: [AvailabilitySlotSchema],
  slotDuration: {
    type: Number,
    default: 30 // minutes
  },
  breakDuration: {
    type: Number,
    default: 10 // minutes between slots
  },
  isAcceptingPatients: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  hospital: {
    name: String,
    address: String,
    city: String,
    country: String
  },
  telemedicineEnabled: { type: Boolean, default: true },
  inPersonEnabled: { type: Boolean, default: true },
  // Aggregated rating fields (updated on each review)
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalPatients: { type: Number, default: 0 },
  totalAppointments: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 }, // avg minutes
  profileViews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DoctorSchema.index({ specialization: 1 });
DoctorSchema.index({ averageRating: -1 });
DoctorSchema.index({ consultationFee: 1 });
DoctorSchema.index({ isVerified: 1, isAcceptingPatients: 1 });
DoctorSchema.index({ 'hospital.city': 1 });
DoctorSchema.index({
  specialization: 'text',
  bio: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Doctor', DoctorSchema);
