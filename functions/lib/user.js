"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Updates a user's profile information in both Firestore and Firebase Auth.
 */
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to update your profile.");
    }
    const { uid } = context.auth;
    const { username, photoURL } = data;
    if (!username || typeof username !== 'string' || username.length < 3) {
        throw new functions.https.HttpsError("invalid-argument", "Username must be a string of at least 3 characters.");
    }
    try {
        // 1. Update Firebase Authentication user
        await admin.auth().updateUser(uid, {
            displayName: username,
            photoURL: photoURL,
        });
        // 2. Update Firestore user document
        const userDocRef = admin.firestore().collection("users").doc(uid);
        await userDocRef.update({
            username: username,
            photoURL: photoURL,
            updatedAt: new Date().toISOString(),
        });
        return { success: true, message: "Profile updated successfully." };
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while updating the profile.");
    }
});
//# sourceMappingURL=user.js.map