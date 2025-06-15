
'use client'; // Сторінка стає клієнтським компонентом для використання стану

import React, { useState, useMemo } from 'react';
import LotCard from '@/components/lots/lot-card';
import { mockLots, mockCategories, type Lot } from '@/lib/mock-data'; // Імпортуємо mockCategories та Lot
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
// Metadata не може бути експортована з клієнтського компонента, її потрібно перенести до layout або залишити для серверних сторінок.
// Можна додати title через document.title в useEffect, якщо потрібно.

export default function AuctionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  React.useEffect(() => {
    document.title = 'Всі Аукціони - ReefUA';
  }, []);

  const filteredLots = useMemo(() => {
    return mockLots.filter(lot => {
      const matchesCategory = selectedCategory === 'all' || lot.category === selectedCategory;
      const matchesSearch = searchTerm === '' || lot.name.toLowerCase().includes(searchTerm.toLowerCase()) || (lot.description && lot.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

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
              {mockCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLots.length > 0 ? (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {filteredLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          За вашим запитом лотів не знайдено. Спробуйте змінити фільтри або пошуковий запит.
        </p>
      )}
    </div>
  );
}

    