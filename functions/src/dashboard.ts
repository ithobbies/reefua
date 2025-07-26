import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v1/https";
import { Lot } from "./types"; // Assuming you have a types file

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Define interfaces for the data structures
interface ListingPreview {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string;
  endDate?: Date;
  bids?: number;
  stock?: number;
}

interface ActivityItem {
  id: string;
  type: 'bid' | 'sale';
  item: string;
  value: string;
  user: string; // We'll use a generic name for now
  timestamp: Date;
}

interface SellerDashboardData {
  stats: {
    totalRevenue: number;
    activeListings: number;
    newFixedPriceOrders: number;
    newAuctionBids: number;
  };
  salesChartData: { date: string; revenue: number }[];
  activeAuctions: ListingPreview[];
  fixedPriceItems: ListingPreview[];
  recentActivity: ActivityItem[];
}

export const getSellerDashboardData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const sellerUid = context.auth.uid;

  try {
    // --- Stats and Chart Data (existing logic) ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [ordersSnap, activeListingsSnap, newOrdersSnap, newBidsSnap, salesSnap] = await Promise.all([
      db.collection("orders").where("sellerId", "==", sellerUid).where("status", "==", "completed").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo)).get(),
      db.collection("lots").where("sellerId", "==", sellerUid).where("status", "in", ["active", "published"]).get(),
      db.collection("orders").where("sellerId", "==", sellerUid).where("type", "==", "fixed_price").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(twentyFourHoursAgo)).get(),
      db.collectionGroup("bids").where("lotSellerId", "==", sellerUid).where("createdAt", ">=", admin.firestore.Timestamp.fromDate(twentyFourHoursAgo)).get(),
      db.collection("orders").where("sellerId", "==", sellerUid).where("status", "==", "completed").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo)).get()
    ]);

    const totalRevenue = ordersSnap.docs.reduce((acc, doc) => acc + doc.data().totalPrice, 0);
    const activeListings = activeListingsSnap.size;
    const newFixedPriceOrders = newOrdersSnap.size;
    const newAuctionBids = newBidsSnap.size;
    
    const salesByDay = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesByDay.set(d.toISOString().split('T')[0], 0);
    }
    salesSnap.docs.forEach(doc => {
        const orderData = doc.data();
        const date = (orderData.createdAt as admin.firestore.Timestamp).toDate().toISOString().split('T')[0];
        salesByDay.set(date, (salesByDay.get(date) || 0) + orderData.totalPrice);
    });
    const salesChartData = Array.from(salesByDay.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // --- Fetch Data for Widgets ---
    
    // Active Auctions
    const activeAuctionsSnap = await db.collection("lots")
      .where("sellerId", "==", sellerUid)
      .where("status", "==", "active")
      .where("type", "==", "auction")
      .orderBy("endDate", "asc")
      .limit(5)
      .get();
    
    const activeAuctions = activeAuctionsSnap.docs.map(doc => {
        const lot = doc.data() as Lot;
        return {
            id: doc.id,
            name: lot.title,
            price: lot.currentPrice?.toLocaleString('uk-UA') + ' ₴' || lot.startPrice.toLocaleString('uk-UA') + ' ₴',
            bids: lot.bidsCount || 0,
            imageUrl: lot.imageUrls?.[0] || '',
            endDate: (lot.endDate as admin.firestore.Timestamp).toDate()
        };
    });

    // Fixed Price Items
    const fixedPriceSnap = await db.collection("lots")
      .where("sellerId", "==", sellerUid)
      .where("status", "in", ["active", "published"])
      .where("type", "==", "fixed_price")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();
      
    const fixedPriceItems = fixedPriceSnap.docs.map(doc => {
        const lot = doc.data() as Lot;
        return {
            id: doc.id,
            name: lot.title,
            price: lot.startPrice.toLocaleString('uk-UA') + ' ₴',
            stock: lot.stock || 0,
            imageUrl: lot.imageUrls?.[0] || ''
        };
    });

    // Recent Activity (Sales and Bids)
    const recentBidsSnap = await db.collectionGroup("bids")
        .where("lotSellerId", "==", sellerUid)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();
    
    const recentOrdersSnap = await db.collection("orders")
        .where("sellerId", "==", sellerUid)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

    let recentActivity: ActivityItem[] = [];
    recentBidsSnap.forEach(doc => {
        const bid = doc.data();
        recentActivity.push({
            id: doc.id,
            type: 'bid',
            item: bid.lotTitle || 'Невідомий лот',
            value: bid.amount.toLocaleString('uk-UA') + ' ₴',
            user: bid.userName || 'Анонім',
            timestamp: (bid.createdAt as admin.firestore.Timestamp).toDate()
        });
    });

    recentOrdersSnap.forEach(doc => {
        const order = doc.data();
        recentActivity.push({
            id: doc.id,
            type: 'sale',
            item: order.lotTitle || 'Невідомий товар',
            value: order.totalPrice.toLocaleString('uk-UA') + ' ₴',
            user: order.buyerName || 'Анонім',
            timestamp: (order.createdAt as admin.firestore.Timestamp).toDate()
        });
    });
    
    // Sort combined activities by date and take the latest 5
    recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    recentActivity = recentActivity.slice(0, 5);
    
    // --- Construct final object ---
    const dashboardData: SellerDashboardData = {
        stats: { totalRevenue, activeListings, newFixedPriceOrders, newAuctionBids },
        salesChartData,
        activeAuctions,
        fixedPriceItems,
        recentActivity,
    };

    return dashboardData;

  } catch (error) {
    console.error("Error in getSellerDashboardData for user:", sellerUid, error);
    throw new HttpsError("internal", "Could not fetch dashboard data.", error);
  }
});
