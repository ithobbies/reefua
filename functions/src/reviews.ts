
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Review, Lot, User } from "./types";

const db = admin.firestore();

export const leaveReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to leave a review.");
    }

    const { lotId, rating, comment } = data;
    const buyerUid = context.auth.uid;

    if (!lotId || typeof rating !== 'number' || rating < 1 || rating > 5 || typeof comment !== 'string' || comment.trim() === '') {
        throw new functions.https.HttpsError("invalid-argument", "Please provide a valid lot ID, a rating between 1 and 5, and a non-empty comment.");
    }

    const lotRef = db.collection('lots').doc(lotId);
    const reviewRef = db.collection('reviews').doc();

    try {
        await db.runTransaction(async (transaction) => {
            const lotDoc = await transaction.get(lotRef);

            if (!lotDoc.exists) {
                throw new functions.https.HttpsError("not-found", "The specified lot does not exist.");
            }

            const lotData = lotDoc.data() as Lot;
            
            // Allow reviews for shipped or completed lots
            if (lotData.status !== 'shipped' && lotData.status !== 'completed') {
                throw new functions.https.HttpsError("failed-precondition", "You can only leave reviews for shipped or completed lots.");
            }

            if (lotData.winnerUid !== buyerUid) {
                throw new functions.https.HttpsError("permission-denied", "You can only leave reviews for lots you have won.");
            }

            if (lotData.reviewLeft === true) {
                throw new functions.https.HttpsError("already-exists", "A review has already been left for this lot.");
            }
            
            const buyerDoc = await transaction.get(db.collection('users').doc(buyerUid));
            if (!buyerDoc.exists) {
                 throw new functions.https.HttpsError("not-found", "Could not find your user profile.");
            }
            const buyerUsername = (buyerDoc.data() as User).username;


            const sellerRef = db.collection('users').doc(lotData.sellerUid);
            const sellerDoc = await transaction.get(sellerRef);
            if (!sellerDoc.exists) {
                 throw new functions.https.HttpsError("not-found", "The seller's profile could not be found.");
            }
            const sellerData = sellerDoc.data() as User;
            
            // --- Rating Calculation ---
            const currentRating = sellerData.sellerRating || 0;
            const currentReviewCount = sellerData.sellerReviewCount || 0;
            
            const newReviewCount = currentReviewCount + 1;
            const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;

            // Create the new review
            const newReview: Review = {
                id: reviewRef.id,
                sellerUid: lotData.sellerUid,
                buyerUid,
                buyerUsername,
                lotId,
                lotName: lotData.name,
                rating,
                comment,
                createdAt: new Date().toISOString(),
            };
            
            transaction.set(reviewRef, newReview);
            
            // **THE FIX:** Mark the lot so a second review can't be left
            transaction.update(lotRef, { reviewLeft: true });

            // Update the seller's aggregate rating
            transaction.update(sellerRef, {
                sellerRating: newRating,
                sellerReviewCount: newReviewCount,
            });
        });
        
        return { success: true, message: "Thank you for your review!" };

    } catch (error) {
        console.error("Error leaving review:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while leaving the review.");
    }
});
