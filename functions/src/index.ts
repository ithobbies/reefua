
// functions/src/index.ts

// This file is the entry point for all your Firebase Functions.
// It exports the functions from other files, making them deployable.

import { onUserCreate } from './user';
import { createLot, placeBid } from './lot';
import { endAuctions } from './auction';

export {
    // User-related functions
    onUserCreate,

    // Lot and bid-related functions
    createLot,
    placeBid,

    // Scheduled functions
    endAuctions,
};
