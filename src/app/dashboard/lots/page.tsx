import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockLots } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мої лоти - Панель Продавця',
  description: 'Керування вашими активними та завершеними лотами.',
};

export default function DashboardLotsPage() {
  // Filter lots by a mock seller for demonstration
  const sellerLots = mockLots.filter(lot => lot.seller === 'ReefMasterUA' || lot.seller === 'FragHub').slice(0,5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-semibold text-primary">Мої лоти</h1>
        <Button asChild>
          <Link href="/dashboard/lots/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Додати новий лот
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список ваших лотів</CardTitle>
          <CardDescription>Переглядайте та керуйте вашими лотами.</CardDescription>
        </CardHeader>
        <CardContent>
          {sellerLots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва лоту</TableHead>
                  <TableHead>Поточна ставка</TableHead>
                  <TableHead>Ціна "Купити зараз"</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.name}</TableCell>
                    <TableCell>{lot.currentBid} грн</TableCell>
                    <TableCell>{lot.buyNowPrice ? `${lot.buyNowPrice} грн` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={new Date(lot.endTime) > new Date() ? 'default' : 'secondary'}>
                        {new Date(lot.endTime) > new Date() ? 'Активний' : 'Завершений'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="icon" aria-label="Редагувати лот">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" aria-label="Видалити лот">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">У вас ще немає створених лотів.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
