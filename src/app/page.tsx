
import LotCard from '@/components/lots/lot-card';
import { mockLots, type Lot } from '@/lib/mock-data';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react'; // Додано імпорт іконки

export const metadata: Metadata = {
  title: 'Головна - ReefUA',
  description: 'Переглядайте нові та гарячі лоти на аукціоні морської акваріумістики ReefUA.',
};

export default function HomePage() {
  // For "New Auctions", let's take the first 4 lots as an example.
  // In a real application, this would be based on creation date.
  const newLots = mockLots.slice(0, 4);

  // For "Hot Auctions", sort by endTime in ascending order.
  // Filter out auctions that have already ended.
  const activeLots = mockLots.filter(lot => new Date(lot.endTime) > new Date());
  const hotLots = [...activeLots]
    .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
    .slice(0, 8); // Display up to 8 hot lots

  return (
    <div>
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary">Нові Аукціони</h2>
          {newLots.length > 3 && (
            <Button variant="link" asChild>
              <Link href="/auctions?sort=newest">Переглянути всі нові</Link>
            </Button>
          )}
        </div>
        {newLots.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {newLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Наразі немає нових аукціонів.</p>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-headline font-bold text-primary flex items-center">
            <Flame className="mr-2 h-6 w-6 text-accent" /> {/* Додано іконку */}
            Гарячі Аукціони
          </h2>
           {hotLots.length > 3 && (
            <Button variant="link" asChild>
              <Link href="/auctions?sort=ending_soonest">Переглянути всі гарячі</Link>
            </Button>
          )}
        </div>
        {hotLots.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {hotLots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Наразі немає активних аукціонів, що скоро завершаться.</p>
        )}
      </section>
    </div>
  );
}
