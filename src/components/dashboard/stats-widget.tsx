"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsWidgetProps {
  stats: {
    totalRevenue: number;
    activeListings: number;
    newFixedPriceOrders: number;
    newAuctionBids: number;
  };
}

export function StatsWidget({ stats }: StatsWidgetProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Загальний дохід (30 дн.)</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('uk-UA')} ₴</div>
          <p className="text-xs text-muted-foreground">+20.1% з минулого місяця</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активні оголошення</CardTitle>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeListings}</div>
           <p className="text-xs text-muted-foreground">Всього товарів на продаж</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Нові замовлення (24г)</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.newFixedPriceOrders}</div>
           <p className="text-xs text-muted-foreground">Продажі за фікс. ціною</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Нові ставки (24г)</CardTitle>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4"></path><path d="M20.2 10.2c.1.4.2.8.2 1.2s-.1.8-.2 1.2l1.7 1.3c.4.3.5.9.2 1.3l-1.4 2.4c-.3.5-.9.6-1.3.3l-1.9-1c-.4.3-.8.5-1.2.7l-.3 2.1c-.1.5-.5.8-1 .8h-2.8c-.5 0-.9-.3-1-.8l-.3-2.1c-.4-.2-.8-.4-1.2-.7l-1.9 1c-.4.3-1 .2-1.3-.3l-1.4-2.4c-.3-.5-.2-1.1.2-1.3l1.7-1.3c-.1-.4-.2-.8-.2-1.2s.1-.8.2-1.2l-1.7-1.3c-.4-.3-.5-.9-.2-1.3l1.4-2.4c.3-.5.9-.6 1.3-.3l1.9 1c.4-.3.8-.5 1.2-.7l.3-2.1c.1-.5.5-.8 1-.8h2.8c.5 0 .9.3 1 .8l.3 2.1c.4.2.8.4 1.2.7l1.9 1c.4-.3 1 .2 1.3.3l1.4 2.4c.3.5.2 1.1-.2 1.3l-1.7 1.3z"></path></svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{stats.newAuctionBids}</div>
          <p className="text-xs text-muted-foreground">На активних аукціонах</p>
        </CardContent>
      </Card>
    </div>
  );
}
