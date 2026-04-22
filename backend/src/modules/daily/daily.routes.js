const express = require('express');
const router = express.Router();
const dailyController = require('./daily.controller');
const { protect, optionalAuth, restrictTo } = require('../../middleware/auth.middleware');

router.get('/content', optionalAuth, dailyController.getDailyContent);
router.get('/content/:id', optionalAuth, dailyController.getContentById);
router.get('/polls', optionalAuth, dailyController.getPolls);
router.post('/polls/vote', protect, dailyController.votePoll);

// Admin routes
router.post('/content', protect, restrictTo('ADMIN'), dailyController.createContent);
router.patch('/content/:id', protect, restrictTo('ADMIN'), dailyController.updateContent);
router.patch('/content-priority', protect, restrictTo('ADMIN'), dailyController.updatePriority);
router.delete('/content/:id', protect, restrictTo('ADMIN'), dailyController.deleteContent);

module.exports = router;
