import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      console.error('Firebase Admin Error:', error.stack);
    }
  } else {
    console.warn('FIREBASE_PRIVATE_KEY missing during build or runtime.');
  }
}

export const adminDb = getApps().length ? getFirestore() : ({} as any);
export const adminAuth = getApps().length ? getAuth() : ({} as any);
