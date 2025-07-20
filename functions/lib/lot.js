"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireDirectSales = exports.buyNow = exports.createLot = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
exports.createLot = functions.region('us-central1').https.onCall(async (data, context) => {
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
    const { name, description, category, startingBid, buyNowPrice, endTime, images, parameters, type, price } = data;
    if (!name || !description || !category || !images || !Array.isArray(images) || images.length === 0 || !type) {
        throw new functions.https.HttpsError("invalid-argument", "Required lot information is missing or invalid.");
    }
    const lotRef = db.collection("lots").doc();
    const now = new Date();
    const nowISO = now.toISOString();
    let newLot;
    if (type === 'direct') {
        if (typeof price !== 'number' || price <= 0) {
            throw new functions.https.HttpsError("invalid-argument", "A valid price is required for direct sales.");
        }
        const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
        newLot = {
            id: lotRef.id,
            name,
            description,
            images,
            price,
            sellerUid,
            sellerUsername,
            category,
            status: 'active',
            createdAt: nowISO,
            endTime: thirtyDaysFromNow.toISOString(), // Expires in 30 days
            type: 'direct',
            parameters: parameters || {},
            bidCount: 0,
            winnerUid: null,
            finalPrice: null,
            reviewLeft: false,
            startingBid: 0,
            currentBid: 0,
        };
    }
    else if (type === 'auction') {
        if (typeof startingBid !== 'number' || !endTime) {
            throw new functions.https.HttpsError("invalid-argument", "Starting bid and end time are required for auctions.");
        }
        newLot = {
            id: lotRef.id,
            name,
            description,
            images,
            startingBid,
            currentBid: startingBid,
            buyNowPrice: buyNowPrice || null,
            endTime,
            sellerUid,
            sellerUsername,
            category,
            status: 'active',
            createdAt: nowISO,
            parameters: parameters || {},
            bidCount: 0,
            winnerUid: null,
            finalPrice: null,
            reviewLeft: false,
            type: 'auction',
        };
    }
    else {
        throw new functions.https.HttpsError("invalid-argument", "Invalid lot type specified.");
    }
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
            if (lot.sellerUid === buyerUid) {
                const err = new Error("Ви не можете купити свій лот.");
                err.status = 412;
                throw err;
            }
            let finalPrice;
            if (lot.type === 'direct') {
                finalPrice = lot.price;
            }
            else if (lot.type === 'auction') {
                finalPrice = lot.buyNowPrice;
            }
            if (!finalPrice) {
                const err = new Error("Цей лот не можна купити зараз.");
                err.status = 412;
                throw err;
            }
            transaction.update(lotRef, {
                status: 'sold',
                winnerUid: buyerUid,
                finalPrice: finalPrice,
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
exports.expireDirectSales = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date().toISOString();
    const query = db.collection('lots')
        .where('type', '==', 'direct')
        .where('status', '==', 'active')
        .where('endTime', '<=', now);
    const snapshot = await query.get();
    if (snapshot.empty) {
        console.log('No expired direct sales lots to update.');
        return null;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'unsold' });
    });
    await batch.commit();
    console.log(`Expired ${snapshot.size} direct sales lots.`);
    return null;
});
//# sourceMappingURL=lot.js.map