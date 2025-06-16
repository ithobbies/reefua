"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreate = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// This is a global initialization, safe to run once
try {
    admin.initializeApp();
}
catch (e) {
    // This is expected to happen on hot reloads, it's fine
}
const db = admin.firestore();
/**
 * Triggered on new user creation to create a corresponding Firestore document.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    const now = new Date().toISOString();
    // Fallback for username if displayName is not available
    const username = displayName || `user_${uid.substring(0, 5)}`;
    const newUser = {
        uid,
        email: email || "",
        username,
        photoURL: photoURL || null,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        roles: ["user"],
        lastLogin: now,
        pushEnabled: true,
        emailNotifications: true,
        balance: 0,
        sellerRating: 0
    };
    try {
        await db.collection("users").doc(uid).set(newUser);
        console.log(`Successfully created user document for ${uid}`);
    }
    catch (error) {
        console.error(`Error creating user document for UID: ${uid}`, error);
    }
});
//# sourceMappingURL=user.js.map