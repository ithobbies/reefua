"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLotsBySeller = exports.updateShopSettings = exports.updateUserProfile = exports.createUserDocument = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * Creates a new user document in Firestore when a new user signs up.
 */
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    const userDocRef = admin.firestore().collection("users").doc(uid);
    const newUser = {
        uid,
        email,
        username: displayName || "New User",
        photoURL: photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roles: ['user'], // Default role
    };
    try {
        await userDocRef.set(newUser);
        console.log(`User document created for UID: ${uid}`);
        return null;
    }
    catch (error) {
        console.error(`Error creating user document for UID: ${uid}`, error);
        return null;
    }
});
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
        await admin.auth().updateUser(uid, {
            displayName: username,
            photoURL: photoURL,
        });
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
/**
 * Updates the shop settings for a user with the 'shop' role.
 */
exports.updateShopSettings = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { uid } = context.auth;
    const { shopPhoneNumber, shopRegion, shopCity } = data;
    const userRef = admin.firestore().collection("users").doc(uid);
    try {
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User profile not found.");
        }
        const userData = userDoc.data();
        if (!((_a = userData.roles) === null || _a === void 0 ? void 0 : _a.includes('shop'))) {
            throw new functions.https.HttpsError("permission-denied", "You must be a shop to update these settings.");
        }
        const updateData = {
            shopPhoneNumber: shopPhoneNumber || null,
            shopRegion: shopRegion || null,
            shopCity: shopCity || null,
            updatedAt: new Date().toISOString(),
        };
        await userRef.update(updateData);
        return { success: true, message: "Shop settings updated successfully." };
    }
    catch (error) {
        console.error("Error updating shop settings:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});
exports.getLotsBySeller = functions.https.onCall(async (data, context) => {
    const userId = data.userId;
    if (!userId || typeof userId !== "string") {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'userId' string argument.");
    }
    try {
        const lotsSnapshot = await admin.firestore()
            .collection("lots")
            .where("sellerUid", "==", userId)
            .where("status", "==", "active")
            .orderBy("createdAt", "desc")
            .get();
        if (lotsSnapshot.empty) {
            return [];
        }
        const lots = lotsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return lots;
    }
    catch (error) {
        console.error("Error fetching lots by seller:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while fetching the lots.");
    }
});
//# sourceMappingURL=user.js.map