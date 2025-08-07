
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export all functions from their respective files
export * from './lot';
export * from './user';
export * from './auction';
export * from './bids';
export * from './reviews';
export * from './chat';
export * from './orders';
export * from './notifications';
export * from './dashboard';
export * from './telegram';
