import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Продати лот - ReefUA',
  description: 'Розпочніть продаж ваших коралів та морських мешканців на ReefUA.',
};

export default function SellPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-primary">Готові продавати?</CardTitle>
            <CardDescription>
              Приєднуйтесь до нашої спільноти продавців та виставляйте свої лоти на аукціон.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p>
              Ви можете легко створити новий лот або, якщо ви досвідчений продавець, скористатися
              панеллю продавця для масового завантаження та управління вашими товарами.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard/lots/new">Створити новий лот</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard">До панелі продавця</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
