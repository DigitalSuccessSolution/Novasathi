const prisma = require('../../config/prisma');
const { getIO } = require('../../socket/index');
const PushService = require('./push.service');

/**
 * NovaSathi Notification Engine — Core Logic
 * Handles database persistence, real-time socket broadcasting, and FCM push prep.
 */
class NotificationEngine {
  /**
   * Create and dispatch a notification
   * @param {Object} options - Notification options
   * @param {string} options.userId - Recipient user ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification body
   * @param {string} options.type - Type (WALLET, CHAT, SYSTEM, etc.)
   * @param {Object} options.metadata - Optional extra data
   */
  static async send(options) {
    const { userId, title, message, type = 'SYSTEM', metadata = {} } = options;

    try {
      // 1. Persistence — Save to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          metadata: metadata ? JSON.stringify(metadata) : null,
          isRead: false
        }
      });

      // 2. Real-time — Broadcast via Socket.io
      try {
        const io = getIO();
        // Emit to the user's specific notification room
        io.to(`notification:${userId}`).emit('new_notification', notification);
        
        // Also broadcast unread count update
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false }
        });
        io.to(`notification:${userId}`).emit('unread_count_update', { count: unreadCount });
      } catch (socketErr) {
        // Socket might not be initialized in some contexts (e.g., workers/scripts)
        console.warn("🔔 [SOCKET_DISPATCH_SKIPPED]", socketErr.message);
      }

      // 3. Push Action — Physical device alert
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true }
      });

      if (targetUser?.fcmToken) {
        const fcmResult = await PushService.sendToDevice(targetUser.fcmToken, {
          title,
          body: message,
          data: { type, ...metadata }
        });

        // Clean up invalid tokens
        if (fcmResult === 'INVALID_TOKEN') {
          await prisma.user.update({
            where: { id: userId },
            data: { fcmToken: null }
          });
        }
      }

      return notification;
    } catch (err) {
      console.error("🔥 [NOTIFICATION_ENGINE_ERROR]", err.message || err);
      // We don't throw here to prevent the main transaction from failing 
      return null;
    }
  }

  /**
   * Specialized — Low Balance Alert
   */
  static async triggerLowBalance(userId, balance) {
    return this.send({
      userId,
      title: '⚠️ Wallet Balance Low',
      message: `Your balance is ₹${balance.toFixed(2)}. Please recharge soon to avoid session interruption.`,
      type: 'WALLET_LOW',
      metadata: { balance }
    });
  }

  /**
   * Specialized — Session Reminder
   */
  static async triggerSessionReminder(userId, expertName) {
    return this.send({
      userId,
      title: '🚀 Upcoming Session',
      message: `Your session with ${expertName} is about to start. Click to join!`,
      type: 'SESSION_REMINDER'
    });
  }
}

module.exports = NotificationEngine;
