"use strict";
// functions/src/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.endAuctions = exports.placeBid = exports.createLot = exports.onUserCreate = void 0;
// This file is the entry point for all your Firebase Functions.
// It exports the functions from other files, making them deployable.
const user_1 = require("./user");
Object.defineProperty(exports, "onUserCreate", { enumerable: true, get: function () { return user_1.onUserCreate; } });
const lot_1 = require("./lot");
Object.defineProperty(exports, "createLot", { enumerable: true, get: function () { return lot_1.createLot; } });
Object.defineProperty(exports, "placeBid", { enumerable: true, get: function () { return lot_1.placeBid; } });
const auction_1 = require("./auction");
Object.defineProperty(exports, "endAuctions", { enumerable: true, get: function () { return auction_1.endAuctions; } });
//# sourceMappingURL=index.js.map