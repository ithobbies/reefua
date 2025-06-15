export interface Lot {
  id: string;
  name: string;
  imageUrl: string;
  dataAiHint?: string;
  currentBid: number;
  buyNowPrice?: number;
  endTime: Date;
  seller: string;
  parameters: {
    salinity: string;
    par: string;
    flow: string;
  };
  images: string[];
  bidHistory: Bid[];
}

export interface Bid {
  user: string;
  amount: number;
  timestamp: Date;
}

const fiveMinutes = () => new Date(Date.now() + 5 * 60 * 1000);
const oneHour = () => new Date(Date.now() + 60 * 60 * 1000);
const twoDays = () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

export const mockLots: Lot[] = [
  {
    id: '1',
    name: 'Фраг Acropora "Strawberry Shortcake"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'coral reef',
    currentBid: 1200,
    buyNowPrice: 2500,
    endTime: fiveMinutes(),
    seller: 'ReefMasterUA',
    parameters: { salinity: '1.025 SG', par: '350-450 PAR', flow: 'Сильна течія' },
    images: ['https://placehold.co/800x600.png', 'https://placehold.co/800x600.png', 'https://placehold.co/800x600.png'],
    bidHistory: [
      { user: 'AquaFan', amount: 1200, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
      { user: 'CoralLover', amount: 1100, timestamp: new Date(Date.now() - 20 * 60 * 1000) },
    ],
  },
  {
    id: '2',
    name: 'Зоантус "Rasta"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'zoanthid coral',
    currentBid: 350,
    endTime: oneHour(),
    seller: 'FragHub',
    parameters: { salinity: '1.026 SG', par: '100-150 PAR', flow: 'Помірна течія' },
    images: ['https://placehold.co/800x600.png'],
    bidHistory: [
      { user: 'NanoReefer', amount: 350, timestamp: new Date(Date.now() - 5 * 60 * 1000) },
    ],
  },
  {
    id: '3',
    name: 'Goniopora "Red"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'goniopora coral',
    currentBid: 800,
    buyNowPrice: 1500,
    endTime: twoDays(),
    seller: 'ReefDreams',
    parameters: { salinity: '1.025 SG', par: '150-250 PAR', flow: 'Слабка течія' },
    images: ['https://placehold.co/800x600.png', 'https://placehold.co/800x600.png'],
    bidHistory: [],
  },
  {
    id: '4',
    name: 'Euphyllia "Torch Gold"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'torch coral',
    currentBid: 2200,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    seller: 'GoldenReefs',
     parameters: { salinity: '1.025 SG', par: '150-250 PAR', flow: 'Помірна течія' },
    images: ['https://placehold.co/800x600.png', 'https://placehold.co/800x600.png'],
    bidHistory: [
       { user: 'HighEndCorals', amount: 2200, timestamp: new Date(Date.now() - 60 * 60 * 1000) },
    ],
  },
   {
    id: '5',
    name: 'Ricordea Florida "Orange"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'ricordea mushroom',
    currentBid: 450,
    buyNowPrice: 700,
    endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    seller: 'NanoDelights',
    parameters: { salinity: '1.024 SG', par: '50-100 PAR', flow: 'Дуже слабка течія' },
    images: ['https://placehold.co/800x600.png'],
    bidHistory: [
      { user: 'MushroomMan', amount: 450, timestamp: new Date(Date.now() - 2 * 60 * 1000) },
    ],
  },
  {
    id: '6',
    name: 'Montipora "Sunset"',
    imageUrl: 'https://placehold.co/400x300.png',
    dataAiHint: 'montipora coral',
    currentBid: 600,
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    seller: 'SPSKing',
    parameters: { salinity: '1.026 SG', par: '300-400 PAR', flow: 'Сильна течія' },
    images: ['https://placehold.co/800x600.png', 'https://placehold.co/800x600.png'],
    bidHistory: [
      { user: 'StickCollector', amount: 600, timestamp: new Date(Date.now() - 15 * 60 * 1000) },
    ],
  }
];

export const mockWonLots = mockLots.slice(0, 2).map(lot => ({ ...lot, wonPrice: lot.currentBid + 100 }));

export const mockUserBids = [
  { lotName: mockLots[2].name, lotId: mockLots[2].id, yourBid: 750, currentBid: mockLots[2].currentBid, status: 'Перебито' },
  { lotName: mockLots[0].name, lotId: mockLots[0].id, yourBid: 1200, currentBid: mockLots[0].currentBid, status: 'Виграєте' },
];

export const mockPaymentHistory = [
  { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), item: 'Замовлення #123 (Лот "Rasta", Лот "Red")', amount: 1150, status: 'Оплачено' },
  { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), item: 'Поповнення балансу', amount: 2000, status: 'Зараховано' },
];

export const mockSellerStats = {
  activeLots: 15,
  completedSales: 82,
  salesPercentage: 75, // Assuming this is (sold / (sold + unsold)) * 100
  rating: 4.8,
  totalListings: 110,
};
