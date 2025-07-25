
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { type Order } from '@/functions/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterStatus = 'all' | 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';

const SalesPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('all');

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'),
            where('sellerUid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching sales orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') {
            return orders;
        }
        return orders.filter(order => order.status === filter);
    }, [orders, filter]);

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'new': return 'default';
            case 'processing': return 'secondary';
            case 'shipped': return 'outline';
            case 'completed': return 'default';
            case 'cancelled': return 'destructive';
            default: return 'secondary';
        }
    };
    
    // Function to translate status to Ukrainian
    const translateStatus = (status: Order['status']) => {
        switch (status) {
            case 'new': return 'Новий';
            case 'processing': return 'В обробці';
            case 'shipped': return 'Відправлено';
            case 'completed': return 'Завершено';
            case 'cancelled': return 'Скасовано';
            default: return status;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Мої Продажі</CardTitle>
                <CardDescription>Список замовлень, які отримали ваші лоти.</CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
                <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as FilterStatus)} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">Всі</TabsTrigger>
                        <TabsTrigger value="new">Нові</TabsTrigger>
                        <TabsTrigger value="processing">В обробці</TabsTrigger>
                        <TabsTrigger value="shipped">Відправлені</TabsTrigger>
                        <TabsTrigger value="completed">Завершені</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                     <p className="text-center text-muted-foreground py-10">У вас ще немає жодного продажу.</p>
                ) : filteredOrders.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Номер замовлення</TableHead>
                                <TableHead>Дата</TableHead>
                                <TableHead>Кількість лотів</TableHead>
                                <TableHead>Сума</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Дії</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 6)}...</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString('uk-UA')}</TableCell>
                                    <TableCell>{order.lots.length}</TableCell>
                                    <TableCell>{order.totalAmount.toFixed(2)} грн</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/dashboard/sales/${order.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                Деталі
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-muted-foreground py-10">Не знайдено замовлень за вашим фільтром.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesPage;
