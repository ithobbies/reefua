
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
} from '@/components/ui/sidebar';
import { LayoutDashboard, ListChecks, BarChart3, Star, Settings, MessageSquare, ShoppingCart, ShieldCheck } from 'lucide-react'; 
import SiteLogoIcon from '@/components/icons/site-logo-icon';
import React from 'react';
import { useAuth } from '@/context/auth-context';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { firestoreUser } = useAuth();
  const roles = firestoreUser?.roles || [];

  const menuItems = [
    { href: '/dashboard', label: 'Оглядова панель', icon: <LayoutDashboard /> },
    { href: '/dashboard/lots', label: 'Мої лоти', icon: <ListChecks /> },
    { href: '/dashboard/sales', label: 'Мої продажі', icon: <ShoppingCart /> },
    { href: '/dashboard/messages', label: 'Повідомлення', icon: <MessageSquare /> },
    { href: '/dashboard/analytics', label: 'Аналітика', icon: <BarChart3 /> },
    { href: '/dashboard/reviews', label: 'Відгуки', icon: <Star /> },
  ];

  const bottomMenuItems = [
     { href: '/dashboard/settings', label: 'Налаштування', icon: <Settings /> },
  ];

  const adminMenuItem = { 
    href: '/admin/dashboard', 
    label: 'Адмін-панель', 
    icon: <ShieldCheck className="text-red-600" />,
    className: 'text-red-600 hover:text-red-700 font-semibold'
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="items-center border-b border-sidebar-border">
           <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
            <SiteLogoIcon className="h-10 w-10" /> 
            <span className="font-headline text-lg font-semibold group-data-[collapsible=icon]:hidden">ReefUA</span>
          </Link>
          <div className="flex-1" />
          {/* Trigger for desktop, hidden on mobile */}
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
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={{ children: item.label, side: 'right' }}
                    >
                      <Link href={item.href} className="flex items-center">
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
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(adminMenuItem.href)}
                    tooltip={{ children: adminMenuItem.label, side: 'right' }}
                    className={adminMenuItem.className}
                  >
                    <Link href={adminMenuItem.href} className="flex items-center">
                      {adminMenuItem.icon}
                      <span className="group-data-[collapsible=icon]:hidden ml-2">{adminMenuItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
           <SidebarMenu>
             {bottomMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <Link href={item.href} className="flex items-center">
                    {item.icon}
                    <span className="group-data-[collapsible=icon]:hidden ml-2">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
        {/* Mobile-only header with the trigger */}
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
    </SidebarProvider>
  );
};

export default DashboardLayout;
