const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Whether the organizer has read this feedback
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One feedback per student per event
FeedbackSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
