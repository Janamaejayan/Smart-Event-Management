const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema(
  {
    id: String,
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'select', 'checkbox'], default: 'text' },
    options: [String],
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    date: {
      type: String, // stored as YYYY-MM-DD string to match form input
      required: true,
    },
    time: {
      type: String, // stored as HH:MM
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registered: {
      type: Number,
      default: 0,
    },
    bannerColor: {
      type: String,
      default: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    },
    tags: [String],
    isPaid: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'published',
    },
    customFields: [CustomFieldSchema],
  },
  { timestamps: true }
);

// Text index for search
EventSchema.index({ title: 'text', description: 'text', venue: 'text' });

module.exports = mongoose.model('Event', EventSchema);
