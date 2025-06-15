'use client';

import Link from 'next/link';
import SiteLogoIcon from '@/components/icons/site-logo-icon'; // Updated import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, User, ShoppingCart, Menu, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';

const navLinks = [
  { href: '/', label: 'Головна' },
  { href: '/auctions', label: 'Аукціони' },
  { href: '/sell', label: 'Продати' },
];

const Header = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const commonNavItems = (
    <>
      {navLinks.map((link) => (
        <Button key={link.href} variant="ghost" asChild className="text-foreground hover:text-primary">
          <Link href={link.href} onClick={() => isMobile && setIsSheetOpen(false)}>{link.label}</Link>
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-foreground hover:text-primary">
            Категорії <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Корали LPS</DropdownMenuItem>
          <DropdownMenuItem>Корали SPS</DropdownMenuItem>
          <DropdownMenuItem>Мʼякі корали</DropdownMenuItem>
          <DropdownMenuItem>Риби</DropdownMenuItem>
          <DropdownMenuItem>Безхребетні</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const userActions = (
    <>
      <Button variant="ghost" size="icon" asChild className="text-foreground hover:text-primary">
        <Link href="/profile" onClick={() => isMobile && setIsSheetOpen(false)}>
          <User />
          <span className="sr-only">Профіль</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" asChild className="text-foreground hover:text-primary">
        <Link href="/checkout" onClick={() => isMobile && setIsSheetOpen(false)}>
          <ShoppingCart />
          <span className="sr-only">Кошик</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="text-foreground hover:text-destructive">
        <LogOut />
        <span className="sr-only">Вийти</span>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <SiteLogoIcon className="h-8 w-8" /> {/* Updated icon */}
          <span className="font-headline text-xl font-semibold">ReefUA</span>
        </Link>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Відкрити меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-background p-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="search" placeholder="Пошук лотів..." className="pl-10" />
                </div>
                <nav className="flex flex-col gap-2">
                  {commonNavItems}
                </nav>
                <DropdownMenuSeparator />
                <div className="flex flex-col gap-2">
                  {userActions}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <>
            <div className="flex-1 max-w-md ml-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="search" placeholder="Пошук лотів, категорій..." className="pl-10 bg-card" />
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {commonNavItems}
            </nav>
            <div className="hidden md:flex items-center gap-1">
              {userActions}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
