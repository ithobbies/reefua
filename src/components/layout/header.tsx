
'use client';

import Link from 'next/link';
import SiteLogoIcon from '@/components/icons/site-logo-icon';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button'; // Added buttonVariants
import { Search, User, ShoppingCart, Menu, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils'; // Added cn

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
          <Link href={link.href} onClick={() => { if (isMobile) setIsSheetOpen(false);}}>{link.label}</Link>
        </Button>
      ))}
    </>
  );

  const userActions = (
    <>
      <Link
        href="/profile"
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-foreground hover:text-primary")}
        aria-label="Профіль"
        onClick={() => { if (isMobile) setIsSheetOpen(false);}}
      >
        <User />
        <span className="sr-only">Профіль</span>
      </Link>
      <Link
        href="/checkout"
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "text-foreground hover:text-primary")}
        aria-label="Кошик"
        onClick={() => { if (isMobile) setIsSheetOpen(false);}}
      >
        <ShoppingCart />
        <span className="sr-only">Кошик</span>
      </Link>
      <Button variant="ghost" size="icon" className="text-foreground hover:text-destructive">
        <LogOut />
        <span className="sr-only">Вийти</span>
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center text-primary hover:opacity-80 transition-opacity">
          <SiteLogoIcon className="h-10 w-10" />
        </Link>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Відкрити меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-background p-6 flex flex-col">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="search" placeholder="Пошук лотів..." className="pl-10" />
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link href={link.href} className="block p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <Separator className="my-4" />
              <div className="flex flex-col gap-2 mt-auto">
                <SheetClose asChild>
                  <Link href="/profile" className="flex items-center p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                    <User className="mr-2 h-5 w-5" /> Профіль
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                   <Link href="/checkout" className="flex items-center p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Кошик
                  </Link>
                </SheetClose>
                 <SheetClose asChild>
                   <Button variant="ghost" className="w-full justify-start p-2 text-foreground hover:text-destructive">
                    <LogOut className="mr-2 h-5 w-5" /> Вийти
                  </Button>
                </SheetClose>
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
            <nav className="hidden md:flex items-center gap-1">
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
