
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Order } from "./types";

// Helper function to ensure user is an admin
const ensureAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.roles?.includes("admin")) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "The function must be called by an authenticated admin user."
    );
  }
};

export const getKeyMetrics = functions.https.onCall(async (data, context) => {
  ensureAdmin(context);

  const db = admin.firestore();

  try {
    // 1. Total Users & Telegram Subscribers
    const usersSnapshot = await db.collection("users").get();
    const totalUsers = usersSnapshot.size;
    
    const telegramUsersSnapshot = await db.collection('users').where('telegramUserId', '!=', null).get();
    const telegramSubscribers = telegramUsersSnapshot.size;

    // 2. Active Lots
    const activeLotsSnapshot = await db
      .collection("lots")
      .where("status", "==", "active")
      .get();
    const activeLots = activeLotsSnapshot.size;

    // 3. Total Sales & Total Deals (All Time)
    const completedOrdersSnapshot = await db
      .collection("orders")
      .where("status", "==", "completed")
      .get();

    const totalDeals = completedOrdersSnapshot.size;
    let totalSales = 0;
    completedOrdersSnapshot.forEach((doc) => {
      const order = doc.data() as Order;
      totalSales += order.totalAmount;
    });

    // 4. Sales Conversion Rate
    const finishedLotsSnapshot = await db
      .collection("lots")
      .where("status", "in", ["sold", "completed", "unsold", "cancelled", "finished"])
      .get();
    const totalFinishedLots = finishedLotsSnapshot.size;

    const soldLotsSnapshot = await db
      .collection("lots")
      .where("status", "in", ["sold", "completed"])
      .get();
    const totalSoldLots = soldLotsSnapshot.size;
    
    const salesConversion =
      totalFinishedLots > 0 ? (totalSoldLots / totalFinishedLots) * 100 : 0;

    return {
      totalUsers,
      telegramSubscribers, // New metric
      activeLots,
      totalSales,
      totalDeals,
      salesConversion: parseFloat(salesConversion.toFixed(2)),
    };
  } catch (error) {
    console.error("Error fetching key metrics:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Unable to fetch key metrics.",
      error
    );
  }
});
