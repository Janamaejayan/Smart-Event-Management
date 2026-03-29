const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const { protect, requireRole } = require('../middleware/authMiddleware');

// ─── GET /api/analytics/overview  (organizer – platform-wide stats) ───────────
router.get('/overview', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const organizerId = req.user._id;

    // All events for this organizer
    const events = await Event.find({ organizerId });
    const eventIds = events.map((e) => e._id);

    // Total registrations across all events
    const totalRegistrations = await Registration.countDocuments({ eventId: { $in: eventIds } });

    // Total present across all events
    const totalPresent = await Attendance.countDocuments({
      eventId: { $in: eventIds },
      present: true,
    });

    // Total attendance records (= registered at time of query)
    const totalAttendanceRecords = await Attendance.countDocuments({
      eventId: { $in: eventIds },
    });

    // Events by status
    const statusCounts = { published: 0, draft: 0, cancelled: 0 };
    events.forEach((e) => {
      if (statusCounts[e.status] !== undefined) statusCounts[e.status]++;
    });

    // Fill rate per event (for a bar chart)
    const fillRates = events.map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title,
      registered: e.registered || 0,
      capacity: e.capacity,
      fillPct: e.capacity > 0 ? Math.round(((e.registered || 0) / e.capacity) * 100) : 0,
    }));

    // Registrations per event (for a horizontal bar)
    const regPerEvent = events.map((e) => ({
      name: e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title,
      registrations: e.registered || 0,
    }));

    res.json({
      success: true,
      data: {
        totalEvents: events.length,
        totalRegistrations,
        totalPresent,
        totalAttendanceRecords,
        attendanceRate:
          totalAttendanceRecords > 0
            ? Math.round((totalPresent / totalAttendanceRecords) * 100)
            : 0,
        statusBreakdown: [
          { name: 'Published', value: statusCounts.published, color: '#10b981' },
          { name: 'Draft',     value: statusCounts.draft,     color: '#f59e0b' },
          { name: 'Cancelled', value: statusCounts.cancelled,  color: '#ef4444' },
        ],
        fillRates,
        regPerEvent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/event/:eventId  (organizer – per-event deep analytics) ─
router.get('/event/:eventId', protect, requireRole('organizer'), async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify ownership
    const event = await Event.findOne({ _id: eventId, organizerId: req.user._id });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found or not yours' });
    }

    // All registrations for this event
    const registrations = await Registration.find({ eventId }).sort({ createdAt: 1 });

    // All attendance records
    const attendanceRecords = await Attendance.find({ eventId });

    // ── Attendance breakdown ──────────────────────────────────────────────────
    const presentCount = attendanceRecords.filter((a) => a.present).length;
    const absentCount = attendanceRecords.length - presentCount;

    const attendanceBreakdown = [
      { name: 'Present', value: presentCount, color: '#10b981' },
      { name: 'Absent',  value: absentCount,  color: '#ef4444' },
    ];

    // ── Payment status breakdown ──────────────────────────────────────────────
    const paymentCounts = { free: 0, pending: 0, paid: 0 };
    registrations.forEach((r) => {
      if (paymentCounts[r.paymentStatus] !== undefined) paymentCounts[r.paymentStatus]++;
    });

    const paymentBreakdown = [
      { name: 'Free',    value: paymentCounts.free,    color: '#10b981' },
      { name: 'Pending', value: paymentCounts.pending, color: '#f59e0b' },
      { name: 'Paid',    value: paymentCounts.paid,    color: '#8b5cf6' },
    ];

    // ── Registrations over time (day-by-day) ─────────────────────────────────
    const dayMap = {};
    registrations.forEach((r) => {
      const day = new Date(r.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    // Build cumulative series
    let cumulative = 0;
    const regOverTime = Object.entries(dayMap).map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });

    // ── Check-in timeline (hour-by-hour) ─────────────────────────────────────
    const hourMap = {};
    attendanceRecords
      .filter((a) => a.present && a.checkedInAt)
      .forEach((a) => {
        const hour = new Date(a.checkedInAt).getHours();
        const label = `${hour}:00`;
        hourMap[label] = (hourMap[label] || 0) + 1;
      });

    // Fill all 24 hours so gaps show as 0
    const checkinTimeline = Array.from({ length: 24 }, (_, h) => {
      const label = `${h}:00`;
      return { hour: label, checkins: hourMap[label] || 0 };
    }).filter((h) => {
      // Only return hours that have data or are between first/last checkin
      const keys = Object.keys(hourMap).map((k) => parseInt(k));
      if (keys.length === 0) return false;
      const min = Math.min(...keys);
      const max = Math.max(...keys);
      const hNum = parseInt(h.hour);
      return hNum >= min && hNum <= max;
    });

    res.json({
      success: true,
      data: {
        event: {
          title: event.title,
          date: event.date,
          venue: event.venue,
          capacity: event.capacity,
          registered: event.registered || 0,
          isPaid: event.isPaid,
          price: event.price,
          status: event.status,
        },
        kpis: {
          registered: event.registered || 0,
          capacity: event.capacity,
          fillPct:
            event.capacity > 0
              ? Math.round(((event.registered || 0) / event.capacity) * 100)
              : 0,
          presentCount,
          absentCount,
          attendanceRate:
            attendanceRecords.length > 0
              ? Math.round((presentCount / attendanceRecords.length) * 100)
              : 0,
        },
        attendanceBreakdown,
        paymentBreakdown,
        regOverTime,
        checkinTimeline,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
