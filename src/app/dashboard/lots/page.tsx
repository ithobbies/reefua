
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc } from 'firebase/firestore';
import type { Lot } from '@/functions/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeleteLotAlertDialog } from '@/components/dashboard/delete-lot-alert-dialog';

export default function DashboardLotsPage() {
  const { user, loading: authLoading } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loadingLots, setLoadingLots] = useState(true);
  const { toast } = useToast();

  const fetchUserLots = useCallback(async () => {
    if (user) {
      setLoadingLots(true);
      try {
        const lotsCollection = collection(db, 'lots');
        const q = query(
          lotsCollection,
          where('sellerUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const lotSnapshot = await getDocs(q);
        const userLots = lotSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as Lot[];
        setLots(userLots);
      } catch (error) {
        console.error("Error fetching user lots: ", error);
        toast({
          variant: 'destructive',
          title: 'Помилка',
          description: 'Не вдалося завантажити ваші лоти.',
        });
      } finally {
        setLoadingLots(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    document.title = 'Мої лоти - Панель Продавця';
    if (!authLoading) {
      fetchUserLots();
    }
  }, [user, authLoading, fetchUserLots]);

  const handleDeleteLot = async (lotId: string) => {
    try {
      await deleteDoc(doc(db, 'lots', lotId));
      setLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
      toast({
        title: 'Успішно',
        description: 'Лот було видалено.',
      });
    } catch (error) {
      console.error('Error deleting lot:', error);
      toast({
        variant: 'destructive',
        title: 'Помилка',
        description: 'Не вдалося видалити лот.',
      });
    }
  };

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
          {authLoading || loadingLots ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : !user ? (
            <p className="text-muted-foreground text-center">Будь ласка, увійдіть, щоб переглянути ваші лоти.</p>
          ) : lots.length > 0 ? (
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
                {lots.map((lot) => {
                  const isActive = new Date(lot.endTime) > new Date();
                  const hasBids = lot.bidCount > 0;
                  
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.name}</TableCell>
                      <TableCell>{lot.currentBid} грн</TableCell>
                      <TableCell>{lot.buyNowPrice ? `${lot.buyNowPrice} грн` : '–'}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {isActive ? 'Активний' : 'Завершений'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="icon" aria-label="Редагувати лот" asChild disabled={hasBids}>
                          <Link href={`/dashboard/lots/edit/${lot.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteLotAlertDialog onDelete={() => handleDeleteLot(lot.id)}>
                           <Button variant="destructive" size="icon" aria-label="Видалити лот" disabled={hasBids}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteLotAlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">У вас ще немає створених лотів.</p>
                <Button asChild>
                    <Link href="/dashboard/lots/new">Створити перший лот</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
