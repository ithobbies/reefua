
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShopSettingsForm } from './shop-settings-form';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function DashboardSettingsPage() {
  const { firestoreUser, loading } = useAuth();

  React.useEffect(() => {
    document.title = 'Налаштування - Панель Продавця';
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isShop = firestoreUser?.roles?.includes('shop');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headline font-semibold text-primary">Налаштування</h1>
      
      {isShop && <ShopSettingsForm />}

      <Card>
        <CardHeader>
          <CardTitle>Налаштування сповіщень</CardTitle>
          <CardDescription>Оберіть, які сповіщення ви бажаєте отримувати.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="newBidNotification" className="flex flex-col gap-1">
              <span>Нова ставка на ваш лот</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Отримувати сповіщення, коли хтось робить ставку.
              </span>
            </Label>
            <Switch id="newBidNotification" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="lotSoldNotification" className="flex flex-col gap-1">
              <span>Лот продано</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Сповіщення, коли ваш лот успішно продано.
              </span>
            </Label>
            <Switch id="lotSoldNotification" defaultChecked disabled />
          </div>
           <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="newMessageNotification" className="flex flex-col gap-1">
              <span>Нове повідомлення від покупця</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Сповіщення про нові запитання або повідомлення.
              </span>
            </Label>
            <Switch id="newMessageNotification" disabled />
          </div>
          <Button disabled>Зберегти налаштування сповіщень (у розробці)</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Платіжні налаштування</CardTitle>
          <CardDescription>Налаштуйте способи отримання платежів (у розробці).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Цей розділ знаходиться у розробці.</p>
        </CardContent>
      </Card>
    </div>
  );
}
