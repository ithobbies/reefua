
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

// This component uses useSearchParams, so it must be wrapped in a Suspense boundary.
const SuccessContent = () => {
  const searchParams = useSearchParams();
  const orderIdsParam = searchParams.get('orderIds');
  const orderIds = orderIdsParam ? orderIdsParam.split(',') : [];

  return (
    <Card>
      <CardHeader className="items-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <CardTitle className="text-3xl font-headline">Дякуємо за замовлення!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Ваше замовлення було успішно оформлено. Продавці отримали сповіщення і незабаром оброблять його.
        </p>
        {orderIds.length > 0 && (
          <div>
            <p className="font-semibold">Номери ваших замовлень:</p>
            <ul className="list-none p-0">
              {orderIds.map(id => (
                <li key={id} className="font-mono text-lg">#{id.substring(0, 6)}...</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-muted-foreground pt-4">
          Ви можете відстежувати статус ваших замовлень у вашому профілі на вкладці "Історія замовлень".
        </p>
        <div className="flex gap-4 pt-4 justify-center">
          <Button asChild>
            <Link href="/profile?tab=payments">Перейти до моїх замовлень</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auctions">Продовжити покупки</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// The main page component now wraps the dynamic content in Suspense.
const CheckoutSuccessPage = () => {
  return (
    <div className="container mx-auto py-8 text-center max-w-2xl">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin"/></div>}>
            <SuccessContent />
        </Suspense>
    </div>
  );
};

export default CheckoutSuccessPage;
