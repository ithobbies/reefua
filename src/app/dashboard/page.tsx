"use client";

import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/context/auth-context';

import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QuickActionsWidget } from "@/components/dashboard/quick-actions-widget";
import { StatsWidget } from "@/components/dashboard/stats-widget";
import { SalesChartWidget } from "@/components/dashboard/sales-chart-widget";
import { ActivityFeedWidget } from "@/components/dashboard/activity-feed-widget";
import { ActiveListingsWidget } from "@/components/dashboard/active-listings-widget";
import { useToast } from "@/hooks/use-toast";

// --- Data Interfaces ---
interface ListingPreview {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string;
  endDate?: Date;
  bids?: number;
  stock?: number;
}

interface ActivityItem {
  id: string;
  type: 'bid' | 'sale';
  item: string;
  value: string;
  user: string;
  timestamp: Date;
}

interface DashboardData {
  stats: {
    totalRevenue: number;
    activeListings: number;
    newFixedPriceOrders: number;
    newAuctionBids: number;
  };
  salesChartData: { date: string; revenue: number }[];
  activeAuctions: ListingPreview[];
  fixedPriceItems: ListingPreview[];
  recentActivity: ActivityItem[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      const functions = getFunctions();
      const getSellerDashboardData = httpsCallable<void, DashboardData>(functions, 'getSellerDashboardData');
      
      try {
        const result = await getSellerDashboardData();
        // Defensive check to ensure arrays exist before mapping
        const processedData = {
            ...result.data,
            activeAuctions: (result.data.activeAuctions || []).map(a => ({...a, endDate: new Date(a.endDate) })),
            fixedPriceItems: result.data.fixedPriceItems || [],
            recentActivity: (result.data.recentActivity || []).map(a => ({...a, timestamp: new Date(a.timestamp) }))
        }
        setData(processedData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
            title: "Помилка",
            description: "Не вдалося завантажити дані для панелі продавця.",
            variant: "destructive"
        })
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <div>Будь ласка, увійдіть до системи, щоб побачити вашу панель.</div>;
  }

  if (!data) {
    return <div>Не вдалося завантажити дані. Спробуйте оновити сторінку.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Панель продавця</h1>
        <QuickActionsWidget />
      </div>

      <StatsWidget stats={data.stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <SalesChartWidget data={data.salesChartData} />
          <ActivityFeedWidget activities={data.recentActivity} />
      </div>

      <ActiveListingsWidget auctions={data.activeAuctions} fixedPriceItems={data.fixedPriceItems} />
    </div>
  );
}
