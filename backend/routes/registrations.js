const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const razorpayInstance = require('../utils/razorpay');
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

    // Check registration deadline
    if (event.deadlineDate && event.deadlineTime) {
      const deadline = new Date(`${event.deadlineDate}T${event.deadlineTime}`);
      if (new Date() > deadline) {
        return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
      }
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
      status: event.isPaid ? 'waitlisted' : 'confirmed',
    });

    // Bump registered count
    await Event.findByIdAndUpdate(eventId, { $inc: { registered: 1 } });

    // Create attendance record (starts as absent)
    await Attendance.create({
      eventId,
      registrationId: registration._id,
      studentId: req.user._id,
    });

    if (event.isPaid && razorpayInstance) {
      try {
        const amount = Math.round(event.price * 100); // Amount in paise
        const options = {
          amount: amount,
          currency: "INR",
          receipt: registration._id.toString(),
        };
        const order = await razorpayInstance.orders.create(options);
        
        // Update registration with order ID
        registration.razorpayOrderId = order.id;
        await registration.save();
        
        return res.status(201).json({
          success: true,
          requirePayment: true,
          order,
          registrationId: registration._id,
          key: process.env.RAZORPAY_KEY_ID // For frontend use
        });
      } catch (err) {
        console.error("Razorpay error:", err);
        // Fallback if Razorpay fails
      }
    }

    const populated = await registration.populate('eventId', 'title date time venue');

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

    const attendanceRecords = await Attendance.find({ studentId: req.user._id });
    const attMap = {};
    attendanceRecords.forEach(a => {
      attMap[a.eventId.toString()] = a.present;
    });

    const data = registrations.map(r => {
      const obj = r.toObject();
      if (obj.eventId && obj.eventId._id) {
        obj.isPresent = attMap[obj.eventId._id.toString()] || false;
      }
      return obj;
    });

    res.json({ success: true, data });
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

// ─── GET /api/registrations/:id  (student – get single registration) ─────────
router.get('/:id', protect, requireRole('student'), async (req, res, next) => {
  try {
    const reg = await Registration.findOne({
      _id: req.params.id,
      studentId: req.user._id,
    }).populate('eventId');
    
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    
    const attendance = await Attendance.findOne({ registrationId: reg._id });
    
    res.json({ 
      success: true, 
      data: { ...reg.toObject(), isPresent: attendance?.present || false } 
    });
  } catch (err) {
    next(err);
  }
});

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
