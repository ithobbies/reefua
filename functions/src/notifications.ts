
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { type Order, type User } from './types';
// To send emails, you would typically use a service like SendGrid, Mailgun, etc.
// For this example, we'll log to the console, but the structure is here.
// import * as sendgrid from '@sendgrid/mail';
// sendgrid.setApiKey(functions.config().sendgrid.key);

const db = admin.firestore();

export const onOrderCreatedSendEmail = functions.region('us-central1').firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
        const order = snap.data() as Order;

        try {
            // Get seller's and buyer's user data to find their emails
            const sellerDoc = await db.collection('users').doc(order.sellerUid).get();
            const buyerDoc = await db.collection('users').doc(order.buyerUid).get();

            if (!sellerDoc.exists || !buyerDoc.exists) {
                console.error(`Could not find user data for seller ${order.sellerUid} or buyer ${order.buyerUid}`);
                return;
            }

            const seller = sellerDoc.data() as User;
            const buyer = buyerDoc.data() as User;
            
            // --- Email to Seller ---
            const sellerEmail = {
                to: seller.email,
                from: 'no-reply@reefua.com', // Use a verified sender email
                subject: `🎉 Нове замовлення #${order.id.substring(0, 6)} на ReefUA!`,
                html: `
                    <h1>Вітаємо, ${seller.username}!</h1>
                    <p>Ви отримали нове замовлення від покупця ${buyer.username}.</p>
                    <p><strong>Сума замовлення:</strong> ${order.totalAmount.toFixed(2)} грн</p>
                    <p>Будь ласка, увійдіть у свою <a href="https://your-app-url/dashboard/sales/${order.id}">панель керування</a>, щоб переглянути деталі та обробити замовлення.</p>
                    <p>Дякуємо за продаж на ReefUA!</p>
                `,
            };

            // --- Email to Buyer ---
            const buyerEmail = {
                 to: buyer.email,
                from: 'no-reply@reefua.com',
                subject: `✅ Ваше замовлення #${order.id.substring(0, 6)} на ReefUA підтверджено!`,
                html: `
                    <h1>Дякуємо за покупку, ${buyer.username}!</h1>
                    <p>Ваше замовлення, що містить лоти від продавця ${seller.username}, було успішно оформлено.</p>
                    <p><strong>Сума замовлення:</strong> ${order.totalAmount.toFixed(2)} грн</p>
                    <p>Продавець отримав сповіщення і незабаром обробить ваше замовлення. Ви можете переглянути його статус у <a href="https://your-app-url/profile">вашому профілі</a>.</p>
                `,
            };

            // In a real app, you would uncomment the following lines after setting up an email service
            // await sendgrid.send(sellerEmail);
            // await sendgrid.send(buyerEmail);

            // Using console.log to satisfy the linter until a real email service is used.
            console.log(`(Email-simulation) Prepared notification for seller:`, JSON.stringify(sellerEmail));
            console.log(`(Email-simulation) Prepared notification for buyer:`, JSON.stringify(buyerEmail));

        } catch (error) {
            console.error(`Failed to send notification emails for order ${order.id}`, error);
        }
    });
