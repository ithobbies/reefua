"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderUpdate = exports.createOrder = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
exports.createOrder = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { lotIds, shippingInfo } = data;
    const buyerUid = context.auth.uid;
    if (!lotIds || !Array.isArray(lotIds) || lotIds.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an array of "lotIds".');
    }
    if (!shippingInfo || typeof shippingInfo !== 'object') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "shippingInfo".');
    }
    try {
        const createdOrderIds = [];
        await db.runTransaction(async (transaction) => {
            const lotDocs = await Promise.all(lotIds.map(id => transaction.get(db.collection('lots').doc(id))));
            const lotsBySeller = {};
            // 1. Validate all lots and group them by seller
            for (const lotDoc of lotDocs) {
                if (!lotDoc.exists) {
                    throw new functions.https.HttpsError('not-found', `Один з лотів більше не існує. Будь ласка, оновіть сторінку.`, { lotId: lotDoc.id });
                }
                const lotData = lotDoc.data();
                if (lotData.winnerUid !== buyerUid) {
                    throw new functions.https.HttpsError('permission-denied', `You do not have permission to order lot "${lotData.name}".`);
                }
                if (lotData.status !== 'sold') {
                    throw new functions.https.HttpsError('failed-precondition', `Лот "${lotData.name}" більше не доступний для замовлення.`, { lotId: lotData.id, lotName: lotData.name });
                }
                if (!lotsBySeller[lotData.sellerUid]) {
                    lotsBySeller[lotData.sellerUid] = [];
                }
                lotsBySeller[lotData.sellerUid].push(lotData);
            }
            // 2. Create a separate order for each seller
            for (const sellerUid in lotsBySeller) {
                const sellerLots = lotsBySeller[sellerUid];
                const totalAmount = sellerLots.reduce((sum, lot) => sum + (lot.finalPrice || 0), 0);
                const sellerUsername = sellerLots[0].sellerUsername; // Get username from the first lot
                const orderRef = db.collection('orders').doc();
                const now = new Date().toISOString();
                const newOrder = {
                    id: orderRef.id,
                    buyerUid,
                    sellerUid,
                    sellerUsername,
                    lots: sellerLots.map(l => ({
                        id: l.id,
                        name: l.name,
                        images: l.images,
                        finalPrice: l.finalPrice,
                    })),
                    totalAmount,
                    shippingInfo,
                    status: 'new',
                    createdAt: now,
                    updatedAt: now,
                };
                transaction.set(orderRef, newOrder);
                createdOrderIds.push(orderRef.id);
                // 3. Update the status of each lot included in the order
                for (const lot of sellerLots) {
                    transaction.update(db.collection('lots').doc(lot.id), { status: 'processing' });
                }
            }
        });
        return { success: true, message: 'Orders created successfully!', orderIds: createdOrderIds };
    }
    catch (error) {
        console.error("Error creating order: ", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while creating the order.', error);
    }
});
/**
 * Trigger to synchronize lot statuses when an order status is updated.
 */
exports.onOrderUpdate = functions.region('us-central1').firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const orderBefore = change.before.data();
    const orderAfter = change.after.data();
    // Check if the status has actually changed
    if (orderBefore.status === orderAfter.status) {
        console.log(`Order ${orderAfter.id} was updated, but status did not change. No action needed.`);
        return null;
    }
    // These are the statuses that can be propagated from an Order to a Lot.
    const validStatusesToSync = ['shipped', 'completed', 'cancelled'];
    const newStatus = orderAfter.status;
    if (!validStatusesToSync.includes(newStatus)) {
        console.log(`Order ${orderAfter.id} status changed to '${newStatus}'. This status is not synced to lots.`);
        return null;
    }
    console.log(`Order ${orderAfter.id} status changed to '${newStatus}'. Syncing status to lots.`);
    const batch = db.batch();
    for (const lotInfo of orderAfter.lots) {
        const lotRef = db.collection('lots').doc(lotInfo.id);
        batch.update(lotRef, { status: newStatus });
    }
    try {
        await batch.commit();
        console.log(`Successfully synced status for ${orderAfter.lots.length} lots in order ${orderAfter.id}.`);
        return { success: true };
    }
    catch (error) {
        console.error(`Failed to sync lot statuses for order ${orderAfter.id}`, error);
        return { success: false, error: error };
    }
});
//# sourceMappingURL=orders.js.map