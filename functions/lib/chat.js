"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.startOrGetChat = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
exports.startOrGetChat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to start a chat.");
    }
    const buyerUid = context.auth.uid;
    const { lotId } = data;
    if (!lotId) {
        throw new functions.https.HttpsError("invalid-argument", "Lot ID must be provided.");
    }
    const lotRef = db.collection('lots').doc(lotId);
    const lotDoc = await lotRef.get();
    if (!lotDoc.exists) {
        throw new functions.https.HttpsError("not-found", "The specified lot does not exist.");
    }
    const lotData = lotDoc.data();
    const sellerUid = lotData.sellerUid;
    if (buyerUid === sellerUid) {
        throw new functions.https.HttpsError("failed-precondition", "You cannot start a chat with yourself.");
    }
    const chatId = `${lotId}_${buyerUid}`;
    const chatRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatRef.get();
    if (chatDoc.exists) {
        return { chatId: chatDoc.id };
    }
    else {
        const buyerDoc = await db.collection('users').doc(buyerUid).get();
        const sellerDoc = await db.collection('users').doc(sellerUid).get();
        if (!buyerDoc.exists || !sellerDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User profile not found.");
        }
        const buyerData = buyerDoc.data();
        const sellerData = sellerDoc.data();
        const newChat = {
            id: chatId,
            participantUids: [buyerUid, sellerUid],
            participantInfo: {
                [buyerUid]: { username: buyerData.username, photoURL: buyerData.photoURL },
                [sellerUid]: { username: sellerData.username, photoURL: sellerData.photoURL },
            },
            lotId: lotId,
            lotName: lotData.name,
            lotImage: lotData.images[0] || '',
            lastMessage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await chatRef.set(newChat);
        return { chatId: newChat.id };
    }
});
exports.sendMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to send a message.");
    }
    const senderUid = context.auth.uid;
    const { chatId, text } = data;
    if (!chatId || !text || typeof text !== 'string' || text.trim() === '') {
        throw new functions.https.HttpsError("invalid-argument", "Chat ID and a non-empty text message must be provided.");
    }
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages').doc();
    const newMessage = {
        id: messageRef.id,
        senderUid: senderUid,
        text: text,
        timestamp: new Date().toISOString(),
    };
    const lastMessage = {
        text: text,
        timestamp: newMessage.timestamp,
        senderUid: senderUid,
    };
    // Using a batch to perform both writes at once
    const batch = db.batch();
    batch.set(messageRef, newMessage);
    batch.update(chatRef, { lastMessage: lastMessage, updatedAt: newMessage.timestamp });
    await batch.commit();
    return { success: true };
});
//# sourceMappingURL=chat.js.map