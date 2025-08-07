
'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LotCard from '@/components/lots/lot-card';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, query, where, orderBy, QueryConstraint, doc, getDoc } from 'firebase/firestore';
import { type Lot, type SellerProfile } from '@/functions/src/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SaleTypeFilter = 'all' | 'auction' | 'direct';

function AuctionsPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [lots, setLots] = useState<Lot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [pageTitle, setPageTitle] = useState<string>('Всі активні лоти');

  useEffect(() => {
    document.title = searchQuery ? `Результати пошуку: ${searchQuery}` : 'Всі лоти - ReefUA';
    
    const fetchLots = async () => {
      setLoading(true);
      try {
        let lotsList: Lot[] = [];

        if (searchQuery) {
          setPageTitle(`Результати пошуку для: "${searchQuery}"`);
          const searchLotsFunc = httpsCallable(functions, 'searchLots');
          const result: any = await searchLotsFunc({ query: searchQuery });
          lotsList = result.data as Lot[];
        } else {
          setPageTitle('Всі активні лоти');
          const lotsCollection = collection(db, 'lots');
          const q = query(lotsCollection, where('status', '==', 'active'), orderBy('createdAt', 'desc'));
          const lotSnapshot = await getDocs(q);
          lotsList = lotSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Lot[];
        }
        
        setLots(lotsList);

      } catch (error) {
        console.error("Error fetching lots: ", error);
        toast({
            variant: 'destructive',
            title: 'Помилка завантаження',
            description: 'Не вдалося завантажити лоти. Спробуйте оновити сторінку.'
        })
      } finally {
        setLoading(false);
      }
    };
    
    // This part can run independently as it's for filtering UI
    const fetchCategories = async () => {
        try {
            const categoriesCollection = collection(db, 'categories');
            const categorySnapshot = await getDocs(categoriesCollection);
            const categoriesList = categorySnapshot.docs.map(doc => doc.data().name);
            setCategories(categoriesList);
        } catch (error) {
            console.error("Error fetching categories: ", error);
        }
    };

    fetchLots();
    fetchCategories();
  }, [searchQuery, toast]);
  
  const handleLotPurchased = (lotId: string) => {
    setLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
  };

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const matchesCategory = selectedCategory === 'all' || lot.category === selectedCategory;
      const matchesSaleType = saleTypeFilter === 'all' || lot.type === saleTypeFilter;
      return matchesCategory && matchesSaleType;
    });
  }, [lots, selectedCategory, saleTypeFilter]);
  
  const renderLots = (lotsToRender: Lot[]) => (
     loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Завантаження лотів...</p>
        </div>
      ) : lotsToRender.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {lotsToRender.map((lot) => (
            <LotCard key={lot.id} lot={lot} onLotPurchased={handleLotPurchased} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-20">
          {searchQuery ? `Лотів за запитом "${searchQuery}" не знайдено.` : 'Активних лотів не знайдено. Зазирніть пізніше!'}
        </p>
      )
  );

  return (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-headline font-bold mb-2">{pageTitle}</h1>
            <p className="text-muted-foreground">Знайдіть найкращі пропозиції від перевірених продавців нашої спільноти.</p>
        </div>
        <Tabs defaultValue="all" onValueChange={(value) => setSaleTypeFilter(value as SaleTypeFilter)}>
          <div className="mb-8 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
             <TabsList>
                <TabsTrigger value="all">Всі</TabsTrigger>
                <TabsTrigger value="auction">Аукціон</TabsTrigger>
                <TabsTrigger value="direct">Продаж</TabsTrigger>
            </TabsList>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Select onValueChange={setSelectedCategory} defaultValue="all">
                <SelectTrigger className="w-full sm:w-auto md:min-w-[200px]">
                  <SelectValue placeholder="Фільтрувати за категорією" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
      
          <TabsContent value="all">
            {renderLots(filteredLots)}
          </TabsContent>
          <TabsContent value="auction">
            {renderLots(filteredLots)}
          </TabsContent>
          <TabsContent value="direct">
            {renderLots(filteredLots)}
          </TabsContent>
        </Tabs>
    </div>
  );
}


// Use Suspense to handle the initial render of searchParams
export default function AuctionsPage() {
    return (
        <Suspense fallback={<div>Завантаження...</div>}>
            <AuctionsPageContent />
        </Suspense>
    )
}
