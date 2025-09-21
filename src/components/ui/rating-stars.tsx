
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
  starSize?: number;
}

export const RatingStars = ({ rating, className, starClassName, starSize = 16 }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            'stroke-1',
            i < fullStars
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted stroke-muted-foreground',
            starClassName
          )}
          style={{ width: starSize, height: starSize }}
        />
      ))}
    </div>
  );
};
