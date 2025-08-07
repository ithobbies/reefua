
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { type User, type Lot, type Bid, type Chat, type ChatMessage } from './types';
import { defineString } from 'firebase-functions/params';

const telegramBotToken = defineString('TELEGRAM_BOT_TOKEN');
const telegramChatId = defineString('TELEGRAM_CHAT_ID');

const db = admin.firestore();

// --- Reusable Telegram Functions ---

async function sendTelegramMessage(userId: number, text: string) {
    const token = telegramBotToken.value();
    if (!token) { console.error('TG token not configured.'); return; }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios.post(url, { chat_id: userId, text, parse_mode: 'Markdown' });
    } catch (error: any) {
        console.error(`Failed to send message to user ${userId}:`, error.response?.data || error.message);
    }
}

async function sendTelegramPhoto(chatId: string, photoUrl: string, caption: string) {
    const token = telegramBotToken.value();
    if (!token) { console.error('TG token not configured.'); return; }
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;
    try {
        await axios.post(url, { chat_id: chatId, photo: photoUrl, caption, parse_mode: 'Markdown' });
        console.log('Successfully sent Telegram photo to', chatId);
    } catch (error: any) {
        console.error('Failed to send Telegram photo:', error.response?.data || error.message);
    }
}


// --- Firestore Triggers for Notifications ---

/**
 * Triggered when a new chat message is sent.
 * Notifies the recipient via Telegram.
 */
export const onNewChatMessage = functions.region('us-central1').firestore
    .document('chats/{chatId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data() as ChatMessage;
        const { chatId } = context.params;

        const chatDocRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatDocRef.get();

        if (!chatDoc.exists) {
            console.log(`Chat document ${chatId} not found.`);
            return;
        }

        const chat = chatDoc.data() as Chat;
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
        
        const recipient = userDoc.data() as User;
        const telegramId = recipient.telegramUserId;

        if (telegramId) {
            const senderUsername = chat.participantInfo[senderUid]?.username || 'Користувач';
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
export const onLotSold = functions.region('us-central1').firestore
    .document('lots/{lotId}')
    .onUpdate(async (change, context) => {
        const lotBefore = change.before.data() as Lot;
        const lotAfter = change.after.data() as Lot;
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
                const winner = winnerDoc.data() as User;
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
                const seller = sellerDoc.data() as User;
                if (seller.telegramUserId) {
                    const winnerUsername = (winnerDoc.data() as User)?.username || 'переможець';
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
export const onNewBidNotifyOutbidUser = functions.region('us-central1').firestore
    .document('lots/{lotId}/bids/{bidId}')
    .onCreate(async (snap, context) => {
        const { lotId } = context.params;
        const bidsRef = db.collection('lots').doc(lotId).collection('bids');
        const bidsSnap = await bidsRef.orderBy('amount', 'desc').get();

        if (bidsSnap.docs.length < 2) { return; }

        const highestBidder = bidsSnap.docs[0].data() as Bid;
        const outbidUserBid = bidsSnap.docs[1].data() as Bid;

        if (highestBidder.userUid === outbidUserBid.userUid) { return; }

        const userDoc = await db.collection('users').doc(outbidUserBid.userUid).get();
        if (!userDoc.exists) { return; }

        const outbidUser = userDoc.data() as User;
        const telegramId = outbidUser.telegramUserId;

        if (telegramId) {
            const lotDoc = await db.collection('lots').doc(lotId).get();
            const lot = lotDoc.data() as Lot;
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
export const onNewLotSendTelegramNotification = functions.region('us-central1').firestore
    .document('lots/{lotId}')
    .onCreate(async (snap, context) => {
        const lot = snap.data() as Lot;
        const lotId = context.params.lotId;

        if (lot.status !== 'active' || !lot.images || lot.images.length === 0) { return; }
        
        const lotUrl = `https://reefua.store/lot/${lotId}`;
        const imageUrl = lot.images[0];
        let priceInfo = lot.type === 'auction' 
            ? `*Стартова ціна:* ${lot.startingBid} грн` + (lot.buyNowPrice ? `\n*Купити зараз:* ${lot.buyNowPrice} грн` : '')
            : `*Ціна:* ${lot.price} грн`;

        const caption = `
🆕 *Новий лот на ReefUA!*

*Назва:* ${lot.name}
*Продавець:* ${lot.sellerUsername}
${priceInfo}

[Переглянути лот](${lotUrl})
        `;
        await sendTelegramPhoto(telegramChatId.value(), imageUrl, caption);
    });

export const onOrderCreatedSendEmail = functions.region('us-central1').firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => { /* ... */ });
