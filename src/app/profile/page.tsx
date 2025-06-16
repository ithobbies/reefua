
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockUserBids, mockWonLots, mockPaymentHistory } from '@/lib/mock-data';
import { Edit3, Bell, Gavel, Trophy, History, LayoutDashboardIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const UserProfilePage = () => {
  const { user, firestoreUser, loading } = useAuth();
  const { toast } = useToast();

  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.title = 'Мій Профіль - ReefUA';
    if (firestoreUser) {
      setPushEnabled(firestoreUser.pushEnabled);
      setEmailNotificationsEnabled(firestoreUser.emailNotifications);
    }
  }, [firestoreUser]);

  const handleSettingsSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Помилка', description: 'Ви не авторизовані.' });
      return;
    }
    setIsSaving(true);
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        pushEnabled,
        emailNotifications: emailNotificationsEnabled,
        updatedAt: new Date().toISOString(),
      });
      toast({ title: 'Успішно', description: 'Налаштування збережено.' });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти налаштування.' });
    } finally {
      setIsSaving(false);
    }
  };

  // This is the primary loading state when the auth context is fetching user data
  if (loading) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Завантаження даних профілю...</p>
      </div>
    );
  }

  // This state occurs if the user is authenticated, but we are still waiting for the
  // firestore document to be created by the cloud function.
  if (user && !firestoreUser) {
     return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Завершуємо налаштування вашого профілю...</p>
      </div>
    );
  }
  
  // This state occurs if loading is finished and there's definitively no user.
  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Будь ласка, увійдіть, щоб переглянути свій профіль.</h1>
        <p>Увійдіть за допомогою кнопки у верхньому меню.</p>
      </div>
    );
  }

  // If we have reached this point, we can safely assume we have a firestoreUser
  const registrationDate = firestoreUser.createdAt ? new Date(firestoreUser.createdAt).toLocaleDateString('uk-UA') : 'Невідомо';
  const fallbackInitial = firestoreUser.username ? firestoreUser.username[0].toUpperCase() : 'U';

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary shadow-lg">
          <AvatarImage src={firestoreUser.photoURL || undefined} alt={firestoreUser.username || 'User Avatar'} />
          <AvatarFallback>{fallbackInitial}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-headline font-bold text-primary">{firestoreUser.username}</h1>
          <p className="text-muted-foreground">{firestoreUser.email}</p>
          <p className="text-sm text-muted-foreground">Учасник з: {registrationDate}</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center justify-center md:justify-start">
            <Button variant="outline" size="sm">
              <Edit3 className="mr-2 h-4 w-4" /> Редагувати профіль
            </Button>
            {firestoreUser.roles?.includes('seller') && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboardIcon className="mr-2 h-4 w-4" /> Панель продавця
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="bids" className="text-sm md:text-base py-2.5"><Gavel className="inline h-4 w-4 mr-1 md:mr-2" />Мої ставки</TabsTrigger>
          <TabsTrigger value="won" className="text-sm md:text-base py-2.5"><Trophy className="inline h-4 w-4 mr-1 md:mr-2" />Виграні лоти</TabsTrigger>
          <TabsTrigger value="payments" className="text-sm md:text-base py-2.5"><History className="inline h-4 w-4 mr-1 md:mr-2" />Історія платежів</TabsTrigger>
          <TabsTrigger value="settings" className="text-sm md:text-base py-2.5"><Bell className="inline h-4 w-4 mr-1 md:mr-2" />Сповіщення</TabsTrigger>
        </TabsList>

        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Мої активні ставки</CardTitle>
              <CardDescription>Список лотів, на які ви зробили ставки. (Незабаром з реальними даними)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Лот</TableHead>
                    <TableHead>Ваша ставка</TableHead>
                    <TableHead>Поточна ставка</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUserBids.map((bid, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{bid.lotName}</TableCell>
                      <TableCell>{bid.yourBid} грн</TableCell>
                      <TableCell>{bid.currentBid} грн</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${bid.status === 'Виграєте' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {bid.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/lot/${bid.lotId}`}>Переглянути</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="won">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Виграні лоти</CardTitle>
              <CardDescription>Список лотів, які ви успішно виграли. (Незабаром з реальними даними)</CardDescription>
            </CardHeader>
            <CardContent>
              {mockWonLots.length > 0 ? (
                <div className="space-y-4">
                  {mockWonLots.map((lot) => (
                    <Card key={lot.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                      <Image src={lot.imageUrl} alt={lot.name} width={100} height={75} className="rounded-md object-cover" data-ai-hint={lot.dataAiHint || "coral"} />
                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-semibold text-lg">{lot.name}</h3>
                        <p className="text-sm text-muted-foreground">Продавець: {lot.seller}</p>
                        <p className="text-md font-semibold text-primary">Виграшна ціна: {(lot as any).wonPrice} грн</p>
                      </div>
                      <Button asChild className="w-full sm:w-auto">
                        <Link href="/checkout">Оформити замовлення</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">У вас ще немає виграних лотів.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Історія платежів</CardTitle>
              <CardDescription>Всі ваші транзакції на платформі. (Незабаром з реальними даними)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Опис</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaymentHistory.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(payment.date).toLocaleDateString('uk-UA')}</TableCell>
                      <TableCell>{payment.item}</TableCell>
                      <TableCell className="font-semibold">{payment.amount} грн</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${payment.status === 'Оплачено' || payment.status === 'Зараховано' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {payment.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Налаштування сповіщень</CardTitle>
              <CardDescription>Керуйте тим, які сповіщення ви отримуєте.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="push-notifications" className="text-base font-medium">Push-сповіщення</Label>
                  <p className="text-sm text-muted-foreground">Отримувати миттєві сповіщення про ставки, виграші та нові лоти.</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushEnabled}
                  onCheckedChange={setPushEnabled}
                  aria-label="Push-сповіщення"
                  disabled={!firestoreUser}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">Email-сповіщення</Label>
                  <p className="text-sm text-muted-foreground">Отримувати підсумки та важливі новини на пошту.</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotificationsEnabled}
                  onCheckedChange={setEmailNotificationsEnabled}
                  aria-label="Email-сповіщення"
                  disabled={!firestoreUser}
                />
              </div>
              <Button onClick={handleSettingsSave} disabled={isSaving || !firestoreUser}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Збереження...' : 'Зберегти налаштування'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
