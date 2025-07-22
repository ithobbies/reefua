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
  sellerReviewCount?: number;
}

export interface LotParameters {
    difficulty?: string;
    par?: string;
    flow?: string;
}

export interface SellerProfile {
  name: string;
  rating: number;
  reviewsCount: number;
  avatar?: string;
}

export interface Lot {
  id: string;
  name:string;
  description: string;
  images: string[];
  startingBid: number;
  currentBid: number;
  bidCount: number;
  buyNowPrice?: number | null;
  price?: number | null; // For direct sales
  endTime: IsoDateString;
  sellerUid: string;
  sellerUsername: string;
  sellerProfile?: SellerProfile;
  category: string;
  status: 'active' | 'sold' | 'processing' | 'shipped' | 'completed' | 'unsold' | 'cancelled';
  winnerUid?: string | null;
  winnerUsername?: string | null;
  finalPrice?: number | null;
  createdAt: IsoDateString;
  parameters?: LotParameters;
  reviewLeft?: boolean;
  type: 'auction' | 'direct';
}

export interface Bid {
  bidId: string;
  lotId: string;
  userUid: string;
  username: string;
  amount: number;
  timestamp: IsoDateString;
}

export interface Review {
  id: string;
  sellerUid: string;
  buyerUid: string;
  buyerUsername: string;
  lotId: string;
  lotName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: IsoDateString;
}

// --- Chat System Types ---

export interface ChatMessage {
  id: string;
  senderUid: string;
  text: string;
  timestamp: IsoDateString;
}

export interface Chat {
  id: string; // Composite ID: lotId_buyerUid
  participantUids: string[]; // [buyerUid, sellerUid]
  participantInfo: {
    [uid: string]: {
      username: string;
      photoURL?: string | null;
    }
  };
  lotId: string;
  lotName: string;
  lotImage: string;
  lastMessage: {
    text: string;
    timestamp: IsoDateString;
    senderUid: string;
  } | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// --- Order System Types ---

export interface ShippingInfo {
    firstName: string;
    lastName: string;
    phone: string;
    shippingMethod: 'nova-poshta' | 'nova-poshta-courier' | 'pickup' | 'other';
    city?: string;
    department?: string;
    details?: string; // For 'other' shipping method
}


export interface Order {
    id: string;
    buyerUid: string;
    sellerUid: string;
    sellerUsername: string; // To easily display seller info
    lots: Pick<Lot, 'id' | 'name' | 'images' | 'finalPrice'>[];
    totalAmount: number;
    shippingInfo: ShippingInfo;
    status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
    trackingNumber?: string;
    createdAt: IsoDateString;
    updatedAt: IsoDateString;
}
