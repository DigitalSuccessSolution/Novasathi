const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { protect, optionalAuth } = require('../../middleware/auth.middleware');

// Rate limiter for OTP endpoints — max 5 requests per minute per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Increased for development/ease
  message: { status: 'fail', message: 'Too many OTP requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-otp', otpLimiter, authController.sendOTP);
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/firebase-login', authController.firebaseLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', optionalAuth, authController.logout);
router.post('/expert/signup', authController.signupExpert);
router.post('/expert/login', authController.loginExpert);

// Super Admin Routes
router.post('/admin/register', authController.registerAdmin);
router.post('/admin/login', authController.loginAdmin);

module.exports = router;
