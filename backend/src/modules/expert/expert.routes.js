const express = require('express');
const router = express.Router();
const expertController = require('./expert.controller');
const { protect, restrictTo, optionalAuth } = require('../../middleware/auth.middleware');
const { upload } = require('../../config/cloudinary');

// Expert Management Routes - Specialized Dashboard Endpoints
router.get('/overview', protect, restrictTo('EXPERT'), expertController.getOverview);
router.get('/earnings', protect, restrictTo('EXPERT'), expertController.getEarnings);
router.get('/history', protect, restrictTo('EXPERT'), expertController.getHistory);
router.get('/me', protect, restrictTo('EXPERT'), expertController.getProfileMe);

// Public routes
router.get('/', optionalAuth, expertController.listExperts);
router.get('/category/:category', optionalAuth, expertController.listExperts);
router.get('/meta/categories', expertController.getCategories);
router.get('/:expertId', optionalAuth, expertController.getExpertProfile);

// Authenticated user routes
router.post('/:expertId/review', protect, expertController.submitReview);

// Expert Onboarding (3-Step Flow)
router.post('/onboard', protect, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'certification', maxCount: 1 },
  { name: 'introVideo', maxCount: 1 }
]), expertController.onboardExpert);

router.patch('/toggle-online', protect, restrictTo('EXPERT'), expertController.toggleOnline);
router.patch('/profile', protect, restrictTo('EXPERT'), upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'certification', maxCount: 1 }
]), expertController.updateExpertProfile);
router.post('/payout', protect, restrictTo('EXPERT'), expertController.requestPayout);

module.exports = router;
