
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import LotCard from '@/components/lots/lot-card';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';
import type { Lot } from '@/functions/src/types';

export default function HomePage() {
  const [newLots, setNewLots] = useState<Lot[]>([]);
  const [hotLots, setHotLots] = useState<Lot[]>([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingHot, setLoadingHot] = useState(true);

  useEffect(() => {
    const fetchNewLots = async () => {
      try {
        const lotsCollection = collection(db, 'lots');
        const q = query(
          lotsCollection,
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        const lotSnapshot = await getDocs(q);
        const lotsList = lotSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Lot[];
        setNewLots(lotsList);
      } catch (error) {
        console.error("Error fetching new lots: ", error);
      } finally {
        setLoadingNew(false);
      }
    };

    const fetchHotLots = async () => {
      try {
        const lotsCollection = collection(db, 'lots');
        const q = query(
          lotsCollection,
          where('status', '==', 'active'),
          orderBy('endTime', 'asc'),
          limit(8)
        );
        const lotSnapshot = await getDocs(q);
        const lotsList = lotSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Lot[];
        setHotLots(lotsList);
      } catch (error) {
        console.error("Error fetching hot lots: ", error);
      } finally {
        setLoadingHot(false);
      }
    };

    fetchNewLots();
    fetchHotLots();
  }, []);
  
  const handleLotPurchased = (lotId: string) => {
    setNewLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
    setHotLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
  };


  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-muted p-4 rounded-lg animate-pulse">
          <div className="h-48 bg-muted-foreground/20 rounded-md mb-4"></div>
          <div className="h-6 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-muted-foreground/20 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary">Нові Аукціони</h2>
          <Button variant="link" asChild>
            <Link href="/auctions">Переглянути всі</Link>
          </Button>
        </div>
        {loadingNew ? renderSkeleton() : newLots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {newLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} onLotPurchased={handleLotPurchased} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Наразі немає нових аукціонів.</p>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary flex items-center">
            <Flame className="mr-2 h-6 w-6 text-accent" />
            Гарячі Аукціони
          </h2>
          <Button variant="link" asChild>
            <Link href="/auctions">Переглянути всі</Link>
          </Button>
        </div>
        {loadingHot ? renderSkeleton() : hotLots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} onLotPurchased={handleLotPurchased} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Наразі немає активних аукціонів, що скоро завершаться.</p>
        )}
      </section>
    </div>
  );
}
