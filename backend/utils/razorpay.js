const Razorpay = require('razorpay');

let razorpayInstance = null;

try {
  // Only initialize if keys are present (to not crash if user hasn't set them up yet)
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.error("Razorpay instance initialization failed:", error.message);
}

module.exports = razorpayInstance;
