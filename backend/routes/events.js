const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─── GET /api/events  (public – list published events) ───────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const filter = { status: 'published' };

    if (search) {
      filter.$text = { $search: search };
    }
    if (type === 'free') filter.isPaid = false;
    if (type === 'paid') filter.isPaid = true;

    const events = await Event.find(filter)
      .populate('organizerId', 'name avatar')
      .sort({ date: 1 });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/events/my  (organizer – their own events) ──────────────────────
router.get('/my', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const events = await Event.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/events/:id  (public) ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizerId', 'name avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/events  (organizer only) ──────────────────────────────────────
router.post(
  '/',
  protect,
  requireRole('organizer'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const attendanceCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const event = await Event.create({
        ...req.body,
        organizerId: req.user._id,
        attendanceCode
      });

      res.status(201).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/events/:id  (organizer – own events only) ──────────────────────
router.put('/:id', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizerId: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or not yours' });
    }

    // Prevent reducing capacity below current registrations
    if (req.body.capacity && req.body.capacity < event.registered) {
      return res.status(400).json({
        success: false,
        message: `Capacity cannot be less than current registrations (${event.registered})`,
      });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/events/:id  (organizer – own events only) ───────────────────
router.delete('/:id', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      organizerId: req.user._id,
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or not yours' });
    }

    // Cascading delete
    await Registration.deleteMany({ eventId: req.params.id });
    await Attendance.deleteMany({ eventId: req.params.id });
    await Feedback.deleteMany({ eventId: req.params.id });

    res.json({ success: true, message: 'Event and related records deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
