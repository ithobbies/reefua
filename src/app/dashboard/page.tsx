import StatsCard from '@/components/dashboard/stats-card';
import CsvUploadWidget from '@/components/dashboard/csv-upload';
import { mockSellerStats } from '@/lib/mock-data';
import { ListChecks, CheckCircle, Percent, Star, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Панель Продавця - ReefUA',
  description: 'Керуйте вашими лотами, переглядайте статистику та продажі.',
};

export default function SellerDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline font-bold text-primary">Панель Продавця</h1>
        <Button asChild>
          <Link href="/dashboard/lots/new">
            <UploadCloud className="mr-2 h-4 w-4" /> Створити новий лот
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Активні лоти"
          value={mockSellerStats.activeLots}
          icon={<ListChecks className="h-5 w-5" />}
          description={`З ${mockSellerStats.totalListings} всіх лотів`}
        />
        <StatsCard
          title="Завершені продажі"
          value={mockSellerStats.completedSales}
          icon={<CheckCircle className="h-5 w-5" />}
          description="Успішно продано"
        />
        <StatsCard
          title="% Продано"
          value={`${mockSellerStats.salesPercentage}%`}
          icon={<Percent className="h-5 w-5" />}
          description="Відсоток успішних продажів"
        />
        <StatsCard
          title="Рейтинг продавця"
          value={mockSellerStats.rating.toFixed(1)}
          icon={<Star className="h-5 w-5" />}
          description="На основі відгуків покупців"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Останні активності</CardTitle>
              <CardDescription>Події по вашим лотам та продажам.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for recent activity feed */}
              <ul className="space-y-3">
                <li className="text-sm p-3 bg-secondary rounded-md">Нова ставка на лот "Acropora Red Planet" - 1500 грн.</li>
                <li className="text-sm p-3 bg-secondary rounded-md">Лот "Zoanthus Watermelon" продано за 500 грн.</li>
                <li className="text-sm p-3 bg-secondary rounded-md">Новий відгук: 5 зірок від User123.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <CsvUploadWidget />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Прогрес Продавця</CardTitle>
          <CardDescription>Ваш прогрес до наступного рівня продавця.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Рівень: Новачок</span>
            <span>Наступний рівень: Досвідчений</span>
          </div>
          <Progress value={66} aria-label="66% до наступного рівня" className="h-3"/>
          <p className="text-xs text-muted-foreground text-right">66% до наступного рівня</p>
        </CardContent>
      </Card>

    </div>
  );
}
