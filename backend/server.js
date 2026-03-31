require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route handlers
const authRoutes         = require('./routes/auth');
const eventRoutes        = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const attendanceRoutes   = require('./routes/attendance');
const analyticsRoutes    = require('./routes/analytics');
const feedbackRoutes     = require('./routes/feedback');
const uploadRoutes       = require('./routes/upload');
const paymentRoutes      = require('./routes/payments');
const errorHandler       = require('./middleware/errorHandler');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'EventSphere API is running 🚀' })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/payments',      paymentRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Connect to MongoDB then start server ─────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () =>
      console.log(`🚀  Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
