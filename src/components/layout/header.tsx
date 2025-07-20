
'use client';

import Link from 'next/link';
import SiteLogoIcon from '@/components/icons/site-logo-icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Menu, LogOut, User as UserIcon, LayoutDashboard, DollarSign, Loader2, Home, GanttChartSquare, PlusSquare, LogIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import React from 'react';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Головна', icon: Home },
  { href: '/auctions', label: 'Аукціони', icon: GanttChartSquare },
  { href: '/sell', label: 'Продати', icon: PlusSquare },
];

const Header = () => {
  const isMobile = useIsMobile();
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center text-primary hover:opacity-80 transition-opacity">
          <SiteLogoIcon className="h-12 w-12" />
        </Link>
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  );
};

// --- Desktop Navigation Component ---
const DesktopNav = () => {
  const { user, firestoreUser, loading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    toast({ title: "Ви вийшли з системи." });
    router.push('/');
  };
  
  const UserMenu = () => (
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
    if (loading) return <Skeleton className="h-10 w-24 rounded-md" />;
    if (user) return <UserMenu />;
    // This now correctly points to the login page
    return (
        <Button asChild>
            <Link href="/login"><LogIn className="mr-2 h-5 w-5" /> Увійти</Link>
        </Button>
    );
  };

  return (
    <>
      <div className="flex-1 max-w-md ml-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input type="search" placeholder="Пошук лотів, категорій..." className="pl-10 bg-card" />
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Button key={link.href} variant="ghost" asChild className={`text-foreground hover:text-primary ${pathname === link.href ? 'font-bold text-primary' : ''}`}>
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>
      <div className="hidden md:flex items-center gap-2">
        <AuthContent />
      </div>
    </>
  );
};


// --- Mobile Navigation Component ---
const MobileNav = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { user, firestoreUser, loading } = useAuth();
    const { toast } = useToast();
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        setIsOpen(false);
        await signOut(auth);
        toast({ title: "Ви вийшли з системи." });
        router.push('/');
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
            <Button variant="ghost" size="icon"> <Menu /> <span className="sr-only">Відкрити меню</span></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-background p-4 flex flex-col">
            <SheetHeader className="border-b pb-4 mb-4 text-left">
                <SheetTitle>
                    <Link href="/" className="flex items-center text-primary hover:opacity-80 transition-opacity" onClick={() => setIsOpen(false)}>
                        <SiteLogoIcon className="h-10 w-10" />
                        <span className="font-headline text-xl font-semibold ml-2">ReefUA</span>
                    </Link>
                </SheetTitle>
            </SheetHeader>
            
            <nav className="flex flex-col gap-1 flex-1">
            {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                    <Link 
                        key={link.href}
                        href={link.href} 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center p-3 rounded-lg text-base font-medium transition-colors ${pathname === link.href ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}`}
                    >
                    <Icon className="mr-3 h-5 w-5" />
                    {link.label}
                    </Link>
                )
            })}
            </nav>

            <div className="mt-auto pt-4 border-t">
            {loading ? (
                <div className="flex items-center justify-center p-2"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : user && firestoreUser ? (
                <div className="flex flex-col gap-2">
                    <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || undefined} alt={firestoreUser.username} />
                            <AvatarFallback>{firestoreUser.username?.[0].toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                            <span className="font-semibold text-sm">{firestoreUser.username}</span>
                            <span className="text-xs text-muted-foreground">Перейти до профілю</span>
                        </div>
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center p-3 rounded-lg text-sm font-medium text-foreground hover:bg-secondary">
                        <LayoutDashboard className="mr-3 h-5 w-5" /> Панель керування
                    </Link>
                    <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start p-3 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="mr-3 h-5 w-5" /> Вийти
                    </Button>
                </div>
            ) : (
                // This now correctly points to the login page
                <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
                    <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" /> Увійти / Зареєструватися
                    </Link>
                </Button>
            )}
            </div>
        </SheetContent>
        </Sheet>
    );
};

export default Header;
