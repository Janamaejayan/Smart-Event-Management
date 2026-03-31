const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Registration = require('../models/Registration');
const { protect, requireRole } = require('../middleware/authMiddleware');

// POST /api/payments/verify - Verify Razorpay Payment Signature
router.post('/verify', protect, requireRole('student'), async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        return res.status(500).json({ success: false, message: 'Razorpay secret key not configured' });
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Payment legit, update registration
    const registration = await Registration.findOneAndUpdate(
      { _id: registrationId, studentId: req.user._id },
      {
        paymentStatus: 'paid',
        status: 'confirmed',
        razorpayPaymentId: razorpay_payment_id
      },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, message: 'Payment verified successfully', data: registration });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
