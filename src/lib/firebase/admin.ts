import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;
let initializationError: string | null = null;

// Initialize Firebase Admin SDK
// Uses GOOGLE_APPLICATION_CREDENTIALS env var or explicit service account
function initializeFirebase(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (initializationError) {
    return null;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  // Option 1: Use explicit service account JSON from env var
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase] Initialized with service account');
      return firebaseApp;
    } catch (error) {
      console.error('[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:', error);
      initializationError = 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON';
      return null;
    }
  }

  // Option 2: Use GOOGLE_APPLICATION_CREDENTIALS file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('[Firebase] Initialized with application default credentials');
      return firebaseApp;
    } catch (error) {
      console.error('[Firebase] Error with application default credentials:', error);
      initializationError = 'Invalid GOOGLE_APPLICATION_CREDENTIALS';
      return null;
    }
  }

  // No credentials configured
  console.warn('[Firebase] No credentials configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in .env.local');
  initializationError = 'No Firebase credentials configured';
  return null;
}

// Check if Firebase is configured
export function isFirebaseConfigured(): boolean {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

// Get Firebase Admin instance
export function getFirebaseAdmin(): admin.app.App {
  const app = initializeFirebase();
  if (!app) {
    throw new Error(initializationError || 'Firebase not initialized');
  }
  return app;
}

// Get Firebase Messaging instance
export function getMessaging(): admin.messaging.Messaging {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}
