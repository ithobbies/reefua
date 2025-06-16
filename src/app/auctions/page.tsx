
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import LotCard from '@/components/lots/lot-card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { type Lot } from '@/lib/mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AuctionsPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = 'Всі Аукціони - ReefUA';

    const fetchLots = async () => {
      setLoading(true);
      try {
        const lotsCollection = collection(db, 'lots');
        const q = query(lotsCollection, where('status', '==', 'active'), orderBy('endTime', 'asc'));
        const lotSnapshot = await getDocs(q);
        const lotsList = lotSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          // Convert Firestore Timestamp to JS Date
          endTime: doc.data().endTime.toDate(),
        })) as Lot[];
        setLots(lotsList);

        const categoriesCollection = collection(db, 'categories');
        const categorySnapshot = await getDocs(categoriesCollection);
        const categoriesList = categorySnapshot.docs.map(doc => doc.data().name);
        setCategories(categoriesList);

      } catch (error) {
        console.error("Error fetching data: ", error);
        // Here you could set an error state and display a message to the user
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  const filteredLots = useMemo(() => {
    return lots.filter(lot => {
      const matchesCategory = selectedCategory === 'all' || lot.category === selectedCategory;
      const matchesSearch = searchTerm === '' || lot.name.toLowerCase().includes(searchTerm.toLowerCase()) || (lot.description && lot.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [lots, selectedCategory, searchTerm]);

  return (
    <div>
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:justify-between md:items-center">
        <h1 className="text-3xl font-headline font-bold text-primary">Всі Аукціони</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto sm:flex-grow md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Пошук за назвою чи описом..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
      
      {loading ? (
        <div className="text-center py-10">Завантаження лотів...</div>
      ) : filteredLots.length > 0 ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {filteredLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          Активних лотів не знайдено. Зазирніть пізніше!
        </p>
      )}
    </div>
  );
}
