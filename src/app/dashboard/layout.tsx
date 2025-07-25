
'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, ListChecks, Star, MessageSquare, ShoppingCart, ShieldCheck, Home } from 'lucide-react'; 
import React from 'react';
import { useAuth } from '@/context/auth-context';
import { BottomNavigation } from '@/components/layout/bottom-navigation';

// We create a sub-component to be able to use the useSidebar hook
// because it must be used within a SidebarProvider.
const DashboardLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { firestoreUser } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar(); 
  const roles = firestoreUser?.roles || [];

  // This function will be called on link click
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); 
    }
  };

  const menuItems = [
    { href: '/dashboard', label: 'Оглядова панель', icon: <LayoutDashboard /> },
    { href: '/dashboard/lots', label: 'Мої лоти', icon: <ListChecks /> },
    { href: '/dashboard/sales', label: 'Мої продажі', icon: <ShoppingCart /> },
    { href: '/dashboard/messages', label: 'Повідомлення', icon: <MessageSquare /> },
    { href: '/dashboard/reviews', label: 'Відгуки', icon: <Star /> },
  ];

  const adminMenuItem = { 
    href: '/admin/dashboard', 
    label: 'Адмін-панель', 
    icon: <ShieldCheck className="text-red-600" />,
    className: 'text-red-600 hover:text-red-700 font-semibold'
  };

  return (
    <>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="items-center border-b border-sidebar-border h-16 justify-end">
          <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground" />
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col">
          <SidebarMenu className="flex-1">
            {menuItems.map((item) => {
                const isActive = item.href === '/dashboard' 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={{ children: item.label, side: 'right' }}>
                      <Link href={item.href} className="flex items-center" onClick={handleLinkClick}>
                        {item.icon}
                        <span className="group-data-[collapsible=icon]:hidden ml-2">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
            })}

            {roles.includes('admin') && (
              <>
                <SidebarSeparator className="my-2" />
                <SidebarMenuItem key={adminMenuItem.href}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(adminMenuItem.href)} tooltip={{ children: adminMenuItem.label, side: 'right' }} className={adminMenuItem.className}>
                    <Link href={adminMenuItem.href} className="flex items-center" onClick={handleLinkClick}>
                      {adminMenuItem.icon}
                      <span className="group-data-[collapsible=icon]:hidden ml-2">{adminMenuItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
           <SidebarMenu className="mt-auto">
              <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={{ children: 'Повернутись на сайт', side: 'right' }}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold transition-colors"
                  >
                    <Link href="/" className="flex items-center" onClick={handleLinkClick}>
                      <Home className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden ml-2">На сайт</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background pb-20 md:pb-0">
        <header className="md:hidden sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-2 flex items-center h-16">
            <SidebarTrigger />
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity ml-4">
                <span className="font-headline text-lg font-semibold">Панель керування</span>
            </Link>
        </header>
        <div className="p-4 md:p-8">
         {children}
        </div>
      </SidebarInset>
      <BottomNavigation />
    </>
  );
};

// The main export uses the provider to make the context available to the content
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
};

export default DashboardLayout;
