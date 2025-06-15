'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoSliderProps {
  images: string[];
  altText: string;
  dataAiHints?: string[];
}

const PhotoSlider: React.FC<PhotoSliderProps> = ({ images, altText, dataAiHints }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        Немає зображень
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="relative w-full aspect-[16/10] overflow-hidden rounded-lg shadow-lg group">
      {images.map((src, index) => (
        <div
          key={index}
          className={cn(
            "absolute inset-0 transition-opacity duration-500 ease-in-out",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0"
          )}
        >
          <Image
            src={src}
            alt={`${altText} - зображення ${index + 1}`}
            fill
            priority={index === 0}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
            data-ai-hint={dataAiHints && dataAiHints[index] ? dataAiHints[index] : "coral detail"}
          />
        </div>
      ))}
      
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
            aria-label="Попереднє зображення"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/50 hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="Наступне зображення"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Перейти до зображення ${index + 1}`}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  currentIndex === index ? "bg-primary w-4" : "bg-muted hover:bg-primary/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoSlider;
