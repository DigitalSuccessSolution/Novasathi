const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { protect } = require('../../middleware/auth.middleware');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllRead);
router.delete('/:id', notificationController.deleteNotification);
router.post('/fcm-token', notificationController.saveFcmToken);

module.exports = router;
