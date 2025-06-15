'use client';

import Link from 'next/link';
import { Home, Gavel, PlusSquare, User, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming this hook correctly determines mobile view (e.g., width <= 640px)

const BottomNavigation = () => {
  const isMobile = useIsMobile(); // The prompt mentions logic for <= 640px, useIsMobile should reflect this or similar.

  if (!isMobile) {
    return null;
  }

  const navItems = [
    { href: '/', icon: <Home className="h-6 w-6" />, label: 'Головна' },
    { href: '/auctions', icon: <Gavel className="h-6 w-6" />, label: 'Аукціони' },
    { href: '/sell', icon: <PlusSquare className="h-6 w-6" />, label: 'Продати' },
    { href: '/checkout', icon: <ShoppingCart className="h-6 w-6" />, label: 'Кошик' },
    { href: '/profile', icon: <User className="h-6 w-6" />, label: 'Профіль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/90 backdrop-blur-md shadow-t-lg md:hidden">
      <div className="container mx-auto flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
