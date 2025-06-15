import LotCard from '@/components/lots/lot-card';
import { mockLots } from '@/lib/mock-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Головна - ReefUA',
  description: 'Найновіші лоти на аукціоні морської акваріумістики ReefUA.',
};

export default function HomePage() {
  return (
    <div>
      <h1 className="text-3xl font-headline font-bold mb-8 text-primary">Актуальні Аукціони</h1>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {mockLots.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </div>
    </div>
  );
}
