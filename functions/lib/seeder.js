"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
// The exact list of categories requested by the user.
const CATEGORIES = [
    { id: 'sps', name: 'SPS Корали' },
    { id: 'lps', name: 'LPS Корали' },
    { id: 'soft', name: 'Мʼякі корали' },
    { id: 'anemones', name: 'Анемони' },
    { id: 'fish', name: 'Риба' },
    { id: 'invertebrates', name: 'Безхребетні' },
];
/**
 * A callable function to seed the database with initial categories.
 * This is intended for admin use only and can be removed after first run.
 */
exports.seedDatabase = functions.https.onCall(async (data, context) => {
    // A simple check to ensure only authenticated users can run this.
    // For a real-world scenario, you would check for an admin role.
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to seed the database.');
    }
    console.log("Seeding database with categories...");
    const batch = db.batch();
    const categoriesCollection = db.collection('categories');
    CATEGORIES.forEach(category => {
        const docRef = categoriesCollection.doc(category.id);
        batch.set(docRef, { name: category.name });
    });
    try {
        await batch.commit();
        const successMsg = `Successfully seeded ${CATEGORIES.length} categories.`;
        console.log(successMsg);
        return { status: 'success', message: successMsg };
    }
    catch (error) {
        console.error("Failed to seed categories:", error);
        throw new functions.https.HttpsError('internal', 'Failed to seed database.');
    }
});
//# sourceMappingURL=seeder.js.map