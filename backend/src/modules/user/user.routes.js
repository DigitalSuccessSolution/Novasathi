const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../../middleware/auth.middleware');
const { upload } = require('../../config/cloudinary');

router.use(protect);

router.get('/me', userController.getMe);
router.patch('/me', upload.single('avatar'), userController.updateProfile);
router.patch('/mood', userController.setMood);
router.get('/history', userController.getChatHistory);
router.get('/favorites', userController.getFavorites);
router.post('/favorites/:expertId', userController.addFavorite);
router.delete('/favorites/:expertId', userController.removeFavorite);
router.get('/notifications', userController.getNotifications);
router.patch('/notifications/:notificationId/read', userController.markNotificationRead);
router.patch('/notifications/read-all', userController.markAllRead);

module.exports = router;
