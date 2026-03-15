const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─── GET /api/attendance/event/:eventId  (organizer – full sheet) ─────────────
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

      const records = await Attendance.find({ eventId: req.params.eventId })
        .populate('studentId', 'name email avatar')
        .sort({ createdAt: 1 });

      const data = records.map((r) => ({
        id: r._id,
        studentId: r.studentId?._id,
        studentName: r.studentId?.name || 'Unknown',
        studentEmail: r.studentId?.email,
        avatar: r.studentId?.avatar,
        present: r.present,
        checkedInAt: r.checkedInAt,
      }));

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /api/attendance/:id  (organizer – toggle present/absent) ─────────────
router.put('/:id', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const { present } = req.body;
    if (typeof present !== 'boolean') {
      return res.status(400).json({ success: false, message: '`present` (boolean) is required' });
    }

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        present,
        checkedInAt: present ? new Date() : null,
        markedBy: req.user._id,
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/attendance/checkin  (organizer – QR code check-in) ────────────
router.post('/checkin', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const { qrCode, eventId } = req.body;

    if (!qrCode || !eventId) {
      return res.status(400).json({ success: false, message: 'qrCode and eventId are required' });
    }

    // Verify organizer owns the event
    const event = await Event.findOne({ _id: eventId, organizerId: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or not yours' });
    }

    // Find registration by QR token
    const registration = await Registration.findOne({ qrCode, eventId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid QR code for this event' });
    }

    // Find the attendance record
    const record = await Attendance.findOne({
      eventId,
      studentId: registration.studentId,
    }).populate('studentId', 'name email avatar');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendee record not found' });
    }

    if (record.present) {
      return res.status(409).json({
        success: false,
        message: `${record.studentId?.name} is already checked in`,
      });
    }

    record.present = true;
    record.checkedInAt = new Date();
    record.markedBy = req.user._id;
    await record.save();

    res.json({
      success: true,
      message: `${record.studentId?.name} checked in successfully!`,
      data: {
        id: record._id,
        studentName: record.studentId?.name,
        studentEmail: record.studentId?.email,
        present: record.present,
        checkedInAt: record.checkedInAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
