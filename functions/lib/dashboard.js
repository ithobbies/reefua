"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerDashboardData = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https_1 = require("firebase-functions/v1/https");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.getSellerDashboardData = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const sellerUid = context.auth.uid;
    try {
        // --- Stats and Chart Data ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        // Run all stat queries in parallel
        const [ordersSnap, activeListingsSnap, newOrdersSnap, newBidsSnap, salesSnap] = await Promise.all([
            db.collection("orders").where("sellerId", "==", sellerUid).where("status", "==", "completed").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo)).get(),
            db.collection("lots").where("sellerId", "==", sellerUid).where("status", "in", ["active", "published"]).get(),
            db.collection("orders").where("sellerId", "==", sellerUid).where("type", "==", "fixed_price").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(twentyFourHoursAgo)).get(),
            db.collectionGroup("bids").where("lotSellerId", "==", sellerUid).where("createdAt", ">=", admin.firestore.Timestamp.fromDate(twentyFourHoursAgo)).get(),
            db.collection("orders").where("sellerId", "==", sellerUid).where("status", "==", "completed").where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo)).get()
        ]);
        // Process stats
        const totalRevenue = ordersSnap.docs.reduce((acc, doc) => acc + doc.data().totalPrice, 0);
        const activeListings = activeListingsSnap.size;
        const newFixedPriceOrders = newOrdersSnap.size;
        const newAuctionBids = newBidsSnap.size;
        // Process chart data
        const salesByDay = new Map();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            salesByDay.set(d.toISOString().split('T')[0], 0);
        }
        salesSnap.docs.forEach(doc => {
            const orderData = doc.data();
            const date = orderData.createdAt.toDate().toISOString().split('T')[0];
            salesByDay.set(date, (salesByDay.get(date) || 0) + orderData.totalPrice);
        });
        const salesChartData = Array.from(salesByDay.entries()).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // --- Fetch Data for Widgets ---
        const [activeAuctionsSnap, fixedPriceSnap, recentBidsSnap, recentOrdersSnap] = await Promise.all([
            db.collection("lots").where("sellerId", "==", sellerUid).where("status", "==", "active").where("type", "==", "auction").orderBy("endTime", "asc").limit(5).get(),
            db.collection("lots").where("sellerId", "==", sellerUid).where("status", "in", ["active", "published"]).where("type", "==", "direct").orderBy("createdAt", "desc").limit(5).get(),
            db.collectionGroup("bids").where("lotSellerId", "==", sellerUid).orderBy("createdAt", "desc").limit(5).get(),
            db.collection("orders").where("sellerId", "==", sellerUid).orderBy("createdAt", "desc").limit(5).get()
        ]);
        const activeAuctions = activeAuctionsSnap.docs.map(doc => {
            var _a;
            const lot = doc.data();
            return {
                id: doc.id,
                name: lot.name,
                price: `${lot.currentBid || lot.startingBid} ₴`,
                bids: lot.bidCount || 0,
                imageUrl: (_a = lot.images) === null || _a === void 0 ? void 0 : _a[0],
                endDate: new Date(lot.endTime)
            };
        });
        const fixedPriceItems = fixedPriceSnap.docs.map(doc => {
            var _a;
            const lot = doc.data();
            return {
                id: doc.id,
                name: lot.name,
                price: `${lot.price} ₴`,
                imageUrl: (_a = lot.images) === null || _a === void 0 ? void 0 : _a[0]
            };
        });
        let recentActivity = [];
        recentBidsSnap.forEach(doc => {
            const bid = doc.data();
            recentActivity.push({ id: doc.id, type: 'bid', item: bid.lotTitle, value: `${bid.amount} ₴`, user: bid.username, timestamp: bid.createdAt.toDate() });
        });
        recentOrdersSnap.forEach(doc => {
            const order = doc.data();
            recentActivity.push({ id: doc.id, type: 'sale', item: order.lotTitle, value: `${order.totalPrice} ₴`, user: order.buyerName, timestamp: order.createdAt.toDate() });
        });
        recentActivity = recentActivity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
        // --- Construct final object ensuring all keys are present ---
        const dashboardData = {
            stats: {
                totalRevenue: totalRevenue || 0,
                activeListings: activeListings || 0,
                newFixedPriceOrders: newFixedPriceOrders || 0,
                newAuctionBids: newAuctionBids || 0
            },
            salesChartData: salesChartData || [],
            activeAuctions: activeAuctions || [],
            fixedPriceItems: fixedPriceItems || [],
            recentActivity: recentActivity || [],
        };
        return dashboardData;
    }
    catch (error) {
        console.error("CRITICAL Error in getSellerDashboardData for user:", sellerUid, error);
        throw new https_1.HttpsError("internal", "Could not fetch dashboard data.", error);
    }
});
//# sourceMappingURL=dashboard.js.map