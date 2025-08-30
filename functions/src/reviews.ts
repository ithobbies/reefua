
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Review, Order, User } from "./types"; // Змінено Lot на Order

const db = admin.firestore();

export const leaveReview = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to leave a review.");
    }

    const { orderId, rating, comment } = data; // Змінено lotId на orderId
    const buyerUid = context.auth.uid;

    if (!orderId || typeof rating !== 'number' || rating < 1 || rating > 5 || typeof comment !== 'string' || comment.trim() === '') {
        throw new functions.https.HttpsError("invalid-argument", "Please provide a valid order ID, a rating between 1 and 5, and a non-empty comment.");
    }

    const orderRef = db.collection('orders').doc(orderId); // Змінено на orders
    const reviewRef = db.collection('reviews').doc();

    try {
        await db.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                throw new functions.https.HttpsError("not-found", "The specified order does not exist.");
            }

            const orderData = orderDoc.data() as Order;
            
            if (orderData.status !== 'shipped' && orderData.status !== 'completed') {
                throw new functions.https.HttpsError("failed-precondition", "You can only leave reviews for shipped or completed orders.");
            }

            if (orderData.buyerUid !== buyerUid) {
                throw new functions.https.HttpsError("permission-denied", "You can only leave reviews for orders you have purchased.");
            }

            if (orderData.reviewLeft === true) {
                throw new functions.https.HttpsError("already-exists", "A review has already been left for this order.");
            }
            
            const buyerDoc = await transaction.get(db.collection('users').doc(buyerUid));
            if (!buyerDoc.exists) {
                 throw new functions.https.HttpsError("not-found", "Could not find your user profile.");
            }
            const buyerUsername = (buyerDoc.data() as User).username;


            const sellerRef = db.collection('users').doc(orderData.sellerUid);
            const sellerDoc = await transaction.get(sellerRef);
            if (!sellerDoc.exists) {
                 throw new functions.https.HttpsError("not-found", "The seller's profile could not be found.");
            }
            const sellerData = sellerDoc.data() as User;
            
            const currentRating = sellerData.sellerRating || 0;
            const currentReviewCount = sellerData.sellerReviewCount || 0;
            
            const newReviewCount = currentReviewCount + 1;
            const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;

            // Створюємо відгук (зберігаємо інформацію про перший лот для контексту)
            const newReview: Review = {
                id: reviewRef.id,
                sellerUid: orderData.sellerUid,
                buyerUid,
                buyerUsername,
                lotId: orderData.lots[0].id, // Зберігаємо ID першого лота
                lotName: `${orderData.lots[0].name}${orderData.lots.length > 1 ? ` та ще ${orderData.lots.length - 1}` : ''}`,
                rating,
                comment,
                createdAt: new Date().toISOString(),
            };
            
            transaction.set(reviewRef, newReview);
            
            // Ставимо позначку на ЗАМОВЛЕННЯ, а не на лот
            transaction.update(orderRef, { reviewLeft: true });

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
