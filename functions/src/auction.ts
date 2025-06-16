
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Lot, Bid } from "./types";

const db = admin.firestore();

/**
 * A scheduled function that runs every minute to end auctions.
 */
export const endAuctions = functions.pubsub
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
      const lotData = doc.data() as Lot;

      const bidsSnapshot = await lotRef
        .collection("bids")
        .orderBy("amount", "desc")
        .limit(1)
        .get();

      if (bidsSnapshot.empty) {
        // If no bids, mark as unsold
        console.log(`Lot ${doc.id} (${lotData.name}) is unsold.`);
        return lotRef.update({ status: "unsold" });
      } else {
        // If there's a winner
        const winningBid = bidsSnapshot.docs[0].data() as Bid;
        console.log(`Lot ${doc.id} (${lotData.name}) sold to ${winningBid.username} for ${winningBid.amount}.`);
        return lotRef.update({
          status: "sold",
          winnerUid: winningBid.userUid,
          finalPrice: winningBid.amount,
        });
      }
    });

    await Promise.all(promises);
    console.log(`Successfully processed ${snapshot.docs.length} ended auctions.`);
    return null;
  });
