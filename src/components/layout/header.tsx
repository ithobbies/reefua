'use client';

import Link from 'next/link';
import SiteLogoIcon from '@/components/icons/site-logo-icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Menu, LogIn, LogOut, User as UserIcon, LayoutDashboard, DollarSign, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const navLinks = [
  { href: '/', label: 'Головна' },
  { href: '/auctions', label: 'Аукціони' },
  { href: '/sell', label: 'Продати' },
];

const Header = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const { user, firestoreUser, loading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Успішний вхід!", description: "Ласкаво просимо!" });
      if (isMobile) setIsSheetOpen(false);
    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            console.error("Помилка входу:", error);
            toast({ variant: "destructive", title: "Помилка входу", description: "Не вдалося увійти. Спробуйте ще раз." });
        }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Ви вийшли з системи." });
      if (isMobile) setIsSheetOpen(false);
    } catch (error) {
       console.error("Помилка виходу:", error);
       toast({ variant: "destructive", title: "Помилка виходу", description: "Не вдалося вийти з системи." });
    }
  };

  const UserMenu = () => ( // This menu assumes firestoreUser is available
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={user?.photoURL || undefined} alt={firestoreUser?.username || 'User'} />
            <AvatarFallback>{firestoreUser?.username?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{firestoreUser?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Панель керування</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Профіль</Link>
        </DropdownMenuItem>
         <DropdownMenuItem asChild>
            <Link href="/balance"><DollarSign className="mr-2 h-4 w-4" />Баланс</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />Вийти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const AuthContent = () => {
    if (loading) {
      return isMobile ? <Loader2 className="h-6 w-6 animate-spin" /> : <Skeleton className="h-10 w-24 rounded-md" />;
    }

    if (user) { // User is authenticated with Firebase Auth
      if (firestoreUser) { // Firestore profile also exists and is loaded
        return isMobile ? (
          // Full mobile logged-in menu
          <div className="flex flex-col gap-2">
             <SheetClose asChild>
                <Link href="/dashboard" className="flex items-center p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Панель керування
                </Link>
            </SheetClose>
            <SheetClose asChild>
                <Link href="/profile" className="flex items-center p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                    <UserIcon className="mr-2 h-5 w-5" /> Профіль
                </Link>
            </SheetClose>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start p-2 text-foreground hover:text-destructive">
              <LogOut className="mr-2 h-5 w-5" /> Вийти
            </Button>
          </div>
        ) : (
          <UserMenu /> // Full desktop user menu
        );
      } else {
        // User authenticated via Firebase Auth, but Firestore profile is missing or still pending
        // Show a simplified state: Avatar + Logout, indicating profile is loading/being set up.
        return isMobile ? (
          <div className="flex flex-col gap-2">
            <div className="p-2 text-sm text-muted-foreground">Профіль завантажується...</div>
             <SheetClose asChild>
                <Link href="/profile" className="flex items-center p-2 rounded-md hover:bg-secondary text-foreground hover:text-primary">
                    <UserIcon className="mr-2 h-5 w-5" /> Профіль (дані оновлюються)
                </Link>
            </SheetClose>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start p-2 text-foreground hover:text-destructive">
              <LogOut className="mr-2 h-5 w-5" /> Вийти
            </Button>
          </div>
        ) : (
          // Simplified desktop menu: Avatar + Logout only
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                  <AvatarFallback>{user?.displayName?.[0].toUpperCase() || user?.email?.[0].toUpperCase() ||'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || "Користувач"}</p>
                  {user?.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                  <p className="text-xs leading-none text-amber-600 dark:text-amber-400">Дані профілю оновлюються...</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Профіль</Link>
               </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />Вийти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }

    // User is not authenticated
    return (
       <Button onClick={handleSignIn} className={isMobile ? "w-full" : ""}>
          <LogIn className="mr-2 h-5 w-5" /> {isMobile ? "Увійти через Google" : "Увійти"}
        </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center text-primary hover:opacity-80 transition-opacity">
          <SiteLogoIcon className="h-12 w-12" />
        </Link>

        {isMobile ? (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"> <Menu /> <span className="sr-only">Відкрити меню</span></Button>
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
              <div className="mt-auto">
                <AuthContent />
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
               {navLinks.map((link) => (
                <Button key={link.href} variant="ghost" asChild className="text-foreground hover:text-primary">
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-2">
              <AuthContent />
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
