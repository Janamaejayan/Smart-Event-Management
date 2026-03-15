const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─── POST /api/registrations  (student – register for an event) ──────────────
router.post('/', protect, requireRole('student'), async (req, res, next) => {
  try {
    const { eventId, formData } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }

    // Fetch event & check capacity
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (event.registered >= event.capacity) {
      return res.status(400).json({ success: false, message: 'Event is fully booked' });
    }

    // Create registration (unique index prevents duplicates)
    const registration = await Registration.create({
      eventId,
      studentId: req.user._id,
      formData: formData || {},
      paymentStatus: event.isPaid ? 'pending' : 'free',
    });

    // Bump registered count
    await Event.findByIdAndUpdate(eventId, { $inc: { registered: 1 } });

    // Create attendance record (starts as absent)
    await Attendance.create({
      eventId,
      registrationId: registration._id,
      studentId: req.user._id,
    });

    const populated = await registration.populate('eventId', 'title date time venue bannerColor');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // Mongoose duplicate key → already registered
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Already registered for this event' });
    }
    next(err);
  }
});

// ─── GET /api/registrations/my  (student – their registrations) ──────────────
router.get('/my', protect, requireRole('student'), async (req, res, next) => {
  try {
    const registrations = await Registration.find({ studentId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: registrations });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/registrations/event/:eventId  (organizer – list for an event) ──
router.get(
  '/event/:eventId',
  protect,
  requireRole('organizer'),
  async (req, res, next) => {
    try {
      // Verify ownership
      const event = await Event.findOne({
        _id: req.params.eventId,
        organizerId: req.user._id,
      });
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found or not yours' });
      }

      const registrations = await Registration.find({ eventId: req.params.eventId })
        .populate('studentId', 'name email avatar')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: registrations });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /api/registrations/:id  (student – cancel their registration) ────
router.delete('/:id', protect, requireRole('student'), async (req, res, next) => {
  try {
    const reg = await Registration.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    });
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    await reg.deleteOne();

    // Decrement counter and remove attendance record
    await Event.findByIdAndUpdate(reg.eventId, { $inc: { registered: -1 } });
    await Attendance.deleteOne({ registrationId: reg._id });

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
