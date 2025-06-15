'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TimerIcon } from 'lucide-react';

interface CountdownBadgeProps {
  endTime: Date;
}

const CountdownBadge: React.FC<CountdownBadgeProps> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isEndingSoon, setIsEndingSoon] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      let newTimeLeft = '';
      let endingSoon = false;
      let critical = false;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        if (days > 0) {
          newTimeLeft = `${days}д ${hours}г ${minutes}хв`;
        } else if (hours > 0) {
          newTimeLeft = `${hours}г ${minutes}хв ${seconds}с`;
        } else if (minutes > 0) {
          newTimeLeft = `${minutes}хв ${seconds}с`;
          endingSoon = true;
        } else {
          newTimeLeft = `${seconds}с`;
          endingSoon = true;
          critical = true;
        }
      } else {
        newTimeLeft = 'Аукціон завершено';
      }
      setTimeLeft(newTimeLeft);
      setIsEndingSoon(endingSoon);
      setIsCritical(critical);
    };

    calculateTimeLeft(); // Initial call
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let animationClass = "";

  if (timeLeft === 'Аукціон завершено') {
    badgeVariant = "destructive";
  } else if (isCritical) {
    badgeVariant = "destructive";
    animationClass = "animate-pulse-lighter";
  } else if (isEndingSoon) {
    badgeVariant = "default"; // Default is primary color based on theme, which is blue. Use accent instead for warning.
                               // We can use default shadcn variants. For CoralOrange as accent, this needs a custom class or explicit style.
                               // Let's use default for now for visual effect.
                               // If accent is desired: style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
    animationClass = "animate-pulse"; // Tailwind's default pulse
  }


  return (
    <Badge variant={badgeVariant} className={`w-full justify-center py-2 text-sm ${animationClass}`}>
      <TimerIcon className="mr-2 h-4 w-4" />
      {timeLeft}
    </Badge>
  );
};

export default CountdownBadge;
