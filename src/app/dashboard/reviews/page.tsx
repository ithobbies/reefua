
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, TrendingUp, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Review } from '@/functions/src/types';
import { Loader2 } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card'; // Corrected import

const RatingStars = ({ rating, className = '' }: { rating: number, className?: string }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${className} ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted stroke-muted-foreground'}`} />
    ))}
  </div>
);


export default function DashboardReviewsPage() {
  const { user, firestoreUser, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    document.title = 'Відгуки - Панель Продавця';
    if (!user) {
      setLoadingReviews(false);
      return;
    }

    setLoadingReviews(true);
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('sellerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => doc.data() as Review);
      setReviews(fetchedReviews);
      setLoadingReviews(false);
    }, (error) => {
      console.error("Error fetching reviews: ", error);
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [user]);

  const averageRating = firestoreUser?.sellerRating ? firestoreUser.sellerRating.toFixed(1) : 'N/A';
  const totalReviews = firestoreUser?.sellerReviewCount || 0;

  if (authLoading || loadingReviews) {
     return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headline font-semibold text-primary">Відгуки Покупців</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
         <StatsCard 
            title="Середній рейтинг"
            value={averageRating}
            icon={<Star className="h-5 w-5 text-muted-foreground"/>}
            description="На основі всіх отриманих відгуків"
         />
         <StatsCard 
            title="Всього відгуків"
            value={totalReviews.toString()}
            icon={<MessageSquare className="h-5 w-5 text-muted-foreground"/>}
            description="Загальна кількість оцінок від покупців"
         />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Отримані відгуки</CardTitle>
          <CardDescription>Що говорять покупці про ваші лоти.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    {/* Placeholder for buyer's avatar if available in the future */}
                    <AvatarFallback>{review.buyerUsername.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{review.buyerUsername}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <div className="my-1">
                      <RatingStars rating={review.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Лот: <span className="font-medium text-primary">{review.lotName}</span></p>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
             <p className="text-muted-foreground text-center py-10">У вас ще немає відгуків.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
