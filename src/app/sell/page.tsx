
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SellPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    if (loading) return; 

    if (user) {
      router.push(path);
    } else {
      router.push(`/login?returnUrl=${encodeURIComponent(path)}`);
    }
  };

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
              <Button size="lg" onClick={() => handleNavigation('/dashboard/lots/new')} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Створити новий лот
              </Button>
              <Button variant="outline" size="lg" onClick={() => handleNavigation('/dashboard')} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                До панелі продавця
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
