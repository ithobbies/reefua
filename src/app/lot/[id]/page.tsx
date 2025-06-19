
'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
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
import { Loader2, Zap, Droplets, Wind, ShieldAlert, UserCircle, CalendarDays, Tag, Trophy, AlignLeft, Info } from 'lucide-react';

import type { Lot, Bid as BidType } from '@/functions/src/types'; 
import { useToast } from '@/hooks/use-toast';

export default function LotDetailPage() {
  const params = useParams();
  const lotId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [lot, setLot] = useState<Lot | null>(null);
  const [bids, setBids] = useState<BidType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!lotId) return;
    const lotRef = doc(db, 'lots', lotId);
    const unsubscribeLot = onSnapshot(lotRef, (docSnap) => {
      if (docSnap.exists()) {
        const lotData = { ...docSnap.data(), id: docSnap.id } as Lot;
        setLot(lotData);
        document.title = `${lotData.name} - ReefUA`;
      } else {
        setLot(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching lot:", err);
      setError("Не вдалося завантажити лот.");
      setLoading(false);
    });

    const bidsRef = collection(db, 'lots', lotId, 'bids');
    const q = query(bidsRef, orderBy('timestamp', 'desc'));
    const unsubscribeBids = onSnapshot(q, (snapshot) => {
      setBids(snapshot.docs.map(doc => doc.data() as BidType));
    });

    return () => {
      unsubscribeLot();
      unsubscribeBids();
    };
  }, [lotId]);
  
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти, щоб робити ставки." });
      return;
    }
    if (!lot) return;

    const amount = parseInt(bidAmount, 10);
    const minBid = (lot.currentBid || 0) + 10;
    if (isNaN(amount) || amount < minBid) {
      toast({ variant: "destructive", title: "Помилка", description: `Ставка має бути не менше ${minBid} грн.` });
      return;
    }

    setIsSubmitting(true);
    try {
        const placeBidFunc = httpsCallable(functions, 'placeBid');
        await placeBidFunc({ lotId: lot.id, amount });
        toast({ title: "Успіх!", description: "Вашу ставку прийнято." });
        setBidAmount('');
    } catch (error: any) {
        console.error("Error placing bid:", error);
        toast({ variant: "destructive", title: "Помилка ставки", description: error.message || "Не вдалося зробити ставку." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти, щоб купити лот." });
        return;
    }
    if (!lot) return;

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
        
        toast({ title: "Успіх!", description: "Ви успішно придбали цей лот. Перенаправляємо вас до профілю." });
        
        router.push('/profile');

    } catch (error: any) {
        console.error("Error buying now:", error);
        toast({ variant: "destructive", title: "Помилка покупки", description: error.message || "Не вдалося придбати лот." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (loading || authLoading) {
    return <div className="container mx-auto py-8 text-center"><Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" /></div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }
  if (!lot) {
     return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Лот не знайдено</h1>
            <p className="text-muted-foreground">Можливо, він був проданий або видалений.</p>
            <Button asChild className="mt-4"><Link href="/auctions">Повернутись до аукціонів</Link></Button>
        </div>
    );
  }

  const isAuctionActive = lot.status === 'active' && new Date(lot.endTime) > new Date();
  const hasParameters = lot.parameters && Object.values(lot.parameters).some(p => p);
  
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <PhotoSlider images={lot.images || []} altText={lot.name} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{lot.name}</CardTitle>
              <CardDescription>Продавець: <span className="text-primary font-medium">{lot.sellerUsername}</span></CardDescription>
            </CardHeader>
            {hasParameters && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold mb-2 font-headline">Параметри утримання:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {lot.parameters?.salinity && <ParameterItem icon={<Droplets className="h-5 w-5" />} label="Солоність" value={lot.parameters.salinity}/>}
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
                <CardTitle className="text-xl font-headline flex items-center">
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
                <CardTitle className="text-2xl font-headline">Ставки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{isAuctionActive ? "Поточна ставка" : "Фінальна ціна"}:</p>
                <p className="text-4xl font-bold text-primary">{lot.status === 'sold' && lot.finalPrice ? lot.finalPrice : lot.currentBid} грн</p>
              </div>

              <CountdownBadge endTime={new Date(lot.endTime)} />

              {isAuctionActive ? (
                <>
                  <form className="space-y-3" onSubmit={handleBidSubmit}>
                    <Input type="number" placeholder={`мін. ${lot.currentBid + 10} грн`} aria-label="Сума ставки" className="text-base" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} disabled={isSubmitting || !user || user.uid === lot.sellerUid} />
                    <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || authLoading || !user || user.uid === lot.sellerUid}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Зробити ставку"}
                    </Button>
                     {user?.uid === lot.sellerUid && <p className="text-xs text-center text-red-500">Ви не можете робити ставки на свій лот.</p>}
                  </form>
                  
                  {lot.buyNowPrice && (
                    <>
                      <div className="relative my-2"><div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">або</span></div></div>
                      <Button type="button" variant="outline" className="w-full text-lg py-3 border-accent text-accent hover:bg-accent/10 hover:text-accent" onClick={handleBuyNow} disabled={isSubmitting || !user || user.uid === lot.sellerUid}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <><Tag className="mr-2 h-5 w-5" /> Купити зараз за {lot.buyNowPrice} грн</>}
                      </Button>
                    </>
                  )}

                  <div className="text-xs text-muted-foreground pt-2">
                    <Info className="inline h-3 w-3 mr-1" />
                    Ви можете встановити максимальну ставку, система автоматично підніматиме її за вас.
                  </div>
                </>
              ) : (
                 <div className="text-center py-4">
                  {lot.winnerUid ? (
                    <><Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" /><p className="text-lg font-semibold">Переможець:</p><p className="text-xl text-primary font-bold">{lot.winnerUid}</p></>
                  ) : (
                    <p className="text-lg text-muted-foreground">Аукціон завершено. Переможця не визначено.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl font-headline">Історія ставок</CardTitle></CardHeader>
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
        </div>
      </div>
    </div>
  );
}
