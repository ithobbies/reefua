
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GanttChartSquare, PlusSquare, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navItems = [
  { href: '/', label: 'Головна', icon: Home },
  { href: '/auctions', label: 'Аукціони', icon: GanttChartSquare },
  { href: '/sell', label: 'Продати', icon: PlusSquare },
  { href: '/profile', label: 'Профіль', icon: User },
];

export const BottomNavigation = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't render on dashboard pages
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 shadow-t-md z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // For the profile, we need to check if the user is logged in
          if (item.href === '/profile' && !user) {
            return null; // Don't show profile icon if not logged in
          }
          
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              href={item.href} 
              key={item.label} 
              className={`flex flex-col items-center justify-center w-full h-full text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
