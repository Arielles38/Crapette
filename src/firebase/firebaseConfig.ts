/**
 * Firebase configuration and initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services (skip if missing credentials for testing)
let auth: any = null;
let database: any = null;
let analytics: any = null;

if (process.env.FIREBASE_API_KEY) {
  try {
    auth = getAuth(app);
    database = getDatabase(app);
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Failed to initialize Firebase services:', error);
  }
}

export { auth, database, analytics };
export default app;
