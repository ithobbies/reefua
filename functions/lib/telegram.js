"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramWebhook = void 0;
exports.sendTelegramMessage = sendTelegramMessage;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const params_1 = require("firebase-functions/params");
// Define secrets as parameters for secure access
const telegramBotToken = (0, params_1.defineString)('TELEGRAM_BOT_TOKEN');
const db = admin.firestore();
/**
 * Sends a simple text message back to a specific user via Telegram.
 * @param {number} userId The Telegram user ID to send the message to.
 * @param {string} text The message text.
 */
async function sendTelegramMessage(userId, text) {
    var _a;
    const token = telegramBotToken.value();
    if (!token) {
        console.error('Telegram token is not configured.');
        return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios_1.default.post(url, {
            chat_id: userId,
            text: text,
            parse_mode: 'Markdown',
        });
    }
    catch (error) {
        console.error(`Failed to send message to user ${userId}:`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
    }
}
/**
 * HTTP Webhook to receive updates from the Telegram Bot API.
 * This function handles the /start command to link a user's Telegram account.
 */
exports.telegramWebhook = functions.region('us-central1').https.onRequest(async (req, res) => {
    var _a;
    // We only accept POST requests from Telegram
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const update = req.body;
    // Check if the update is a message and if it has text
    if ((_a = update === null || update === void 0 ? void 0 : update.message) === null || _a === void 0 ? void 0 : _a.text) {
        const message = update.message;
        const text = message.text;
        const telegramUserId = message.chat.id;
        const telegramUsername = message.from.username || 'User';
        // Check if the message is the /start command with a payload
        if (text.startsWith('/start ')) {
            const firebaseUid = text.split(' ')[1];
            if (!firebaseUid) {
                await sendTelegramMessage(telegramUserId, 'Вітаю! Це бот для сповіщень з сайту ReefUA. Щоб підключити сповіщення, перейдіть у ваш профіль на сайті.');
                res.status(200).send('OK');
                return;
            }
            try {
                const userRef = db.collection('users').doc(firebaseUid);
                const userDoc = await userRef.get();
                if (!userDoc.exists) {
                    console.warn(`User document not found for UID: ${firebaseUid}`);
                    await sendTelegramMessage(telegramUserId, 'Помилка: ваш акаунт на сайті не знайдено. Будь ласка, спробуйте ще раз.');
                    res.status(200).send('OK');
                    return;
                }
                // Update the user document with their Telegram ID
                await userRef.update({
                    telegramUserId: telegramUserId,
                    updatedAt: new Date().toISOString()
                });
                const userData = userDoc.data();
                const successMessage = `
🎉 *Вітаємо, ${userData.username}!*

Ваш Telegram акаунт (@${telegramUsername}) було успішно підключено до сповіщень з сайту ReefUA.

Ви будете отримувати приватні повідомлення про:
- Нові ставки на ваші лоти
- Перевищення вашої ставки
- Успішний продаж або виграш лота

Дякуємо, що ви з нами!
                `;
                await sendTelegramMessage(telegramUserId, successMessage);
            }
            catch (error) {
                console.error(`Failed to link user ${firebaseUid} with Telegram ID ${telegramUserId}:`, error);
                await sendTelegramMessage(telegramUserId, 'Виникла внутрішня помилка. Спробуйте пізніше.');
            }
        }
    }
    // Always send a 200 OK response to Telegram to acknowledge receipt of the update
    res.status(200).send('OK');
});
//# sourceMappingURL=telegram.js.map