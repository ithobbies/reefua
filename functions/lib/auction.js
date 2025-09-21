"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOnExpiringListings = exports.endAuctions = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const telegram_1 = require("./telegram");
const db = admin.firestore();
/**
 * A scheduled function that runs every minute to end auctions.
 */
exports.endAuctions = functions.pubsub
    .schedule("every 1 minutes")
    .onRun(async (context) => {
    const now = new Date().toISOString();
    const query = db
        .collection("lots")
        .where("endTime", "<=", now)
        .where("status", "==", "active")
        .where("type", "==", "auction");
    const snapshot = await query.get();
    if (snapshot.empty) {
        // This is a normal exit, no need to log every minute.
        return null;
    }
    const promises = snapshot.docs.map(async (doc) => {
        const lotRef = doc.ref;
        const lotData = doc.data();
        const bidsSnapshot = await lotRef
            .collection("bids")
            .orderBy("amount", "desc")
            .limit(1)
            .get();
        if (bidsSnapshot.empty) {
            console.log(`Lot ${doc.id} (${lotData.name}) is marked as 'finished' (no bids).`);
            return lotRef.update({ status: "finished" });
        }
        else {
            const winningBid = bidsSnapshot.docs[0].data();
            console.log(`Lot ${doc.id} (${lotData.name}) sold to ${winningBid.username} for ${winningBid.amount}.`);
            return lotRef.update({
                status: "sold",
                winnerUid: winningBid.userUid,
                winnerUsername: winningBid.username,
                finalPrice: winningBid.amount,
            });
        }
    });
    await Promise.all(promises);
    console.log(`Successfully processed ${snapshot.docs.length} ended auctions.`);
    return null;
});
/**
 * Notifies users whose direct sale listings are expiring in approximately 24 hours.
 * Runs once a day at a set time (e.g., 10:00 AM UTC).
 */
exports.notifyOnExpiringListings = functions.region('us-central1').pubsub
    .schedule('0 10 * * *')
    .timeZone('UTC')
    .onRun(async (context) => {
    console.log('Checking for listings that will expire in the next 24 hours...');
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const query = db.collection('lots')
        .where('type', '==', 'direct')
        .where('status', '==', 'active')
        .where('endTime', '<=', twentyFourHoursFromNow.toISOString())
        .where('endTime', '>', now.toISOString());
    const snapshot = await query.get();
    if (snapshot.empty) {
        console.log('No direct sale listings are expiring soon.');
        return null;
    }
    for (const doc of snapshot.docs) {
        const lot = doc.data();
        const userRef = db.collection('users').doc(lot.sellerUid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.telegramUserId) {
                const message = `🔔 Нагадування: Термін дії вашого оголошення "${lot.name}" закінчується завтра. Ви зможете активувати його знову після деактивації.`;
                // Do not await inside the loop to avoid long execution times
                (0, telegram_1.sendTelegramMessage)(userData.telegramUserId, message).catch((err) => console.error(err));
            }
        }
    }
    console.log(`Sent ${snapshot.size} expiration warnings.`);
    return null;
});
//# sourceMappingURL=auction.js.map