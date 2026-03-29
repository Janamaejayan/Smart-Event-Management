const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─── POST /api/feedback  (student – submit rating + comment) ─────────────────
router.post(
  '/',
  protect,
  requireRole('student'),
  [
    body('eventId').notEmpty().withMessage('eventId is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 1000 }).withMessage('Comment too long'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const { eventId, rating, comment } = req.body;

      // Must be registered for the event
      const registration = await Registration.findOne({
        eventId,
        studentId: req.user._id,
      });
      if (!registration) {
        return res.status(403).json({
          success: false,
          message: 'You must be registered for this event to leave feedback',
        });
      }

      // Create or update (upsert) — allows editing their own feedback
      const feedback = await Feedback.findOneAndUpdate(
        { eventId, studentId: req.user._id },
        { rating, comment: comment || '', isRead: false },
        { upsert: true, new: true, runValidators: true }
      );

      res.status(201).json({ success: true, data: feedback });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/feedback/my/:eventId  (student – their own feedback for an event)
router.get('/my/:eventId', protect, requireRole('student'), async (req, res, next) => {
  try {
    const feedback = await Feedback.findOne({
      eventId: req.params.eventId,
      studentId: req.user._id,
    });
    res.json({ success: true, data: feedback || null });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/feedback/event/:eventId  (organizer – all feedback for their event)
router.get('/event/:eventId', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    // Verify organizer owns this event
    const event = await Event.findOne({
      _id: req.params.eventId,
      organizerId: req.user._id,
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or not yours' });
    }

    const feedbacks = await Feedback.find({ eventId: req.params.eventId })
      .populate('studentId', 'name avatar')
      .sort({ createdAt: -1 });

    // Mark all as read
    await Feedback.updateMany(
      { eventId: req.params.eventId, isRead: false },
      { isRead: true }
    );

    // Compute aggregate stats
    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? Math.round((feedbacks.reduce((s, f) => s + f.rating, 0) / total) * 10) / 10
        : 0;

    // Distribution: how many per star (1-5)
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: feedbacks.filter((f) => f.rating === star).length,
    }));

    const data = feedbacks.map((f) => ({
      id: f._id,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt,
      studentName: f.studentId?.name || 'Anonymous',
      studentAvatar: f.studentId?.avatar,
    }));

    res.json({
      success: true,
      data: {
        total,
        avgRating,
        distribution,
        feedbacks: data,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/feedback/event/:eventId/summary  (public – avg rating on event card)
router.get('/event/:eventId/summary', async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ eventId: req.params.eventId });
    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? Math.round((feedbacks.reduce((s, f) => s + f.rating, 0) / total) * 10) / 10
        : 0;
    res.json({ success: true, data: { total, avgRating } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
