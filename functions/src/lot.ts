
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Lot, User, Bid } from "./types";

const db = admin.firestore();

/**
 * A callable function to create a new auction lot.
 */
export const createLot = functions.https.onCall(async (data: Omit<Lot, 'id' | 'sellerUid' | 'sellerUsername' | 'status' | 'createdAt' | 'currentBid'> & { startingBid: number }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a lot.");
    }

    const { uid: sellerUid } = context.auth;
    const userDoc = await db.collection('users').doc(sellerUid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Seller profile does not exist.");
    }
    const sellerUsername = (userDoc.data() as User).username;

    const { name, description, category, startingBid, buyNowPrice, endTime, images } = data;

    if (!name || !description || !category || typeof startingBid !== 'number' || !endTime || !images || images.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Required lot information is missing or invalid.");
    }

    const lotRef = db.collection("lots").doc();
    const now = new Date().toISOString();

    const newLot: Lot = {
        id: lotRef.id,
        name,
        description,
        images,
        currentBid: startingBid,
        buyNowPrice: buyNowPrice || null,
        endTime, // Expecting ISO string from client
        sellerUid,
        sellerUsername,
        category,
        status: 'active',
        createdAt: now,
    };

    await lotRef.set(newLot);

    return { success: true, lotId: newLot.id };
});

/**
 * A callable function for a user to place a bid on a lot.
 */
export const placeBid = functions.https.onCall(async (data: { lotId: string; amount: number }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to place a bid.");
    }

    const { lotId, amount } = data;
    const { uid: userUid } = context.auth;

    const userDoc = await db.collection('users').doc(userUid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Your user profile does not exist.");
    }
    const username = (userDoc.data() as User).username;
    
    const lotRef = db.collection("lots").doc(lotId);

    return db.runTransaction(async (transaction) => {
        const lotDoc = await transaction.get(lotRef);
        if (!lotDoc.exists) {
            throw new functions.https.HttpsError("not-found", "The specified lot does not exist.");
        }

        const lot = lotDoc.data() as Lot;

        if (lot.status !== 'active') {
            throw new functions.https.HttpsError("failed-precondition", "This auction is no longer active.");
        }
        if (lot.sellerUid === userUid) {
            throw new functions.https.HttpsError("failed-precondition", "You cannot bid on your own lot.");
        }
        if (amount <= lot.currentBid) {
            throw new functions.https.HttpsError("invalid-argument", `Your bid must be higher than the current bid of ${lot.currentBid}.`);
        }

        // Update the lot's current bid
        transaction.update(lotRef, { currentBid: amount });
        
        // Create a new bid document in the 'bids' subcollection
        const bidRef = lotRef.collection("bids").doc();
        const newBid: Bid = {
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
