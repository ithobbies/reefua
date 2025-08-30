"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderCreatedNotifications = exports.onNewLotSendTelegramNotification = exports.onNewBidNotifyOutbidUser = exports.onLotSold = exports.onNewChatMessage = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const params_1 = require("firebase-functions/params");
const telegramBotToken = (0, params_1.defineString)('TELEGRAM_BOT_TOKEN');
const telegramChatId = (0, params_1.defineString)('TELEGRAM_CHAT_ID');
const db = admin.firestore();
// --- Reusable Telegram Functions ---
// Helper function to escape special characters for Telegram's original Markdown parser.
const escapeMarkdown = (text) => {
    if (!text)
        return '';
    // Characters to escape for Markdown: _, *, `, [
    return text
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/`/g, '\\`')
        .replace(/\[/g, '\\[');
};
async function sendTelegramMessage(userId, text) {
    var _a;
    const token = telegramBotToken.value();
    if (!token) {
        console.error('TG token not configured.');
        return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios_1.default.post(url, { chat_id: userId, text, parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error(`Failed to send message to user ${userId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
}
async function sendTelegramPhoto(chatId, photoUrl, caption) {
    var _a;
    const token = telegramBotToken.value();
    if (!token) {
        console.error('TG token not configured.');
        return;
    }
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    try {
        await axios_1.default.post(url, { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'Markdown' });
        console.log('Successfully sent Telegram photo to', chatId);
    }
    catch (error) {
        console.error('Failed to send Telegram photo:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
}
// --- Firestore Triggers for Notifications ---
/**
 * Triggered when a new chat message is sent.
 * Notifies the recipient via Telegram.
 */
exports.onNewChatMessage = functions.region('us-central1').firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
    var _a;
    const message = snap.data();
    const { chatId } = context.params;
    const chatDocRef = db.collection('chats').doc(chatId);
    const chatDoc = await chatDocRef.get();
    if (!chatDoc.exists) {
        console.log(`Chat document ${chatId} not found.`);
        return;
    }
    const chat = chatDoc.data();
    const senderUid = message.senderUid;
    const recipientUid = chat.participantUids.find(uid => uid !== senderUid);
    if (!recipientUid) {
        console.log("Could not determine the recipient.");
        return;
    }
    const userDoc = await db.collection('users').doc(recipientUid).get();
    if (!userDoc.exists) {
        console.log(`Recipient user ${recipientUid} not found.`);
        return;
    }
    const recipient = userDoc.data();
    const telegramId = recipient.telegramUserId;
    if (telegramId) {
        const senderUsername = ((_a = chat.participantInfo[senderUid]) === null || _a === void 0 ? void 0 : _a.username) || 'Користувач';
        const siteUrl = 'https://reefua.store';
        const chatUrl = `${siteUrl}/dashboard/messages`;
        const notificationMessage = `
📬 *Нове повідомлення від ${senderUsername}*

Щодо лоту: *"${chat.lotName}"*

[Відповісти на сайті](${chatUrl})
            `;
        await sendTelegramMessage(telegramId, notificationMessage);
    }
});
/**
 * Triggered when a lot's status changes.
 * Sends notifications to the winner and seller when a lot is sold.
 */
exports.onLotSold = functions.region('us-central1').firestore
    .document('lots/{lotId}')
    .onUpdate(async (change, context) => {
    var _a;
    const lotBefore = change.before.data();
    const lotAfter = change.after.data();
    const lotId = context.params.lotId;
    if (lotBefore.status !== 'sold' && lotAfter.status === 'sold') {
        const winnerId = lotAfter.winnerUid;
        const sellerId = lotAfter.sellerUid;
        const siteUrl = 'https://reefua.store';
        if (!winnerId) {
            console.log(`Lot ${lotId} was marked as sold without a winnerUid.`);
            return;
        }
        const [winnerDoc, sellerDoc] = await Promise.all([
            db.collection('users').doc(winnerId).get(),
            db.collection('users').doc(sellerId).get()
        ]);
        if (winnerDoc.exists) {
            const winner = winnerDoc.data();
            if (winner.telegramUserId) {
                const message = `
🎉 *Вітаємо! Ви виграли лот!*

Ви успішно виграли аукціон на лот *"${lotAfter.name}"* за ціною *${lotAfter.finalPrice || lotAfter.currentBid} грн*.

Будь ласка, перейдіть до [ваших покупок](${siteUrl}/profile), щоб оформити замовлення.
                    `;
                await sendTelegramMessage(winner.telegramUserId, message);
            }
        }
        if (sellerDoc.exists) {
            const seller = sellerDoc.data();
            if (seller.telegramUserId) {
                const winnerUsername = ((_a = winnerDoc.data()) === null || _a === void 0 ? void 0 : _a.username) || 'переможець';
                const message = `
✅ *Ваш лот продано!*

Ваш лот *"${lotAfter.name}"* було успішно продано користувачу *${winnerUsername}* за ціною *${lotAfter.finalPrice || lotAfter.currentBid} грн*.

Очікуйте на оформлення замовлення покупцем. [Переглянути продаж](${siteUrl}/dashboard/sales)
                    `;
                await sendTelegramMessage(seller.telegramUserId, message);
            }
        }
    }
});
/**
 * Triggered when a new bid is placed on a lot.
 * Notifies the previously outbid user.
 */
exports.onNewBidNotifyOutbidUser = functions.region('us-central1').firestore
    .document('lots/{lotId}/bids/{bidId}')
    .onCreate(async (snap, context) => {
    const { lotId } = context.params;
    const bidsRef = db.collection('lots').doc(lotId).collection('bids');
    const bidsSnap = await bidsRef.orderBy('amount', 'desc').get();
    if (bidsSnap.docs.length < 2) {
        return;
    }
    const highestBidder = bidsSnap.docs[0].data();
    const outbidUserBid = bidsSnap.docs[1].data();
    if (highestBidder.userUid === outbidUserBid.userUid) {
        return;
    }
    const userDoc = await db.collection('users').doc(outbidUserBid.userUid).get();
    if (!userDoc.exists) {
        return;
    }
    const outbidUser = userDoc.data();
    const telegramId = outbidUser.telegramUserId;
    if (telegramId) {
        const lotDoc = await db.collection('lots').doc(lotId).get();
        const lot = lotDoc.data();
        const lotUrl = `https://reefua.store/lot/${lotId}`;
        const message = `
🔴 *Вашу ставку перебито!*

Вашу ставку на лот *"${lot.name}"* було перебито.
Нова ставка: *${highestBidder.amount} грн*.

[Зробити нову ставку](${lotUrl})
            `;
        await sendTelegramMessage(telegramId, message);
    }
});
/**
 * Triggered when a new lot is created.
 */
exports.onNewLotSendTelegramNotification = functions.region('us-central1').firestore
    .document('lots/{lotId}')
    .onCreate(async (snap, context) => {
    const lot = snap.data();
    const lotId = context.params.lotId;
    if (lot.status !== 'active' || !lot.images || lot.images.length === 0) {
        return;
    }
    const lotUrl = `https://reefua.store/lot/${lotId}`;
    const imageUrl = lot.images[0];
    const name = escapeMarkdown(lot.name);
    const sellerUsername = escapeMarkdown(lot.sellerUsername);
    const location = escapeMarkdown(`${lot.city}, ${lot.region}`);
    let priceInfo = lot.type === 'auction'
        ? `*Стартова ціна:* ${lot.startingBid} грн` + (lot.buyNowPrice ? `\n*Купити зараз:* ${lot.buyNowPrice} грн` : '')
        : `*Ціна:* ${lot.price} грн`;
    const caption = `
🆕 *Новий лот на ReefUA!*

*Назва:* ${name}
*Продавець:* ${sellerUsername}
📍 *Місце:* ${location}
${priceInfo}

[Переглянути лот](${lotUrl})
        `;
    await sendTelegramPhoto(telegramChatId.value(), imageUrl, caption);
});
exports.onOrderCreatedNotifications = functions.region('us-central1').firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
    var _a;
    const order = snap.data();
    const { buyerUid, sellerUid } = order;
    const siteUrl = 'https://reefua.store';
    const [buyerDoc, sellerDoc] = await Promise.all([
        db.collection('users').doc(buyerUid).get(),
        db.collection('users').doc(sellerUid).get()
    ]);
    if (buyerDoc.exists) {
        const buyer = buyerDoc.data();
        if (buyer.telegramUserId) {
            const message = `
✅ *Дякуємо за покупку!*

Ваше замовлення *№${order.id.substring(0, 6)}...* було успішно створено.
Продавець отримав сповіщення і зв'яжеться з вами найближчим часом.

[Переглянути історію замовлень](${siteUrl}/profile)
                `;
            await sendTelegramMessage(buyer.telegramUserId, message);
        }
    }
    if (sellerDoc.exists) {
        const seller = sellerDoc.data();
        if (seller.telegramUserId) {
            const buyerUsername = ((_a = buyerDoc.data()) === null || _a === void 0 ? void 0 : _a.username) || 'покупець';
            const lotNames = order.lots.map(l => `"${l.name}"`).join(', ');
            const message = `
🔔 *У вас нове замовлення!*

Покупець *${buyerUsername}* оформив замовлення *№${order.id.substring(0, 6)}...* на товари: ${lotNames}.
Загальна сума: *${order.totalAmount.toFixed(2)} грн*.

Будь ласка, перейдіть до [панелі продажів](${siteUrl}/dashboard/sales), щоб переглянути деталі та відправити товар.
                `;
            await sendTelegramMessage(seller.telegramUserId, message);
        }
    }
});
//# sourceMappingURL=notifications.js.map