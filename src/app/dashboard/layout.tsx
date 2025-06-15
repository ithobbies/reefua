'use client'; // SidebarProvider and useSidebar hook require client context

import Link from 'next/link';
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
import { LayoutDashboard, ListChecks, Upload, BarChart3, Star, Settings, ChevronRight } from 'lucide-react';
import WaveIcon from '@/components/icons/wave-icon';
import React from 'react';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // Determine active path for styling links - simplified
  // In a real app, use `usePathname` from `next/navigation`
  const [pathname, setPathname] = React.useState("/dashboard");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);


  const menuItems = [
    { href: '/dashboard', label: 'Оглядова панель', icon: <LayoutDashboard /> },
    { href: '/dashboard/lots', label: 'Мої лоти', icon: <ListChecks /> },
    { href: '/dashboard/upload', label: 'Завантажити CSV', icon: <Upload /> },
    { href: '/dashboard/analytics', label: 'Аналітика', icon: <BarChart3 /> },
    { href: '/dashboard/reviews', label: 'Відгуки', icon: <Star /> },
    { href: '/dashboard/settings', label: 'Налаштування', icon: <Settings />, isBottom: true },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" side="left" variant="sidebar">
        <SidebarHeader className="items-center border-b border-sidebar-border">
           <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:opacity-80 transition-opacity">
            <WaveIcon className="h-7 w-7" />
            <span className="font-headline text-lg font-semibold group-data-[collapsible=icon]:hidden">Benthos Bazaar</span>
          </Link>
          <div className="flex-1" />
          <SidebarTrigger className="hidden md:flex text-sidebar-foreground hover:text-sidebar-accent-foreground" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu className="flex-1">
            {menuItems.filter(item => !item.isBottom).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
           <SidebarMenu>
             {menuItems.filter(item => item.isBottom).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
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
