"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyNow = exports.placeBid = exports.createLot = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Firebase Admin SDK is initialized in index.ts or implicitly by Firebase.
const db = admin.firestore();
// --- UNCHANGED, WORKING onCall FUNCTIONS ---
exports.createLot = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a lot.");
    }
    const { uid: sellerUid } = context.auth;
    const userDoc = await db.collection('users').doc(sellerUid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Seller profile does not exist.");
    }
    const sellerUsername = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.username) || 'Unknown Seller';
    const { name, description, category, startingBid, buyNowPrice, endTime, images, parameters } = data;
    if (!name || !description || !category || typeof startingBid !== 'number' || !endTime || !images || images.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Required lot information is missing or invalid.");
    }
    const lotRef = db.collection("lots").doc();
    const now = new Date().toISOString();
    const newLot = {
        id: lotRef.id,
        name,
        description,
        images,
        currentBid: startingBid,
        buyNowPrice: buyNowPrice || null,
        endTime,
        sellerUid,
        sellerUsername,
        category,
        status: 'active',
        createdAt: now,
        parameters: parameters || {},
    };
    await lotRef.set(newLot);
    return { success: true, id: newLot.id };
});
exports.placeBid = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to place a bid.");
    }
    const { lotId, amount } = data;
    const { uid: userUid } = context.auth;
    const userDoc = await db.collection('users').doc(userUid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
    }
    const username = ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.username) || 'Anonymous Bidder';
    const lotRef = db.collection("lots").doc(lotId);
    return db.runTransaction(async (transaction) => {
        const lotDoc = await transaction.get(lotRef);
        if (!lotDoc.exists) {
            throw new functions.https.HttpsError("not-found", "The specified lot does not exist.");
        }
        const lot = lotDoc.data();
        if (lot.status !== 'active') {
            throw new functions.https.HttpsError("failed-precondition", "This auction is no longer active.");
        }
        if (lot.sellerUid === userUid) {
            throw new functions.https.HttpsError("failed-precondition", "You cannot bid on your own lot.");
        }
        if (amount <= lot.currentBid) {
            throw new functions.https.HttpsError("invalid-argument", `Your bid must be higher than the current bid of ${lot.currentBid}.`);
        }
        transaction.update(lotRef, { currentBid: amount, lastBidderUid: userUid });
        const bidRef = lotRef.collection("bids").doc();
        const newBid = {
            bidId: bidRef.id,
            userUid,
            username,
            amount,
            timestamp: new Date().toISOString(),
        };
        transaction.set(bidRef, newBid);
        return { success: true, message: `Successfully placed bid of ${amount}.` };
    });
});
// --- REVISED onRequest buyNow FUNCTION for robustness ---
exports.buyNow = functions.region('us-central1').https.onRequest(async (req, res) => {
    // Set CORS headers for all responses
    res.set('Access-Control-Allow-Origin', '*'); // Adjust for production with your frontend domain
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // Ensure it's a POST request
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed.' });
        return;
    }
    try {
        // Verify Firebase ID token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided or malformed token.' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        let decodedIdToken;
        try {
            decodedIdToken = await admin.auth().verifyIdToken(idToken);
        }
        catch (authError) {
            console.error('Error verifying ID token:', authError);
            const errorMessage = authError.message || 'Unauthorized: Invalid token.';
            // Check for specific Firebase Auth error codes if needed
            // e.g., if (authError.code === 'auth/id-token-expired') { ... }
            res.status(401).json({ error: errorMessage });
            return;
        }
        const buyerUid = decodedIdToken.uid;
        // Validate request body
        if (!req.body || !req.body.data || typeof req.body.data.lotId !== 'string' || req.body.data.lotId.trim() === '') {
            res.status(400).json({ error: 'Bad Request: lotId must be a non-empty string in {data: {lotId: "..."}}.' });
            return;
        }
        const { lotId } = req.body.data;
        const lotRef = db.collection("lots").doc(lotId);
        await db.runTransaction(async (transaction) => {
            const lotDoc = await transaction.get(lotRef);
            if (!lotDoc.exists) {
                const err = new Error("Лот не знайдено.");
                err.status = 404; // Custom property for status code
                throw err;
            }
            const lot = lotDoc.data();
            if (lot.status !== 'active') {
                const err = new Error("Лот більше не доступний.");
                err.status = 412; // Precondition Failed
                throw err;
            }
            if (!lot.buyNowPrice) {
                const err = new Error("Цей лот не можна купити зараз.");
                err.status = 412;
                throw err;
            }
            if (lot.sellerUid === buyerUid) {
                const err = new Error("Ви не можете купити свій лот.");
                err.status = 412;
                throw err;
            }
            transaction.update(lotRef, {
                status: 'sold',
                winnerUid: buyerUid,
                finalPrice: lot.buyNowPrice,
                endTime: new Date().toISOString(), // Update endTime to now as it's bought
            });
        });
        res.status(200).json({ data: { success: true, message: "Вітаємо з покупкою!" } });
    }
    catch (error) {
        console.error("Error in buyNow function execution:", error);
        const statusCode = error.status || (error.code && typeof error.code === 'string' && error.code.startsWith('auth/') ? 401 : 500);
        const message = error.message || "Сталася внутрішня помилка на сервері.";
        res.status(statusCode).json({ error: message });
    }
});
//# sourceMappingURL=lot.js.map