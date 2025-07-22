
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, app } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import PhotoSlider from '@/components/lots/photo-slider';
import ParameterItem from '@/components/lots/parameter-item';
import CountdownBadge from '@/components/ui/countdown-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Droplets, Wind, ShieldAlert, UserCircle, CalendarDays, Tag, Trophy, AlignLeft, Info, MessageCircle } from 'lucide-react';
import { RatingStars } from '@/components/ui/rating-stars';
import type { Lot, Bid as BidType, User } from '@/functions/src/types'; 
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable as httpsCallableApp } from 'firebase/functions';
import { difficultyOptions, getLabelByValue } from '@/lib/options';

const getMinBidStep = (currentPrice: number): number => {
    if (currentPrice < 500) return 20;
    if (currentPrice < 2000) return 50;
    if (currentPrice < 5000) return 100;
    return 250;
};

export default function LotDetailPage() {
  const params = useParams();
  const lotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [lot, setLot] = useState<Lot | null>(null);
  const [sellerProfile, setSellerProfile] = useState<User | null>(null);
  const [bids, setBids] = useState<BidType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { startChatFromLot, isStarting: isChatStarting } = useChat();

  useEffect(() => {
    if (!lotId) return;

    const lotRef = doc(db, 'lots', lotId);
    const unsubscribeLot = onSnapshot(lotRef, (lotSnap) => {
      if (lotSnap.exists()) {
        const lotData = { ...lotSnap.data(), id: lotSnap.id } as Lot;
        setLot(lotData);
        document.title = `${lotData.name} - ReefUA`;
        
        const sellerRef = doc(db, 'users', lotData.sellerUid);
        getDoc(sellerRef).then(sellerSnap => {
          if (sellerSnap.exists()) {
            setSellerProfile(sellerSnap.data() as User);
          }
        });

      } else {
        setError("Лот не знайдено.");
        setLot(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching lot:", err);
      setError("Не вдалося завантажити лот.");
      setLoading(false);
    });

    if (lot?.type === 'auction') {
        const bidsRef = collection(db, 'lots', lotId, 'bids');
        const q = query(bidsRef, orderBy('timestamp', 'desc'));
        const unsubscribeBids = onSnapshot(q, (snapshot) => {
          setBids(snapshot.docs.map(doc => doc.data() as BidType));
        });
        return () => {
          unsubscribeLot();
          unsubscribeBids();
        };
    }
    
    return () => unsubscribeLot();
  }, [lotId, lot?.type]);
  
  const handleStartChat = () => {
    if (!lot) return;
    startChatFromLot({
      lotId: lot.id,
      lotName: lot.name,
      lotImage: lot.images[0],
      sellerUid: lot.sellerUid,
      sellerName: lot.sellerUsername,
    });
  };
  
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти, щоб робити ставки." });
      return;
    }
    if (!lot) return;

    const amount = parseInt(bidAmount, 10);
    const minStep = getMinBidStep(lot.currentBid);
    const minimumNextBid = lot.currentBid + minStep;
    
    if (isNaN(amount) || amount < minimumNextBid) {
      toast({ variant: "destructive", title: "Замала ставка", description: `Ваша ставка має бути не менше ${minimumNextBid.toFixed(2)} грн.` });
      return;
    }

    setIsSubmitting(true);
    try {
        const placeBidFunction = httpsCallable(functions, 'placeBid');
        await placeBidFunction({ lotId, amount });
        
        toast({ title: "Успіх!", description: "Вашу ставку успішно прийнято." });
        setBidAmount('');
    } catch (error: any) {
        console.error("Error placing bid:", error);
        const errorMessage = error.message || "Сталася невідома помилка.";
        toast({ variant: "destructive", title: "Помилка ставки", description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user || !lot) return;
    setIsSubmitting(true);

    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`https://us-central1-reefua.cloudfunctions.net/buyNow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ data: { lotId: lot.id } })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to buy the lot.');
        }
        
        toast({ title: "Успіх!", description: "Ви успішно придбали цей лот." });
        
    } catch (error: any) {
        console.error("Error buying now from card:", error);
        toast({ variant: "destructive", title: "Помилка покупки", description: error.message || "Не вдалося придбати лот." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading || authLoading) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" /></div>;
  }
  
  if (error) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-destructive">{error}</h1>
            <p className="text-muted-foreground">Можливо, він був проданий або видалений.</p>
            <Button asChild className="mt-4"><Link href="/auctions">Повернутись до аукціонів</Link></Button>
        </div>
    );
  }

  if (!lot) {
    notFound();
  }
  
  const isAuction = lot.type === 'auction';
  const isDirectSale = lot.type === 'direct';
  const isAuctionActive = isAuction && lot.status === 'active' && new Date(lot.endTime) > new Date();
  const hasParameters = lot.parameters && Object.values(lot.parameters).some(p => p);
  const minBid = isAuction ? (lot.currentBid > 0 ? lot.currentBid + getMinBidStep(lot.currentBid) : lot.startingBid) : 0;
  const isOwner = user?.uid === lot.sellerUid;
  const canBuyNow = (isDirectSale && lot.price) || (isAuction && lot.buyNowPrice);
  
  const renderPriceDisplay = () => {
      if (isDirectSale) {
        return (
            <div>
                 <p className="text-sm text-muted-foreground">Ціна</p>
                 <p className="text-4xl font-bold text-primary">{lot.price} грн</p>
            </div>
        );
      }
      return (
        <div>
            <p className="text-sm text-muted-foreground">{isAuctionActive ? "Поточна ставка" : "Фінальна ціна"}:</p>
            <p className="text-4xl font-bold text-primary">{lot.status === 'sold' && lot.finalPrice ? lot.finalPrice : lot.currentBid} грн</p>
        </div>
      );
  }

  return (
    <div className="container mx-auto py-8 pb-24 md:pb-8"> {/* Added bottom padding for mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <PhotoSlider images={lot.images || []} altText={lot.name} />
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-headline">{lot.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <CardDescription>Продавець: <Link href={`/profile/${lot.sellerUid}`} className="text-primary font-semibold hover:underline">{lot.sellerUsername}</Link></CardDescription>
                      {sellerProfile && (
                          <div className="flex items-center gap-1">
                              <RatingStars rating={sellerProfile.sellerRating || 0} />
                              <span className="text-sm font-bold">{sellerProfile.sellerRating?.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({sellerProfile.sellerReviewCount || 0})</span>
                          </div>
                      )}
                    </div>
                  </div>
                  {user && !isOwner && (
                      <Button variant="outline" onClick={handleStartChat} disabled={isChatStarting} className="hidden md:flex"> {/* Hide on mobile */}
                          {isChatStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4"/>}
                          Повідомлення
                      </Button>
                  )}
              </div>
            </CardHeader>
            {hasParameters && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold mb-2 font-headline">Параметри утримання:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {lot.parameters?.difficulty && <ParameterItem icon={<ShieldAlert className="h-5 w-5" />} label="Складність" value={getLabelByValue(difficultyOptions, lot.parameters.difficulty)} />}
                {lot.parameters?.par && <ParameterItem icon={<Zap className="h-5 w-5" />} label="PAR" value={lot.parameters.par} />}
                {lot.parameters?.flow && <ParameterItem icon={<Wind className="h-5 w-5" />} label="Течія" value={lot.parameters.flow} />}
              </div>
              <Badge variant="destructive" className="mt-6 p-3 text-sm w-full justify-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                Без гарантії живого товару при доставці поштою.
              </Badge>
            </CardContent>
            )}
          </Card>

          {lot.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font.headline flex items-center">
                  <AlignLeft className="mr-2 h-5 w-5" />
                  Опис від продавця
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{lot.description}</p>
              </CardContent>
            </Card>
          )}

        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="text-2xl font.headline">{isAuction ? "Ставки" : "Продаж"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {renderPriceDisplay()}

              {!isDirectSale && <CountdownBadge endTime={new Date(lot.endTime)} />}

              {isAuctionActive && (
                 <>
                  <form className="space-y-3" onSubmit={handleBidSubmit}>
                    <Input 
                      type="number" 
                      placeholder={`мін. ${minBid.toFixed(2)} грн`} 
                      aria-label="Сума ставки" 
                      className="text-base" 
                      value={bidAmount} 
                      onChange={(e) => setBidAmount(e.target.value)} 
                      disabled={isSubmitting || !user || isOwner} 
                    />
                    <Button 
                      type="submit" 
                      className="w-full text-lg py-3" 
                      disabled={isSubmitting || authLoading || !user || isOwner}
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Зробити ставку"}
                    </Button>
                     {isOwner && <p className="text-xs text-center text-red-500">Ви не можете робити ставки на свій лот.</p>}
                  </form>
                 </>
              )}
              
              {canBuyNow && lot.status === 'active' && (
                <>
                  {isAuction && <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">або</span></div></div>}
                  <Button 
                    type="button" 
                    variant={isDirectSale ? 'default' : 'outline'} 
                    className="w-full text-lg py-3" 
                    onClick={handleBuyNow} 
                    disabled={isSubmitting || !user || isOwner}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <><Tag className="mr-2 h-5 w-5" /> {isDirectSale ? `Купити за ${lot.price} грн` : `Купити зараз за ${lot.buyNowPrice} грн`}</>}
                  </Button>
                </>
              )}
              
              {!isAuctionActive && !isDirectSale && (
                 <div className="text-center py-4">
                  {lot.winnerUid && lot.winnerUsername ? (
                    <>
                      <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                      <p className="text-lg font-semibold">Переможець:</p>
                      <p className="text-xl text-primary font-bold">
                        <Link href={`/profile/${lot.winnerUid}`} className="hover:underline">
                            {lot.winnerUsername}
                        </Link>
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-muted-foreground">Аукціон завершено. Переможця не визначено.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {isAuction && (
             <Card>
                <CardHeader><CardTitle className="text-xl font.headline">Історія ставок</CardTitle></CardHeader>
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
                          <TableRow key={bid.bidId}>
                            <TableCell>{bid.username}</TableCell>
                            <TableCell className="font-semibold">{bid.amount} грн</TableCell>
                            <TableCell>{new Date(bid.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Ще ніхто не зробив ставку. Будьте першим!</p>
                  )}
                </CardContent>
              </Card>
          )}

        </div>
      </div>
      
      {/* Mobile-only Bottom Action Bar */}
      {user && !isOwner && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm p-4 border-t z-40">
           <Button variant="default" className="w-full" onClick={handleStartChat} disabled={isChatStarting}>
                {isChatStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MessageCircle className="mr-2 h-4 w-4"/>}
                Повідомлення
            </Button>
        </div>
      )}
    </div>
  );
}
