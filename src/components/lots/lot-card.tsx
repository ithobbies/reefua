'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Lot } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import CountdownBadge from '@/components/ui/countdown-badge';

interface LotCardProps {
  lot: Lot;
}

const LotCard: React.FC<LotCardProps> = ({ lot }) => {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out hover:scale-[1.03] transform rounded-[12px] break-inside-avoid">
      <Link href={`/lot/${lot.id}`} aria-label={`Переглянути деталі лоту ${lot.name}`}>
        <CardHeader className="p-0">
          <div className="aspect-[4/3] relative w-full">
            <Image
              src={lot.imageUrl}
              alt={lot.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={lot.dataAiHint || "coral"}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg font-headline mb-2 truncate" title={lot.name}>{lot.name}</CardTitle>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">Поточна ставка:</p>
            <p className="text-xl font-semibold text-primary">{lot.currentBid} грн</p>
          </div>
          <CountdownBadge endTime={lot.endTime} />
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        {lot.buyNowPrice && (
          <Button variant="default" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <Tag className="mr-2 h-4 w-4" /> Купити зараз за {lot.buyNowPrice} грн
          </Button>
        )}
        {!lot.buyNowPrice && (
           <Button variant="outline" className="w-full" asChild>
            <Link href={`/lot/${lot.id}`}>Зробити ставку</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default LotCard;
