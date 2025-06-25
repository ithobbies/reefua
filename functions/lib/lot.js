"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyNow = exports.createLot = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
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
    if (!name || !description || !category || typeof startingBid !== 'number' || !endTime || !images || !Array.isArray(images) || images.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Required lot information is missing or invalid.");
    }
    const lotRef = db.collection("lots").doc();
    const now = new Date().toISOString();
    const newLot = {
        id: lotRef.id,
        name,
        description,
        images,
        startingBid: startingBid,
        currentBid: startingBid,
        buyNowPrice: buyNowPrice || null,
        endTime,
        sellerUid,
        sellerUsername,
        category,
        status: 'active',
        createdAt: now,
        parameters: parameters || {},
        bidCount: 0,
        winnerUid: null,
        finalPrice: null,
    };
    await lotRef.set(newLot);
    return { success: true, id: newLot.id };
});
exports.buyNow = functions.region('us-central1').https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed.' });
        return;
    }
    try {
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
            res.status(401).json({ error: authError.message || 'Unauthorized: Invalid token.' });
            return;
        }
        const buyerUid = decodedIdToken.uid;
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
                err.status = 404;
                throw err;
            }
            const lot = lotDoc.data();
            if (lot.status !== 'active') {
                const err = new Error("Лот більше не доступний.");
                err.status = 412;
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
                endTime: new Date().toISOString(),
            });
        });
        res.status(200).json({ data: { success: true, message: "Вітаємо з покупкою!" } });
    }
    catch (error) {
        const statusCode = error.status || 500;
        const message = error.message || "Сталася внутрішня помилка на сервері.";
        res.status(statusCode).json({ error: message });
    }
});
//# sourceMappingURL=lot.js.map