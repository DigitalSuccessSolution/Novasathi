const express = require('express');
const router = express.Router();
const counselorController = require('./counselor.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const { upload } = require('../../config/cloudinary');

router.use(protect);

// User routes — SOS / Dil Ki Baat
router.post('/connect', counselorController.connectRandom);
router.get('/status', counselorController.getSOSStatus);
router.post('/unlock/:sessionId', counselorController.unlockSession);

// Counselor-only routes
router.patch('/toggle-online', restrictTo('COUNSELOR'), counselorController.toggleCounselorOnline);
router.get('/dashboard', restrictTo('COUNSELOR'), counselorController.getCounselorDashboard);
router.patch('/profile', restrictTo('COUNSELOR'), upload.single('profileImage'), counselorController.updateCounselorProfile);

module.exports = router;
