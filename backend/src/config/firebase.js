const admin = require('firebase-admin');

/**
 * NovaSathi Firebase Admin Initialization
 * Uses environment variables for service account credentials to ensure security.
 */
const initializeFirebase = () => {
    try {
        if (!process.env.FIREBASE_PROJECT_ID) {
            console.warn("⚠️ [FIREBASE] Project ID missing. Push notifications will be disabled.");
            return null;
        }

        // Initialize with individual fields or a JSON string
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };

        if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
            console.warn("⚠️ [FIREBASE] Credentials incomplete. Push notifications disabled.");
            return null;
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('✅ Firebase Admin initialized successfully');
        return app;
    } catch (err) {
        console.error("❌ Firebase initialization error:", err.message);
        return null;
    }
}

const firebaseApp = initializeFirebase();

module.exports = { admin, firebaseApp };
