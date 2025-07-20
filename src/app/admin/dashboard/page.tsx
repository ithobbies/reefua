"use client"; // This directive marks the component as a Client Component

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
} from "lucide-react";

const userRegistrationData = [
  { date: "01.07", users: 12 },
  { date: "02.07", users: 19 },
  { date: "03.07", users: 25 },
  { date: "04.07", users: 31 },
  { date: "05.07", users: 45 },
  { date: "06.07", users: 52 },
  { date: "07.07", users: 68 },
];

const popularCategoriesData = [
  { name: "Електроніка", value: 450 },
  { name: "Антикваріат", value: 320 },
  { name: "Мистецтво", value: 280 },
  { name: "Монети", value: 210 },
  { name: "Автомобілі", value: 150 },
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
    text: "Продавець не виходить на зв'язок.",
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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-8 w-8 text-red-600" />
        <h1 className="text-3xl font-headline font-bold text-primary">
          Адмін-панель
        </h1>
        <Badge variant="destructive">Суперкористувач</Badge>
      </div>

      {/* Metric Cards */}
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Всього користувачів</p>
              <p className="font-semibold">12,450</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Активних лотів</p>
              <p className="font-semibold">3,120</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Сума продажів (міс)</p>
              <p className="font-semibold">1,250,000 ₴</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Конверсія в продаж</p>
              <p className="font-semibold">15.4%</p>
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
