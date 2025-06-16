
'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import PhotoSlider from '@/components/lots/photo-slider';
import ParameterItem from '@/components/lots/parameter-item';
import CountdownBadge from '@/components/ui/countdown-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Zap, Droplets, ShieldAlert, Info, UserCircle, CalendarDays, Tag, AlignLeft, Trophy } from 'lucide-react';

import type { Lot, Bid } from '@/lib/mock-data'; // Re-using types for now
import { useToast } from '@/hooks/use-toast';


interface LotDetailPageProps {
  params: { id: string };
}

// Extend Bid type to include a potential id
interface BidWithId extends Bid {
    id: string;
}

export default function LotDetailPage({ params }: LotDetailPageProps) {
  const [lot, setLot] = useState<Lot | null>(null);
  const [bids, setBids] = useState<BidWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);


  useEffect(() => {
    const fetchLotData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Lot
        const lotRef = doc(db, 'lots', params.id);
        const lotSnap = await getDoc(lotRef);

        if (!lotSnap.exists()) {
          notFound();
          return;
        }
        
        const lotData = {
            ...lotSnap.data(),
            id: lotSnap.id,
            endTime: lotSnap.data().endTime.toDate(),
        } as Lot;

        setLot(lotData);

        // Fetch Bids
        const bidsRef = collection(db, 'lots', params.id, 'bids');
        const q = query(bidsRef, orderBy('timestamp', 'desc'));
        const bidsSnap = await getDocs(q);
        const bidsList = bidsSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            timestamp: doc.data().timestamp.toDate(),
        })) as BidWithId[];
        setBids(bidsList);

      } catch (e) {
        console.error("Error fetching document:", e);
        setError("Не вдалося завантажити лот. Спробуйте оновити сторінку.");
      } finally {
        setLoading(false);
      }
    };

    fetchLotData();
  }, [params.id]);
  
  const handleBidSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
          toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти в систему, щоб робити ставки." });
          return;
      }
      if (!lot) return;

      const amount = parseInt(bidAmount, 10);
      const minBid = (lot.currentBid || 0) + 10;
      if (isNaN(amount) || amount < minBid) {
          toast({ variant: "destructive", title: "Помилка", description: `Ваша ставка має бути не менше ${minBid} грн.` });
          return;
      }

      setIsSubmitting(true);
      try {
        const placeBid = httpsCallable(functions, 'placeBid');
        await placeBid({ lotId: lot.id, amount });
        
        toast({ title: "Успіх!", description: "Вашу ставку прийнято." });
        setBidAmount('');
        // Optimistically update UI or re-fetch data
        // For simplicity, we can just update the current bid locally
        setLot(prevLot => prevLot ? { ...prevLot, currentBid: amount } : null);
        const newBid: BidWithId = { id: 'temp-id', user: user.displayName || 'You', amount: amount, timestamp: new Date() };
        setBids(prevBids => [newBid, ...prevBids]);

      } catch (error: any) {
          console.error("Error placing bid:", error);
          toast({ variant: "destructive", title: "Помилка ставки", description: error.message || "Не вдалося зробити ставку." });
      } finally {
          setIsSubmitting(false);
      }
  };

  if (loading || authLoading) {
    return <div className="text-center py-20">Завантаження...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  if (!lot) {
    return null; // notFound() is called in useEffect, so this is a fallback
  }

  const { name, images, parameters, currentBid, buyNowPrice, endTime, seller, description } = lot;
  const isAuctionActive = new Date(endTime) > new Date();
  
  // Determine winner based on lot status (set by backend function)
  const winnerNickname = lot.status === 'sold' && lot.winner ? lot.winner : null; 


  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PhotoSlider images={images} altText={name} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{name}</CardTitle>
              <CardDescription>Продавець: <span className="text-primary font-medium">{seller}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <h3 className="text-xl font-semibold mb-2 font-headline">Параметри утримання:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ParameterItem label="Солоність" value={parameters.salinity} icon={<Droplets className="h-5 w-5" />} />
                <ParameterItem label="PAR" value={parameters.par} icon={<Zap className="h-5 w-5" />} />
                <ParameterItem label="Течія" value={parameters.flow} icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 20.5C19.2 19.2 20 17.2 20 15.2C20 11.2 16.4 8 12 8C7.6 8 4 11.2 4 15.2C4 17.2 4.84 19.2 6.5 20.5"/><path d="M12 4V8"/><path d="M12 15V20"/><path d="M16 5L14 7"/><path d="M8 5L10 7"/><path d="M19 10L17 11"/><path d="M5 10L7 11"/></svg>} />
              </div>
              <Badge variant="destructive" className="mt-6 p-3 text-sm w-full justify-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Без гарантії живого товару при доставці поштою.
              </Badge>
            </CardContent>
          </Card>

          {description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                  <AlignLeft className="mr-2 h-5 w-5 text-primary" />
                  Опис від продавця
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Ставки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{isAuctionActive ? "Поточна ставка:" : "Фінальна ціна:"}</p>
                <p className="text-4xl font-bold text-primary semibold">{currentBid} грн</p>
              </div>
              
              <CountdownBadge endTime={endTime} />

              {isAuctionActive ? (
                <>
                  <form className="space-y-3" onSubmit={handleBidSubmit}>
                    <Input 
                      type="number" 
                      placeholder={`Ваша ставка (мін. ${currentBid + 10})`} 
                      aria-label="Сума ставки" 
                      className="text-base"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      disabled={isSubmitting || !user}
                    />
                    <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || authLoading || !user}>
                      {isSubmitting ? "Обробка..." : "Зробити ставку"}
                    </Button>
                    {!user && !authLoading && <p className="text-xs text-center text-muted-foreground">Будь ласка, увійдіть, щоб робити ставки.</p>}
                  </form>
                </>
              ) : (
                 <div className="text-center py-4">
                  {winnerNickname ? (
                    <>
                      <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Переможець:</p>
                      <p className="text-xl text-primary font-bold">{winnerNickname}</p>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">Аукціон завершено. Переможця не визначено.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Історія ставок</CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><UserCircle className="inline h-4 w-4 mr-1"/>Учасник</TableHead>
                      <TableHead><Tag className="inline h-4 w-4 mr-1"/>Ставка</TableHead>
                      <TableHead><CalendarDays className="inline h-4 w-4 mr-1"/>Час</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>{bid.user}</TableCell>
                        <TableCell className="font-semibold">{bid.amount} грн</TableCell>
                        <TableCell>{new Date(bid.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Ще ніхто не зробив ставку. Будьте першим!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
