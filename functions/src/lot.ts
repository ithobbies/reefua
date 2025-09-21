
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { Lot, User } from "./types";
import { sendTelegramMessage } from './telegram'; // Импортируем функцию и типы

const db = admin.firestore();

// ... (остальные функции: createLot, buyNow, searchLots, reactivateLot) ...
// Я не буду повторять их код здесь, чтобы не загромождать ответ.
// Просто представьте, что они здесь без изменений.

export const createLot = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
        functions.logger.warn("createLot call without authentication.");
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a lot.");
    }
    const { uid: sellerUid } = context.auth;
    functions.logger.info(`Lot creation initiated by user: ${sellerUid}`, { structuredData: true });
    functions.logger.info("Received lot data:", data);

    try {
        const userDoc = await db.collection('users').doc(sellerUid).get();
        if (!userDoc.exists) {
            functions.logger.error(`User profile not found for UID: ${sellerUid}`);
            throw new functions.https.HttpsError("not-found", "Seller profile does not exist.");
        }
        const userData = userDoc.data() as User;
        functions.logger.info(`Retrieved user data for ${sellerUid}:`, userData);
        
        const sellerUsername = userData.username || 'Unknown Seller';
        const sellerAccountType = (userData.roles && userData.roles.includes('shop')) ? 'shop' : 'individual';

        const { name, description, category, subcategory, region, city, startingBid, buyNowPrice, endTime, images, parameters, type, price } = data;
        
        const isShop = sellerAccountType === 'shop';
        const lotRegion = isShop && userData.shopRegion ? userData.shopRegion : region;
        const lotCity = isShop && userData.shopCity ? userData.shopCity : city;
        const lotPhoneNumber = isShop ? userData.shopPhoneNumber : undefined;

        if (!name || !description || !category || !subcategory || !lotRegion || !lotCity || !images || !Array.isArray(images) || images.length === 0 || !type) {
            functions.logger.warn("Validation failed. Missing required fields.", {
                name, description, category, subcategory, lotRegion, lotCity, images, type
            });
            throw new functions.https.HttpsError("invalid-argument", "Required lot information is missing or invalid, including location.");
        }

        const lotRef = db.collection("lots").doc();
        const now = new Date();
        const nowISO = now.toISOString();

        let newLot: Lot;

        if (type === 'direct') {
            if (typeof price !== 'number' || price <= 0) {
                throw new functions.https.HttpsError("invalid-argument", "A valid price is required for direct sales.");
            }
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);

            newLot = {
                id: lotRef.id,
                name,
                description,
                images,
                price,
                sellerUid,
                sellerUsername,
                sellerAccountType,
                category,
                subcategory,
                region: lotRegion,
                city: lotCity,
                status: 'active',
                createdAt: nowISO,
                endTime: thirtyDaysFromNow.toISOString(),
                type: 'direct',
                parameters: parameters || {},
                bidCount: 0,
                winnerUid: null,
                finalPrice: null,
                reviewLeft: false,
                startingBid: 0,
                currentBid: 0,
            };
        } else if (type === 'auction') {
            if (typeof startingBid !== 'number' || !endTime) {
                functions.logger.warn("Auction validation failed. Missing startingBid or endTime.", { startingBid, endTime });
                throw new functions.https.HttpsError("invalid-argument", "Starting bid and end time are required for auctions.");
            }
            if (typeof endTime !== 'string' || isNaN(Date.parse(endTime))) {
                functions.logger.error(`Invalid endTime format received: ${endTime}`);
                throw new functions.https.HttpsError('invalid-argument', 'The endTime must be a valid ISO 8601 date string.');
            }
            newLot = {
                id: lotRef.id,
                name,
                description,
                images,
                startingBid,
                currentBid: startingBid,
                buyNowPrice: buyNowPrice || null,
                endTime,
                sellerUid,
                sellerUsername,
                sellerAccountType,
                category,
                subcategory,
                region: lotRegion,
                city: lotCity,
                status: 'active',
                createdAt: nowISO,
                parameters: parameters || {},
                bidCount: 0,
                winnerUid: null,
                finalPrice: null,
                reviewLeft: false,
                type: 'auction',
            };
        } else {
            throw new functions.https.HttpsError("invalid-argument", "Invalid lot type specified.");
        }
        
        // --- FIX: Conditionally add phoneNumber ---
        if (lotPhoneNumber) {
            (newLot as any).phoneNumber = lotPhoneNumber;
        }

        functions.logger.info(`Attempting to set new lot ${lotRef.id}`, { lotData: newLot });

        await lotRef.set(newLot);
        
        functions.logger.info(`Successfully created lot ${lotRef.id}`);
        return { success: true, id: newLot.id };

    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        functions.logger.error(`Unexpected error in createLot for user ${sellerUid}:`, error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred while creating the lot.", error);
    }
});

export const buyNow = functions.region('us-central1').https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed.' });
        return;
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided or malformed token.' });
            return;
        }
        const idToken = authHeader.split('Bearer ')[1];

        let decodedIdToken;
        try {
            decodedIdToken = await admin.auth().verifyIdToken(idToken);
        } catch (authError: any) {
            res.status(401).json({ error: authError.message || 'Unauthorized: Invalid token.' });
            return;
        }
        const buyerUid = decodedIdToken.uid;

        if (!req.body || !req.body.data || typeof req.body.data.lotId !== 'string' || req.body.data.lotId.trim() === '') {
            res.status(400).json({ error: 'Bad Request: lotId must be a non-empty string in {data: {lotId: "..."}}.' });
            return;
        }
        const { lotId } = req.body.data as { lotId: string };

        const lotRef = db.collection("lots").doc(lotId);

        await db.runTransaction(async (transaction) => {
            const lotDoc = await transaction.get(lotRef);
            if (!lotDoc.exists) {
                const err = new Error("Лот не знайдено.") as any;
                err.status = 404;
                throw err;
            }

            const lot = lotDoc.data() as Lot;

            if (lot.status !== 'active') {
                const err = new Error("Лот більше не доступний.") as any;
                err.status = 412;
                throw err;
            }
            if (lot.sellerUid === buyerUid) {
                const err = new Error("Ви не можете купити свій лот.") as any;
                err.status = 412;
                throw err;
            }

            if (lot.type === 'auction') {
                const finalPrice = lot.buyNowPrice;
                if (!finalPrice) {
                    const err = new Error("Цей лот не можна купити зараз.") as any;
                    err.status = 412;
                    throw err;
                }
                
                transaction.update(lotRef, {
                    status: 'sold',
                    winnerUid: buyerUid,
                    finalPrice: finalPrice,
                    endTime: new Date().toISOString(),
                });

            } else if (lot.type === 'direct') {
                // No transaction update is needed for direct sales.
            }
        });

        res.status(200).json({ data: { success: true, message: "Вітаємо з покупкою!" } });

    } catch (error: any) {
        const statusCode = error.status || 500;
        const message = error.message || "Сталася внутрішня помилка на сервері.";
        res.status(statusCode).json({ error: message });
    }
});

export const expireDirectSales = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date().toISOString();
    const query = db.collection('lots')
        .where('type', '==', 'direct')
        .where('status', '==', 'active')
        .where('endTime', '<=', now);

    const snapshot = await query.get();

    if (snapshot.empty) {
        console.log('No expired direct sales lots to update.');
        return null;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
        const lot = doc.data() as Lot;

        // Отправляем уведомление перед обновлением
        const userRef = db.collection('users').doc(lot.sellerUid);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data() as User;
            if (userData.telegramUserId) {
                const message = `⌛️ Термін дії вашого оголошення "${lot.name}" закінчився, і воно було деактивовано. Ви можете знову активувати його в особистому кабінеті.`;
                sendTelegramMessage(userData.telegramUserId, message).catch(err => console.error(err));
            }
        }
        
        batch.update(doc.ref, { status: 'unsold' });
    }

    await batch.commit();
    console.log(`Expired ${snapshot.size} direct sales lots.`);
    return null;
});

export const searchLots = functions.region('us-central1').https.onCall(async (data, context) => {
    const { query } = data;

    if (typeof query !== 'string' || query.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'A non-empty search query string is required.');
    }

    const lowerCaseQuery = query.toLowerCase();

    try {
        const lotsSnapshot = await db.collection('lots').where('status', '==', 'active').get();
        
        if (lotsSnapshot.empty) {
            return [];
        }

        const allLots = lotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lot[];

        const filteredLots = allLots.filter(lot => {
            const nameMatch = lot.name?.toLowerCase().includes(lowerCaseQuery) || false;
            const descriptionMatch = lot.description?.toLowerCase().includes(lowerCaseQuery) || false;
            const categoryMatch = lot.category?.toLowerCase().includes(lowerCaseQuery) || false;
            const subcategoryMatch = lot.subcategory?.toLowerCase().includes(lowerCaseQuery) || false;

            return nameMatch || descriptionMatch || categoryMatch || subcategoryMatch;
        });

        return filteredLots;

    } catch (error) {
        console.error("Error searching lots:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while searching for lots.');
    }
});

export const reactivateLot = functions.region('us-central1').https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Для выполнения этого действия необходимо авторизоваться."
      );
    }
  
    const { lotId } = data;
    if (!lotId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Необходимо указать ID лота."
      );
    }
  
    const db = admin.firestore();
    const lotRef = db.collection("lots").doc(lotId);
    const uid = context.auth.uid;
  
    try {
      const lotDoc = await lotRef.get();
  
      if (!lotDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Лот не найден.");
      }
  
      const lotData = lotDoc.data() as Lot;
  
      if (lotData.sellerUid !== uid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Вы не можете редактировать чужой лот."
        );
      }
      
      if (lotData.status !== 'unsold' && lotData.status !== 'finished') {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Можно активировать только непроданные или завершенные объявления."
        );
      }
  
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
  
      await lotRef.update({
        status: "active",
        createdAt: now.toISOString(),
        endTime: thirtyDaysFromNow.toISOString(),
      });
  
      return { success: true, message: "Объявление успешно активировано." };
    } catch (error) {
      console.error(`Ошибка при активации лота ${lotId}:`, error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError("internal", "Произошла внутренняя ошибка.");
    }
});
