const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Answers to the event's custom fields { "Year of Study": "3rd Year", ... }
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paymentStatus: {
      type: String,
      enum: ['free', 'pending', 'paid'],
      default: 'free',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'waitlisted'],
      default: 'confirmed',
    },
    // Unique token used to generate / validate the student's QR code
    qrCode: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate registrations for the same event
RegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

// Auto-generate qrCode before first save
RegistrationSchema.pre('save', function (next) {
  if (!this.qrCode) {
    this.qrCode = `REG-${this.studentId}-${this.eventId}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Registration', RegistrationSchema);
