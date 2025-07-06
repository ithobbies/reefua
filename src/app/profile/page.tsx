
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // <-- The missing import
import { Edit3, Bell, Gavel, Trophy, History, LayoutDashboardIcon, Loader2, MessageSquarePlus, Eye, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, updateDoc, getDocs, collectionGroup, query, where, collection, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Lot, Bid } from '@/functions/src/types';
import { EditProfileDialog } from '@/components/profile/edit-profile-dialog';
import { LeaveReviewDialog } from '@/components/profile/leave-review-dialog';
import { OrdersHistoryTab } from '@/components/profile/orders-history-tab';

interface UserBidInfo {
  lot: Lot;
  userLastBid: Bid;
}

const UserProfilePage = () => {
  const { user, firestoreUser, loading } = useAuth();
  const { toast } = useToast();

  const [userBids, setUserBids] = useState<UserBidInfo[]>([]);
  const [lotsForAction, setLotsForAction] = useState<Lot[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);
  const [loadingWonLots, setLoadingWonLots] = useState(true);

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

  const handleReviewSubmitted = useCallback(() => {
    // This function can be used to manually re-trigger the fetch if needed,
    // but the onSnapshot listener should handle it automatically.
  }, []);

  useEffect(() => {
    if (!user) {
      setLoadingWonLots(false);
      return;
    }
    
    setLoadingWonLots(true);
    const allWonLotsQuery = query(collection(db, 'lots'), where('winnerUid', '==', user.uid), orderBy('endTime', 'desc'));
    
    const unsubscribe = onSnapshot(allWonLotsQuery, (snapshot) => {
      const allLotsList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Lot[];
      
      // Filter for lots that require user action
      const actionRequiredLots = allLotsList.filter(lot => {
        // Action 1: Lot is won and needs to be ordered
        if (lot.status === 'sold') return true;
        // Action 2: Lot is processed/shipped/completed and a review has not been left
        if ((lot.status === 'processing' || lot.status === 'shipped' || lot.status === 'completed') && !lot.reviewLeft) return true;
        return false;
      });
      
      setLotsForAction(actionRequiredLots);
      setLoadingWonLots(false);
    }, (error) => {
      console.error("Error fetching won lots:", error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося завантажити виграні лоти.' });
      setLoadingWonLots(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const fetchBids = useCallback(async () => {
      if (!user) return;
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
            .map(doc => ({ lot: { ...doc.data(), id: doc.id } as Lot, userLastBid: userBidsData[doc.id] }))
            .filter(({ lot }) => new Date(lot.endTime) > new Date());
          setUserBids(bidsInfo);
        } else {
          setUserBids([]);
        }
      } catch (error) { console.error("Error fetching user bids:", error); }
      finally { setLoadingBids(false); }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBids();
    }
  }, [user, fetchBids]);
  
  const handleSettingsSave = async () => {
    if (!user) return;
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
    return <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  
  if (!user || !firestoreUser) {
    return <div className="container mx-auto py-8 text-center"><h1 className="text-2xl font-bold">Будь ласка, увійдіть.</h1></div>;
  }

  return (
    <div className="container mx-auto py-8">
       <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
         <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary"><AvatarImage src={firestoreUser.photoURL || undefined} /><AvatarFallback>{firestoreUser.username?.[0]}</AvatarFallback></Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-headline font-bold text-primary">{firestoreUser.username}</h1>
          <p className="text-muted-foreground">{firestoreUser.email}</p>
          <p className="text-sm text-muted-foreground">Учасник з: {new Date(firestoreUser.createdAt).toLocaleDateString('uk-UA')}</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 items-center justify-center md:justify-start">
            <EditProfileDialog><Button variant="outline" size="sm"><Edit3 className="mr-2 h-4 w-4" />Редагувати профіль</Button></EditProfileDialog>
            {firestoreUser.roles?.includes('seller') && (<Button variant="outline" size="sm" asChild><Link href="/dashboard"><LayoutDashboardIcon className="mr-2 h-4 w-4" />Панель продавця</Link></Button>)}
          </div>
        </div>
      </div>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
           <TabsTrigger value="bids"><Gavel className="inline h-4 w-4 mr-1 md:mr-2" />Мої ставки</TabsTrigger>
          <TabsTrigger value="won"><Trophy className="inline h-4 w-4 mr-1 md:mr-2" />Мої покупки</TabsTrigger>
          <TabsTrigger value="payments"><History className="inline h-4 w-4 mr-1 md:mr-2" />Історія замовлень</TabsTrigger>
          <TabsTrigger value="settings"><Bell className="inline h-4 w-4 mr-1 md:mr-2" />Сповіщення</TabsTrigger>
        </TabsList>
        <TabsContent value="bids">
          <Card><CardHeader><CardTitle>Мої активні ставки</CardTitle></CardHeader>
            <CardContent>
              {loadingBids ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> :
               userBids.length > 0 ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Лот</TableHead><TableHead>Ваша ставка</TableHead><TableHead>Поточна ставка</TableHead><TableHead>Статус</TableHead><TableHead>Дії</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {userBids.map(({ lot, userLastBid }) => (
                      <TableRow key={lot.id}>
                        <TableCell>{lot.name}</TableCell><TableCell>{userLastBid.amount} грн</TableCell><TableCell>{lot.currentBid} грн</TableCell>
                        <TableCell><Badge variant={lot.currentBid === userLastBid.amount ? 'default' : 'destructive'}>{lot.currentBid === userLastBid.amount ? 'Виграєте' : 'Перебито'}</Badge></TableCell>
                        <TableCell><Button variant="outline" size="sm" asChild><Link href={`/lot/${lot.id}`}>Переглянути</Link></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-center text-muted-foreground py-10">Ви ще не зробили жодної ставки.</p>}
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="won">
           <Card>
            <CardHeader><CardTitle>Мої покупки</CardTitle><CardDescription>Лоти, що потребують вашої дії: оформлення замовлення або залишення відгуку.</CardDescription></CardHeader>
            <CardContent>
              {loadingWonLots ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> :
               lotsForAction.length > 0 ? (
                <div className="space-y-4">
                  {lotsForAction.map((lot) => (
                    <Card key={lot.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                      <Image src={(lot.images && lot.images[0]) || '/placeholder.png'} alt={lot.name} width={100} height={75} className="rounded-md object-cover" />
                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-semibold text-lg">{lot.name}</h3>
                        <p className="text-sm text-muted-foreground">Продавець: {lot.sellerUsername}</p>
                        <p className="text-md font-semibold text-primary">Ціна: {lot.finalPrice || lot.currentBid} грн</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 self-center sm:items-center">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/lot/${lot.id}`}><Eye className="mr-2 h-4 w-4"/>Переглянути</Link>
                        </Button>
                        {/* Show Review button if lot is completed/shipped and no review is left */}
                        {!lot.reviewLeft && (lot.status === 'completed' || lot.status === 'shipped') && (
                          <LeaveReviewDialog lotId={lot.id} lotName={lot.name} onReviewSubmitted={handleReviewSubmitted}>
                            <Button size="sm"><MessageSquarePlus className="mr-2 h-4 w-4" />Відгук</Button>
                          </LeaveReviewDialog>
                        )}
                        {/* Show Checkout button ONLY if the status is 'sold' */}
                        {lot.status === 'sold' && (
                            <Button size="sm" asChild>
                                <Link href="/checkout"><CreditCard className="mr-2 h-4 w-4"/>Оформити замовлення</Link>
                            </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-10">У вас немає покупок, що потребують дій.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <OrdersHistoryTab />
        </TabsContent>
        <TabsContent value="settings">
          <Card><CardHeader><CardTitle>Налаштування сповіщень</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="push-notifications">Push-сповіщення</Label><Switch id="push-notifications" checked={pushEnabled} onCheckedChange={setPushEnabled}/></div>
                <div className="flex items-center justify-between p-4 border rounded-lg"><Label htmlFor="email-notifications">Email-сповіщення</Label><Switch id="email-notifications" checked={emailNotificationsEnabled} onCheckedChange={setEmailNotificationsEnabled}/></div>
                <Button onClick={handleSettingsSave} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Зберегти</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
