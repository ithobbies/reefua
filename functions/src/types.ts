
// functions/src/types.ts

// Using string for ISO date format for consistency across client/server
type IsoDateString = string;

export interface User {
  uid: string;
  email: string;
  username: string;
  photoURL: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  isActive: boolean;
  roles: ('user' | 'seller' | 'admin')[];
  lastLogin: IsoDateString;
  pushEnabled: boolean;
  emailNotifications: boolean;
  balance?: number;
  sellerRating?: number;
}

export interface LotParameters {
    salinity?: string;
    par?: string;
    flow?: string;
}

export interface Lot {
  id: string;
  name: string;
  description: string;
  images: string[];
  currentBid: number;
  buyNowPrice?: number | null;
  endTime: IsoDateString;
  sellerUid: string;
  sellerUsername: string;
  category: string;
  status: 'active' | 'sold' | 'unsold';
  winnerUid?: string | null;
  finalPrice?: number | null;
  createdAt: IsoDateString;
  parameters?: LotParameters; // Added optional parameters
}

export interface Bid {
  bidId: string;
  userUid: string;
  username: string;
  amount: number;
  timestamp: IsoDateString;
}
