
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { functions, db } from '@/lib/firebase';
import type { User, Review, Lot } from '@functions/types';
import { httpsCallable } from 'firebase/functions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Store } from 'lucide-react'; // Додано Store
import { Loader2 } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card';
import LotCard from '@/components/lots/lot-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge'; // Додано Badge

const RatingStars = ({ rating, className = '' }: { rating: number, className?: string }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`h-5 w-5 ${className} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`} />
    ))}
  </div>
);

export default function PublicProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [seller, setSeller] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerLots, setSellerLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingLots, setIsLoadingLots] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
        setError("User ID not provided.");
        setLoading(false);
        return;
    };

    const fetchSellerData = async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setSeller(userData);
          document.title = `Профіль ${userData.username} - ReefUA`;
        } else {
          setError("Продавця не знайдено.");
        }
      } catch (err) {
        setError("Помилка завантаження даних продавця.");
        console.error(err);
      }
    };

    const fetchSellerLots = async () => {
      if (!params.id) return;
      setIsLoadingLots(true);
      try {
        const getLotsBySeller = httpsCallable(functions, "getLotsBySeller");
        const result = await getLotsBySeller({ userId: params.id });
        console.log("[DEBUG] Raw data from getLotsBySeller:", result.data);
        setSellerLots(result.data as Lot[]);
      } catch (error) {
        console.error("Error fetching seller lots:", error);
      } finally {
        setIsLoadingLots(false);
      }
    };

    const unsubscribeReviews = onSnapshot(
        query(collection(db, 'reviews'), where('sellerUid', '==', userId), orderBy('createdAt', 'desc')),
        (snapshot) => {
            setReviews(snapshot.docs.map(doc => doc.data() as Review));
        },
        (err) => {
            setError("Помилка завантаження відгуків.");
            console.error(err);
        }
    );
    
    Promise.all([fetchSellerData(), fetchSellerLots()]).finally(() => setLoading(false));

    return () => unsubscribeReviews();
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (error) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold text-destructive">{error}</h1></div>;
  }

  if (!seller) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Профіль не знайдено.</h1></div>;
  }
  
  const averageRating = seller.sellerRating ? seller.sellerRating.toFixed(1) : '0';
  const totalReviews = seller.sellerReviewCount || 0;
  const registrationDate = new Date(seller.createdAt).toLocaleDateString('uk-UA');
  const fallbackInitial = seller.username ? seller.username[0].toUpperCase() : 'S';

  console.log("[DEBUG] State before render:", {
    isLoadingLots,
    sellerLots,
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary shadow-lg">
          <AvatarImage src={seller.photoURL || undefined} alt={seller.username || 'User Avatar'} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left mt-4 md:mt-0">
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <h1 className="text-3xl font-headline font-bold text-primary">{seller.username}</h1>
            {seller.roles?.includes('shop') && (
              <Badge variant="outline" className="text-base border-green-600 text-green-700 bg-green-50">
                  <Store className="h-4 w-4 mr-2" />
                  Магазин
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Учасник з: {registrationDate}</p>
          <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
             <RatingStars rating={seller.sellerRating || 0} />
             <span className="font-bold text-lg">{averageRating}</span>
             <span className="text-muted-foreground">({totalReviews} відгуків)</span>
          </div>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Лоти продавця</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLots ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-96 w-full" />
                    ))}
                  </div>
                ) : sellerLots.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellerLots.map((lot) => (
                      <LotCard key={lot.id} lot={lot} />
                    ))}
                  </div>
                ) : (
                  <p>Продавець ще не виставив жодного лота.</p>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Відгуки Покупців</CardTitle>
              <CardDescription>Що говорять покупці про цього продавця.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <Card key={review.id} className="p-4 bg-secondary/50">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{review.buyerUsername.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{review.buyerUsername}</h4>
                          <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('uk-UA')}</span>
                        </div>
                        <div className="my-1"><RatingStars rating={review.rating} /></div>
                        <p className="text-sm text-muted-foreground mb-1">Лот: <span className="font-medium text-primary">{review.lotName}</span></p>
                        <p className="text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-10">У цього продавця ще немає відгуків.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
