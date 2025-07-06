
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
}

export const RatingStars = ({ rating, className, starClassName }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0; // Check if there's a fractional part

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4 stroke-1',
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted stroke-muted-foreground',
            starClassName
          )}
        />
      ))}
    </div>
  );
};
