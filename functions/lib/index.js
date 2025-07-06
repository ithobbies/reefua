"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize Firebase Admin SDK.
// This is done once here. Other files should not re-initialize without checking admin.apps.length.
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Export all functions from their respective files
__exportStar(require("./lot"), exports); // Exports createLot, buyNow
__exportStar(require("./user"), exports); // Exports createUserDocument, updateUserProfile
__exportStar(require("./auction"), exports); // Exports endAuctions
__exportStar(require("./bids"), exports); // Exports placeBid, getMyBids
__exportStar(require("./reviews"), exports); // Exports leaveReview
__exportStar(require("./chat"), exports); // Exports startOrGetChat, sendMessage
__exportStar(require("./orders"), exports); // Exports createOrder, onOrderUpdate
__exportStar(require("./notifications"), exports); // Exports onOrderCreatedSendEmail
//# sourceMappingURL=index.js.map