
'use client';

import React, { useEffect, useState } from 'react';
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

const SalesPage = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

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
            // Optionally, add a toast notification for the error
        });

        return () => unsubscribe();
    }, [user]);

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
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Мої Продажі</CardTitle>
                <CardDescription>Список замовлень, які отримали ваші лоти.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : orders.length > 0 ? (
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
                            {orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 6)}...</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString('uk-UA')}</TableCell>
                                    <TableCell>{order.lots.length}</TableCell>
                                    <TableCell>{order.totalAmount.toFixed(2)} грн</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
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
                    <p className="text-center text-muted-foreground py-10">У вас ще немає жодного продажу.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesPage;
