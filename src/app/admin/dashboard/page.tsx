"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { functions } from "@/lib/firebase"; 
import { httpsCallable } from "firebase/functions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  ShieldCheck,
  Users,
  Gavel,
  Package,
  AlertCircle,
  ArrowUpRight,
  Link as LinkIcon,
  UserPlus,
} from "lucide-react";

// --- Mock Data (will be replaced or augmented with live data) ---
const userRegistrationData = [
    { date: "01.07", users: 12 },
    { date: "02.07", users: 19 },
    { date: "03.07", users: 25 },
    { date: "04.07", users: 31 },
    { date: "05.07", users: 45 },
    { date: "06.07", users: 52 },
    { date: "07.07", users: 68 },
  ];
  
  const recentComplaints = [
    {
      id: "CMP001",
      user: "user123",
      text: "Лот не відповідає опису...",
      link: "/lot/xyz-123",
    },
    {
      id: "CMP002",
      user: "buyer_pro",
      text: "Продавець не виходить на зв\'язок.",
      link: "/profile/seller-abc",
    },
    {
      id: "CMP003",
      user: "jane_doe",
      text: "Підозра на шахрайство.",
      link: "/lot/abc-456",
    },
  ];
  
  const topSellers = [
    { name: "TopSeller UA", sales: "150,000 ₴" },
    { name: "Vintage World", sales: "125,500 ₴" },
    { name: "Art Collector", sales: "98,000 ₴" },
    { name: "Retro Cars", sales: "250,000 ₴" },
  ];

// --- Type Definition for Key Metrics ---
interface KeyMetricsData {
  totalUsers: number;
  telegramSubscribers: number; // New metric
  activeLots: number;
  totalSales: number;
  totalDeals: number;
  salesConversion: number;
}

// --- Main Component ---
export default function AdminDashboardPage() {
  const [keyMetrics, setKeyMetrics] = useState<KeyMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeyMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const getKeyMetrics = httpsCallable(functions, 'getKeyMetrics');
        const result = await getKeyMetrics();
        setKeyMetrics(result.data as KeyMetricsData);
      } catch (err) {
        console.error("Error fetching key metrics:", err);
        setError("Не вдалося завантажити ключові показники.");
      }
      setIsLoading(false);
    };

    fetchKeyMetrics();
  }, []);

  const renderKpiValue = (value: number | undefined, format: (v: number) => string) => {
    if (isLoading) return <Skeleton className="h-6 w-24" />;
    if (value === undefined) return <span className="text-sm text-muted-foreground">N/A</span>;
    return <p className="font-semibold">{format(value)}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-headline font-bold text-primary">
            Адмін-панель
          </h1>
          <Badge variant="destructive">Суперкористувач</Badge>
        </div>
        <Button asChild>
          <Link href="/admin/set-role">
            <UserPlus className="mr-2 h-4 w-4" />
            Призначити роль
          </Link>
        </Button>
      </div>

      {/* Metric Cards - Still using static data for now */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Нові користувачі (24 год)
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125</div>
            <p className="text-xs text-muted-foreground">+10.2% від учора</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Нові аукціони (24 год)
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">+5.1% від учора</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Нові товари (24 год)
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground">+8.0% від учора</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Скарги в очікуванні
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">2 нових сьогодні</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Charts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Реєстрація користувачів</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userRegistrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* KPI Block */}
        <Card>
          <CardHeader>
            <CardTitle>Ключові показники</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Всього користувачів</p>
              {renderKpiValue(keyMetrics?.totalUsers, (v) => v.toLocaleString())}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Підписників Telegram</p>
              {renderKpiValue(keyMetrics?.telegramSubscribers, (v) => v.toLocaleString())}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Активних лотів</p>
              {renderKpiValue(keyMetrics?.activeLots, (v) => v.toLocaleString())}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Сума продажів (за весь час)</p>
              {renderKpiValue(keyMetrics?.totalSales, (v) => `${v.toLocaleString('uk-UA')} ₴`)}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Угод закрито (за весь час)</p>
              {renderKpiValue(keyMetrics?.totalDeals, (v) => v.toLocaleString())}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Конверсія в продаж</p>
              {renderKpiValue(keyMetrics?.salesConversion, (v) => `${v.toFixed(1)}%`)}
            </div>
            <Button className="w-full">
              Повний звіт <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>Останні скарги</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Користувач</TableHead>
                  <TableHead>Текст</TableHead>
                  <TableHead className="text-right">Дія</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentComplaints.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.user}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {c.text}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a href={c.link} target="_blank">
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Sellers Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Топ-продавці тижня</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Продавець</TableHead>
                  <TableHead className="text-right">Сума продажів</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {s.sales}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
