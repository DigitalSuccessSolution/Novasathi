const { admin } = require('../../config/firebase');

/**
 * NovaSathi Push Service
 * High-level wrapper for FCM (Firebase Cloud Messaging) operations.
 */
class PushService {
    /**
     * Send a notification to a specific FCM token
     * @param {string} token - The recipient's FCM registration token
     * @param {Object} payload - Notification payload { title, body, data }
     */
    static async sendToDevice(token, payload) {
        if (!token) return;

        const message = {
            token: token,
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    }
                }
            }
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('✅ [FCM_SUCCESS]', response);
            return response;
        } catch (err) {
            console.error('❌ [FCM_ERROR]', err.message);
            // If token is invalid/expired, we should ideally remove it from our DB
            if (err.code === 'messaging/registration-token-not-registered') {
                return 'INVALID_TOKEN';
            }
            return null;
        }
    }
}

module.exports = PushService;
