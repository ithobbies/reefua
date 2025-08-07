
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Lot } from '@/functions/src/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useSellerProfile } from '@/hooks/use-seller-profile';
import { productCategories } from '@/lib/categories-data';
import { categoryColors } from '@/lib/category-colors';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, Loader2 } from 'lucide-react';
import CountdownBadge from '@/components/ui/countdown-badge';
import { RatingStars } from '@/components/ui/rating-stars';
import { Skeleton } from '@/components/ui/skeleton';

interface LotCardProps {
  lot: Lot;
  onLotPurchased?: (lotId: string) => void;
}

const CategoryBadge = ({ slug, name }: { slug?: string; name?: string }) => {
  if (!slug || !name) return null;
  const colorClass = categoryColors[slug] || 'bg-secondary text-secondary-foreground';
  
  // By removing the variant prop, we prevent default variant styles from overriding our custom colors.
  // We add 'border-transparent' to be consistent with other badge variants that hide the default border.
  return (
    <Badge className={`border-transparent ${colorClass}`}>
      {name}
    </Badge>
  );
};

// SellerInfo sub-component to keep the main component clean
const SellerInfo: React.FC<{ lot: Lot }> = ({ lot }) => {
    const { sellerProfile, loading } = useSellerProfile(lot.sellerUid);

    if (loading) {
        return <Skeleton className="h-4 w-3/4 mt-2" />;
    }

    if (!sellerProfile) {
        return null; // Or some fallback UI
    }

    return (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>Продавець:</span>
            <span className="text-primary font-semibold">
                {lot.sellerUsername}
            </span>
            <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground">{sellerProfile.sellerRating?.toFixed(1)}</span>
                <RatingStars rating={sellerProfile.sellerRating || 0} starSize={12} />
                <span>({sellerProfile.sellerReviewCount || 0})</span>
            </div>
        </div>
    )
}

const LotCard: React.FC<LotCardProps> = ({ lot, onLotPurchased }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBuying, setIsBuying] = React.useState(false);

  const imageUrl = lot.images && lot.images.length > 0 ? lot.images[0] : '/placeholder.png';
  const isDirectSale = lot.type === 'direct';

  // Robust category and subcategory lookup
  const category = productCategories.find(cat => cat.slug === lot.category || cat.name === lot.category);
  const subcategory = category?.subcategories.find(sub => sub.slug === lot.subcategory || sub.name === lot.subcategory);

  const handleBuyNow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast({ variant: "destructive", title: "Помилка", description: "Ви повинні увійти, щоб купити лот." });
        return;
    }
    if(user.uid === lot.sellerUid) {
        toast({ variant: "destructive", title: "Помилка", description: "Ви не можете купити свій власний лот." });
        return;
    }

    setIsBuying(true);
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

        toast({ title: "Успіх!", description: "Ви успішно придбали цей лот." });

        if (onLotPurchased) {
            onLotPurchased(lot.id);
        }

    } catch (error: any) {
        console.error("Error buying now from card:", error);
        toast({ variant: "destructive", title: "Помилка покупки", description: error.message || "Не вдалося придбати лот." });
    } finally {
        setIsBuying(false);
    }
  };

  const renderPriceInfo = () => {
    if (isDirectSale) {
        return {
            label: "Ціна:",
            value: `${lot.price} грн`,
        };
    }
    // Default to auction
    return {
        label: "Поточна ставка:",
        value: `${lot.currentBid} грн`,
    };
  };

  const {label, value} = renderPriceInfo();

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out hover:scale-[1.03] transform rounded-[12px] break-inside-avoid flex flex-col">
      <Link href={`/lot/${lot.id}`} aria-label={`Переглянути деталі лоту ${lot.name}`} className="flex flex-col flex-grow">
        <CardHeader className="p-0">
          <div className="aspect-[4/3] relative w-full bg-muted">
            <Image
              src={imageUrl}
              alt={lot.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font.headline mb-2 truncate" title={lot.name}>{lot.name}</CardTitle>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <CategoryBadge slug={category?.slug} name={category?.name} />
            {subcategory && <CategoryBadge slug={subcategory?.slug} name={subcategory?.name} />}
          </div>

          <SellerInfo lot={lot} />

          <div className="flex justify-between items-center mt-3 mb-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold text-primary">{value}</p>
          </div>
          {!isDirectSale && <CountdownBadge endTime={new Date(lot.endTime)} />}
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        {isDirectSale ? (
             <Button
                variant="default"
                className="w-full"
                onClick={handleBuyNow}
                disabled={isBuying || !user || user.uid === lot.sellerUid}
              >
                {isBuying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                {isBuying ? 'Покупка...' : `Купити за ${lot.price} грн`}
            </Button>
        ) : lot.buyNowPrice ? (
          <Button
            variant="default"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={handleBuyNow}
            disabled={isBuying || !user || user.uid === lot.sellerUid}
          >
            {isBuying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
            {isBuying ? 'Покупка...' : `Купити зараз за ${lot.buyNowPrice} грн`}
          </Button>
        ) : (
           <Button variant="outline" className="w-full" asChild>
            <Link href={`/lot/${lot.id}`}>Зробити ставку</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default LotCard;
