const mongoose = require('mongoose');

// ─── Review Model ─────────────────────────────────────────────────────────────
const ReviewSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // one review per appointment
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  body: {
    type: String,
    required: [true, 'Please add a review'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    knowledge: { type: Number, min: 1, max: 5 },
    bedside_manner: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 }
  },
  isVerified: { type: Boolean, default: true }, // verified purchase
  isPublic: { type: Boolean, default: true },
  helpfulVotes: { type: Number, default: 0 },
  reportedBy: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  doctorResponse: {
    text: String,
    respondedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update doctor's average rating after save/remove
ReviewSchema.statics.calcAverageRating = async function (doctorId) {
  const stats = await this.aggregate([
    { $match: { doctor: doctorId } },
    {
      $group: {
        _id: '$doctor',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  const Doctor = mongoose.model('Doctor');
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count
    });
  } else {
    await Doctor.findByIdAndUpdate(doctorId, { averageRating: 0, totalReviews: 0 });
  }
};

ReviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.doctor);
});
ReviewSchema.post('remove', function () {
  this.constructor.calcAverageRating(this.doctor);
});

ReviewSchema.index({ doctor: 1, createdAt: -1 });
ReviewSchema.index({ patient: 1 });
ReviewSchema.index({ rating: 1 });

const Review = mongoose.model('Review', ReviewSchema);

// ─── Prescription Model ───────────────────────────────────────────────────────
const MedicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: String,
  instructions: String,
  quantity: Number,
  refillsAllowed: { type: Number, default: 0 },
  refillsUsed: { type: Number, default: 0 }
}, { _id: true });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    default: () => `RX-${Date.now().toString(36).toUpperCase()}`
  },
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  },
  medications: [MedicationSchema],
  diagnosis: String,
  notes: String,
  issuedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  pharmacyNotes: String,
  digitalSignature: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PrescriptionSchema.index({ patient: 1, issuedAt: -1 });
PrescriptionSchema.index({ doctor: 1 });
PrescriptionSchema.index({ status: 1 });

const Prescription = mongoose.model('Prescription', PrescriptionSchema);

module.exports = { Review, Prescription };
