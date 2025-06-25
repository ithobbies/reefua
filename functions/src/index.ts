
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK.
// This is done once here. Other files should not re-initialize without checking admin.apps.length.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Export all functions from their respective files
export * from './lot';       // Exports createLot, buyNow
export * from './user';      // Exports createUserDocument, updateUserProfile
export * from './auction';   // Exports endAuctions
export * from './bids';      // Exports placeBid, getMyBids
