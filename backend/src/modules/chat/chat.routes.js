const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

router.use(protect);

router.post('/intake', chatController.submitIntake);
router.post('/start', chatController.startSession);
router.get('/session/:sessionId', chatController.getSession);
router.post('/session/:sessionId/end', chatController.endSession);
router.get('/session/:sessionId/messages', chatController.getMessages);
router.post('/session/:sessionId/clear', chatController.clearChat);
router.patch('/session/:sessionId/privacy', chatController.updatePrivacy);
router.get('/my-sessions', chatController.getUserSessions);
router.get('/admin/all-sessions', restrictTo('ADMIN'), chatController.getAllSessions);

// Chat Media Persistence - Mystic Imagery Ritual
const { upload } = require('../../config/cloudinary');
router.post('/upload', upload.single('image'), chatController.uploadChatImage);

module.exports = router;
