
'use client'; 

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 1. Import the hook
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
} from '@/components/ui/sidebar';
import { LayoutDashboard, ListChecks, BarChart3, Star, Settings, MessageSquare, ShoppingCart } from 'lucide-react'; 
import SiteLogoIcon from '@/components/icons/site-logo-icon';
import React from 'react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // 2. Use the hook to get the current path
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Оглядова панель', icon: <LayoutDashboard /> },
    { href: '/dashboard/lots', label: 'Мої лоти', icon: <ListChecks /> },
    { href: '/dashboard/sales', label: 'Мої Продажі', icon: <ShoppingCart /> },
    { href: '/dashboard/messages', label: 'Повідомлення', icon: <MessageSquare /> },
    { href: '/dashboard/analytics', label: 'Аналітика', icon: <BarChart3 /> },
    { href: '/dashboard/reviews', label: 'Відгуки', icon: <Star /> },
    { href: '/dashboard/settings', label: 'Налаштування', icon: <Settings />, isBottom: true },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="items-center border-b border-sidebar-border">
           <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
            <SiteLogoIcon className="h-10 w-10" /> 
            <span className="font-headline text-lg font-semibold group-data-[collapsible=icon]:hidden">ReefUA</span>
          </Link>
          <div className="flex-1" />
          <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu className="flex-1">
            {menuItems.filter(item => !item.isBottom).map((item) => {
                // 3. Simplified and more robust active check
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
          </SidebarMenu>
           <SidebarMenu>
             {menuItems.filter(item => item.isBottom).map((item) => (
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
        <div className="p-4 md:p-8">
         {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
