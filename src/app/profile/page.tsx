
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit3, Bell, Gavel, Trophy, History, LayoutDashboardIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc, getDocs, collectionGroup, query, where, collection, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Lot, Bid } from '@/functions/src/types';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';

interface UserBidInfo {
  lot: Lot;
  userLastBid: Bid;
}

const UserProfilePage = () => {
  const { user, firestoreUser, loading } = useAuth();
  const { toast } = useToast();

  // States for tabs
  const [userBids, setUserBids] = useState<UserBidInfo[]>([]);
  const [wonLots, setWonLots] = useState<Lot[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [loadingWonLots, setLoadingWonLots] = useState(true);

  // States for settings
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

  const fetchTabsData = useCallback(async () => {
    if (!user) return;
    
    // Fetch Bids
    setLoadingBids(true);
    try {
      const bidsQuery = query(collectionGroup(db, 'bids'), where('userUid', '==', user.uid));
      const bidSnapshots = await getDocs(bidsQuery);
      const userBidsData: { [lotId: string]: Bid } = {};
      bidSnapshots.forEach(doc => {
        const bid = doc.data() as Bid;
        const lotId = doc.ref.parent.parent!.id;
        if (!userBidsData[lotId] || bid.amount > userBidsData[lotId].amount) {
          userBidsData[lotId] = { ...bid, lotId };
        }
      });
      const lotIds = Object.keys(userBidsData);
      if (lotIds.length > 0) {
        const lotsPromises = lotIds.map(id => getDoc(doc(db, 'lots', id)));
        const lotDocs = await Promise.all(lotsPromises);
        const bidsInfo: UserBidInfo[] = lotDocs
          .filter(doc => doc.exists())
          .map(doc => ({ lot: { ...doc.data(), id: doc.id } as Lot, userLastBid: userBidsData[doc.id] }));
        setUserBids(bidsInfo);
      } else {
        setUserBids([]);
      }
    } catch (error) { console.error("Error fetching user bids:", error); }
    finally { setLoadingBids(false); }
    
    // Fetch Won Lots
    setLoadingWonLots(true);
    try {
      const wonLotsQuery = query(collection(db, 'lots'), where('winnerUid', '==', user.uid), orderBy('endTime', 'desc'));
      const wonLotsSnapshot = await getDocs(wonLotsQuery);
      const wonLotsList = wonLotsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Lot[];
      setWonLots(wonLotsList);
    } catch (error) { console.error("Error fetching won lots:", error); }
    finally { setLoadingWonLots(false); }

  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTabsData();
    }
  }, [user, fetchTabsData]);
  
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Завантаження даних профілю...</p>
      </div>
    );
  }
  
  if (!user || !firestoreUser) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Будь ласка, увійдіть, щоб переглянути свій профіль.</h1>
        <p>Увійдіть за допомогою кнопки у верхньому меню.</p>
      </div>
    );
  }

  const registrationDate = new Date(firestoreUser.createdAt).toLocaleDateString('uk-UA');
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
            <EditProfileDialog>
              <Button variant="outline" size="sm">
                <Edit3 className="mr-2 h-4 w-4" /> Редагувати профіль
              </Button>
            </EditProfileDialog>
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
              <CardDescription>Список лотів, на які ви зробили ставки.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBids ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> :
               userBids.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Лот</TableHead>
                      <TableHead>Ваша остання ставка</TableHead>
                      <TableHead>Поточна ставка</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBids.map(({ lot, userLastBid }) => {
                      const isWinning = lot.currentBid === userLastBid.amount;
                      return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{lot.name}</TableCell>
                        <TableCell>{userLastBid.amount} грн</TableCell>
                        <TableCell className="font-bold">{lot.currentBid} грн</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${isWinning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isWinning ? 'Виграєте' : 'Перебито'}
                          </span>
                        </TableCell>
                        <TableCell><Button variant="outline" size="sm" asChild><Link href={`/lot/${lot.id}`}>Переглянути</Link></Button></TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-10">Ви ще не зробили жодної ставки.</p>}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="won">
           <Card>
            <CardHeader><CardTitle className="font-headline">Виграні лоти</CardTitle></CardHeader>
            <CardContent>
              {loadingWonLots ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> :
               wonLots.length > 0 ? (
                <div className="space-y-4">
                  {wonLots.map((lot) => (
                    <Card key={lot.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                      <Image src={(lot.images && lot.images[0]) || '/placeholder.png'} alt={lot.name} width={100} height={75} className="rounded-md object-cover" />
                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-semibold text-lg">{lot.name}</h3>
                        <p className="text-sm text-muted-foreground">Продавець: {lot.sellerUsername}</p>
                        <p className="text-md font-semibold text-primary">Виграшна ціна: {lot.currentBid} грн</p>
                      </div>
                      <Button asChild className="w-full sm:w-auto">
                        <Link href="/checkout">Оформити замовлення</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-10">У вас ще немає виграних лотів.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card><CardHeader><CardTitle>Історія платежів</CardTitle></CardHeader><CardContent><p className="text-center text-muted-foreground py-10">Цей розділ в розробці.</p></CardContent></Card>
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
                        <Switch id="push-notifications" checked={pushEnabled} onCheckedChange={setPushEnabled} aria-label="Push-сповіщення" disabled={!firestoreUser} />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="email-notifications" className="text-base font-medium">Email-сповіщення</Label>
                            <p className="text-sm text-muted-foreground">Отримувати підсумки та важливі новини на пошту.</p>
                        </div>
                        <Switch id="email-notifications" checked={emailNotificationsEnabled} onCheckedChange={setEmailNotificationsEnabled} aria-label="Email-сповіщення" disabled={!firestoreUser} />
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
