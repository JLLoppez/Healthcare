const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AppointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    default: () => `APT-${uuidv4().slice(0, 8).toUpperCase()}`,
    unique: true
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
  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    required: true,
    default: 'video'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Please provide appointment date and time']
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  endTime: Date,
  reason: {
    type: String,
    required: [true, 'Please add a reason for the appointment'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  symptoms: [String],
  notes: {
    patient: String,
    doctor: String,
    private: String // only visible to doctor
  },
  diagnosis: String,
  followUpRequired: { type: Boolean, default: false },
  followUpDate: Date,
  // Payment
  payment: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    stripePaymentIntentId: String,
    stripeChargeId: String,
    paidAt: Date,
    refundedAt: Date
  },
  // Video session
  videoSession: {
    roomId: String,
    roomUrl: String,
    token: String,
    startedAt: Date,
    endedAt: Date
  },
  // Reminders
  reminders: [{
    type: { type: String, enum: ['email', 'sms'] },
    sentAt: Date,
    scheduledFor: Date
  }],
  cancelledBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
  cancellationReason: String,
  rescheduledFrom: { type: mongoose.Schema.ObjectId, ref: 'Appointment' },
  rating: {
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compute endTime before save
AppointmentSchema.pre('save', function (next) {
  if (this.scheduledAt && this.duration) {
    this.endTime = new Date(this.scheduledAt.getTime() + this.duration * 60 * 1000);
  }
  next();
});

// Indexes
AppointmentSchema.index({ patient: 1, scheduledAt: -1 });
AppointmentSchema.index({ doctor: 1, scheduledAt: -1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ scheduledAt: 1 });
AppointmentSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
