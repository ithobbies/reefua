
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { Lot } from "./types";

const db = admin.firestore();

interface AddToCartData {
    lotId: string;
}

export const addToCart = functions.region('us-central1').https.onCall(async (data: AddToCartData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to add items to the cart.");
    }

    const { lotId } = data;
    const userId = context.auth.uid;

    if (!lotId) {
        throw new functions.https.HttpsError("invalid-argument", "A lotId must be provided.");
    }

    const lotRef = db.collection('lots').doc(lotId);
    const cartRef = db.collection('cartItems');

    return db.runTransaction(async (transaction) => {
        const lotDoc = await transaction.get(lotRef);

        if (!lotDoc.exists) {
            throw new functions.https.HttpsError("not-found", "The requested lot does not exist.");
        }

        const lotData = lotDoc.data() as Lot;

        if (lotData.status !== 'active' || lotData.type !== 'direct') {
            throw new functions.https.HttpsError("failed-precondition", "This lot cannot be added to the cart.");
        }
        
        if (lotData.sellerUid === userId) {
             throw new functions.https.HttpsError("failed-precondition", "You cannot add your own lot to the cart.");
        }
        
        // Check if item is already in cart for this user
        const existingCartItemQuery = cartRef.where('userId', '==', userId).where('lotId', '==', lotId);
        const existingCartItemSnapshot = await transaction.get(existingCartItemQuery);
        
        if (!existingCartItemSnapshot.empty) {
            throw new functions.https.HttpsError("already-exists", "This item is already in your cart.");
        }

        const newCartItemRef = db.collection('cartItems').doc();

        transaction.set(newCartItemRef, {
            userId,
            lotId,
            addedAt: admin.firestore.FieldValue.serverTimestamp(),
            lotData: {
                name: lotData.name,
                price: lotData.price,
                images: lotData.images,
                sellerUid: lotData.sellerUid,
                sellerUsername: lotData.sellerUsername,
            }
        });

        return { success: true, cartItemId: newCartItemRef.id };
    });
});
