
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Bid, Lot } from "./types";

const db = admin.firestore();

// Helper function to determine the minimum bid step based on the current price
const getMinBidStep = (currentPrice: number): number => {
    if (currentPrice < 500) return 20;
    if (currentPrice < 2000) return 50;
    if (currentPrice < 5000) return 100;
    return 250;
};

/**
 * Places a bid on a lot. This function is transactional and includes dynamic bid step logic.
 */
export const placeBid = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to place a bid.");
    }

    const { lotId, amount } = data;
    const { uid: userUid, token: { name: username } } = context.auth;

    if (!lotId || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a valid 'lotId' and 'amount'.");
    }

    const lotRef = db.collection("lots").doc(lotId);

    try {
        await db.runTransaction(async (transaction) => {
            const lotDoc = await transaction.get(lotRef);

            if (!lotDoc.exists) {
                throw new functions.https.HttpsError("not-found", "The specified lot does not exist.");
            }

            const lotData = lotDoc.data() as Lot;
            
            if (new Date(lotData.endTime) < new Date()) {
                throw new functions.https.HttpsError("failed-precondition", "This auction has already ended.");
            }
            
            if (lotData.sellerUid === userUid) {
                throw new functions.https.HttpsError("failed-precondition", "You cannot bid on your own lot.");
            }
            
            // --- DYNAMIC BID STEP LOGIC ---
            const minStep = getMinBidStep(lotData.currentBid);
            const minimumNextBid = lotData.currentBid + minStep;

            if (amount < minimumNextBid) {
                throw new functions.https.HttpsError("failed-precondition", `Your bid is too low. The next minimum bid is ${minimumNextBid.toFixed(2)} грн (крок ${minStep} грн).`);
            }

            const currentBidCount = lotData.bidCount || 0;
            const newBidCount = currentBidCount + 1;

            const newBidRef = lotRef.collection("bids").doc();
            
            const bidData: Bid = {
                bidId: newBidRef.id,
                lotId: lotId,
                userUid,
                username: username || "Anonymous",
                amount,
                timestamp: new Date().toISOString(),
            };

            transaction.update(lotRef, {
                currentBid: amount,
                bidCount: newBidCount,
                lastBidderUid: userUid,
            });

            transaction.set(newBidRef, bidData);
        });

        return { success: true, message: "Bid placed successfully!" };
        
    } catch (error) {
        console.error("Transaction failed: ", error);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while placing your bid.", error);
    }
});


/**
 * A callable function to fetch all bids made by the current user.
 */
export const getMyBids = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to view your bids.");
    }

    const { uid: userUid } = context.auth;

    try {
        const bidsSnapshot = await db.collectionGroup('bids').where('userUid', '==', userUid).get();
        
        if (bidsSnapshot.empty) {
            return [];
        }

        const bidsWithLotDataPromises = bidsSnapshot.docs.map(async (bidDoc) => {
            const bidData = bidDoc.data() as Bid;
            
            const lotRef = bidDoc.ref.parent.parent;
            if (!lotRef) return null;

            const lotDoc = await lotRef.get();
            if (!lotDoc.exists) return null;

            const lotData = lotDoc.data() as Lot;
            const isWinning = lotData.currentBid === bidData.amount && lotData.status === 'active';
            const status = isWinning ? 'Виграєте' : 'Перебито';

            return {
                lotId: lotData.id,
                lotName: lotData.name,
                yourBid: bidData.amount,
                currentBid: lotData.currentBid,
                status: lotData.status === 'active' ? status : 'Завершено',
            };
        });

        const resolvedBids = await Promise.all(bidsWithLotDataPromises);
        return resolvedBids.filter(bid => bid !== null);

    } catch (error) {
        console.error("Error fetching user bids:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while fetching your bids.");
    }
});
