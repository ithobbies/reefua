"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endAuctions = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
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
        .where("status", "==", "active");
    const snapshot = await query.get();
    if (snapshot.empty) {
        console.log("No auctions to end at this time.");
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
            // If no bids, mark as unsold
            console.log(`Lot ${doc.id} (${lotData.name}) is unsold.`);
            return lotRef.update({ status: "unsold" });
        }
        else {
            // If there's a winner, get their data from the winning bid
            const winningBid = bidsSnapshot.docs[0].data();
            console.log(`Lot ${doc.id} (${lotData.name}) sold to ${winningBid.username} for ${winningBid.amount}.`);
            // Update the lot with winner's UID, username, and the final price
            return lotRef.update({
                status: "sold",
                winnerUid: winningBid.userUid,
                winnerUsername: winningBid.username, // Added winner's username
                finalPrice: winningBid.amount,
            });
        }
    });
    await Promise.all(promises);
    console.log(`Successfully processed ${snapshot.docs.length} ended auctions.`);
    return null;
});
//# sourceMappingURL=auction.js.map