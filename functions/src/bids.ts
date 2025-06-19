
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Bid, Lot } from "./types";

const db = admin.firestore();

/**
 * A callable function to fetch all bids made by the current user.
 * This function performs a collection group query and then fetches the
 * parent lot for each bid to provide complete information.
 */
export const getMyBids = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to view your bids.");
    }

    const { uid: userUid } = context.auth;

    try {
        // 1. Query the 'bids' collection group to find all bids by the current user.
        const bidsSnapshot = await db.collectionGroup('bids').where('userUid', '==', userUid).get();
        
        if (bidsSnapshot.empty) {
            return [];
        }

        // 2. For each bid, fetch its parent lot's data.
        const bidsWithLotDataPromises = bidsSnapshot.docs.map(async (bidDoc) => {
            const bidData = bidDoc.data() as Bid;
            
            // The parent of a doc in a subcollection is the containing document.
            const lotRef = bidDoc.ref.parent.parent;
            if (!lotRef) return null;

            const lotDoc = await lotRef.get();
            if (!lotDoc.exists) return null;

            const lotData = lotDoc.data() as Lot;

            // Determine the user's bidding status
            const isWinning = lotData.currentBid === bidData.amount && lotData.status === 'active';
            const status = isWinning ? 'Виграєте' : 'Перебито';

            // 3. Combine bid and lot data into a single object for the client.
            return {
                lotId: lotData.id,
                lotName: lotData.name,
                yourBid: bidData.amount,
                currentBid: lotData.currentBid,
                status: lotData.status === 'active' ? status : 'Завершено',
            };
        });

        const resolvedBids = await Promise.all(bidsWithLotDataPromises);
        
        // Filter out any null results that may have occurred if a lot was deleted
        // but the bid subcollection remained.
        return resolvedBids.filter(bid => bid !== null);

    } catch (error) {
        console.error("Error fetching user bids:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while fetching your bids.");
    }
});
