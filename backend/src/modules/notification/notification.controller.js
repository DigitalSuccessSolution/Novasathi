const prisma = require('../../config/prisma');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get all notifications for the current user (paginated)
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.notification.count({ where: { userId: req.user.id } }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    notifications,
    unreadCount,
    pagination: { page: parseInt(page), limit: parseInt(limit), total }
  }));
});

/**
 * Mark a single notification as read
 */
exports.markAsRead = catchAsync(async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.status(200).json(new ApiResponse(200, null, 'Notification marked as read'));
});

/**
 * Mark all notifications as read
 */
exports.markAllRead = catchAsync(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

/**
 * Get unread count (lightweight endpoint for badges)
 */
exports.getUnreadCount = catchAsync(async (req, res) => {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  res.status(200).json(new ApiResponse(200, { count }));
});

/**
 * Delete a notification
 */
exports.deleteNotification = catchAsync(async (req, res) => {
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
});

/**
 * Save FCM token for push notifications
 */
exports.saveFcmToken = catchAsync(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json(new ApiResponse(400, null, 'FCM token required'));

  await prisma.user.update({
    where: { id: req.user.id },
    data: { fcmToken },
  });

  res.status(200).json(new ApiResponse(200, null, 'Push notification token saved'));
});
