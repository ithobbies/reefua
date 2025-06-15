
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { mockUserBids, mockWonLots, mockPaymentHistory } from '@/lib/mock-data';
import { Edit3, Bell, ShieldCheck, CreditCard, Gavel, Trophy, History, LayoutDashboardIcon } from 'lucide-react'; // Added LayoutDashboardIcon
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const UserProfilePage = () => {
  const [pushEnabled, setPushEnabled] = React.useState(true);

  React.useEffect(() => {
    document.title = 'Мій Профіль - ReefUA';
  }, []);


  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary shadow-lg">
          <AvatarImage src="https://placehold.co/128x128.png" alt="User Avatar" data-ai-hint="user portrait" />
          <AvatarFallback>UA</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-headline font-bold text-primary">User Aquarist</h1>
          <p className="text-muted-foreground">aquarist_user@email.com</p>
          <p className="text-sm text-muted-foreground">Учасник з: 12.03.2023</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center justify-center md:justify-start">
            <Button variant="outline" size="sm" >
              <Edit3 className="mr-2 h-4 w-4" /> Редагувати профіль
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboardIcon className="mr-2 h-4 w-4" /> Панель продавця
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="bids" className="text-sm md:text-base py-2.5"><Gavel className="inline h-4 w-4 mr-1 md:mr-2"/>Мої ставки</TabsTrigger>
          <TabsTrigger value="won" className="text-sm md:text-base py-2.5"><Trophy className="inline h-4 w-4 mr-1 md:mr-2"/>Виграні лоти</TabsTrigger>
          <TabsTrigger value="payments" className="text-sm md:text-base py-2.5"><History className="inline h-4 w-4 mr-1 md:mr-2"/>Історія платежів</TabsTrigger>
          <TabsTrigger value="settings" className="text-sm md:text-base py-2.5"><Bell className="inline h-4 w-4 mr-1 md:mr-2"/>Сповіщення</TabsTrigger>
        </TabsList>

        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Мої активні ставки</CardTitle>
              <CardDescription>Список лотів, на які ви зробили ставки.</CardDescription>
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
              <CardDescription>Список лотів, які ви успішно виграли.</CardDescription>
            </CardHeader>
            <CardContent>
               {mockWonLots.length > 0 ? (
                <div className="space-y-4">
                {mockWonLots.map((lot) => (
                  <Card key={lot.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                     <Image src={lot.imageUrl} alt={lot.name} width={100} height={75} className="rounded-md object-cover" data-ai-hint={lot.dataAiHint || "coral"}/>
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
              <CardDescription>Всі ваші транзакції на платформі.</CardDescription>
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
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                 <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">Email-сповіщення</Label>
                  <p className="text-sm text-muted-foreground">Отримувати підсумки та важливі новини на пошту.</p>
                </div>
                <Switch id="email-notifications" defaultChecked aria-label="Email-сповіщення" />
              </div>
              <Button>Зберегти налаштування</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;

    