
'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { type Order, type User } from '@/functions/src/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Helper to get a readable name for shipping method
const getShippingMethodName = (method: Order['shippingInfo']['shippingMethod']) => {
    switch(method) {
        case 'nova-poshta': return 'Нова Пошта (відділення)';
        case 'nova-poshta-courier': return "Нова Пошта (кур'єр)";
        case 'pickup': return 'Самовивіз';
        case 'other': return 'Інший спосіб (поїзд/автобус)';
        default: return 'Не вказано';
    }
}

export const OrdersHistoryTab = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [sellers, setSellers] = useState<{[key: string]: User}>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'),
            where('buyerUid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Order[];
            setOrders(ordersData);

            const sellerUids = [...new Set(ordersData.map(order => order.sellerUid).filter(Boolean))];
            
            const newSellersToFetch = sellerUids.filter(uid => !sellers[uid]);
            if (newSellersToFetch.length > 0) {
                 try {
                    const sellerDocs = await Promise.all(newSellersToFetch.map(uid => getDoc(doc(db, 'users', uid))));
                    const newSellers: {[key: string]: User} = {};
                    sellerDocs.forEach(docSnap => {
                        if (docSnap.exists()) {
                            newSellers[docSnap.id] = docSnap.data() as User;
                        }
                    });
                    setSellers(prevSellers => ({ ...prevSellers, ...newSellers }));
                } catch (error) {
                    console.error("Error fetching seller profiles:", error);
                }
            }
            
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, sellers]);

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (orders.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Історія Замовлень</CardTitle></CardHeader>
                <CardContent><p className="text-center text-muted-foreground py-10">У вас ще немає оформлених замовлень.</p></CardContent>
            </Card>
        );
    }
    
    const getStatusClass = (status: Order['status']) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'processing': return 'bg-yellow-100 text-yellow-800';
            case 'shipped': return 'bg-indigo-100 text-indigo-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Історія Замовлень</CardTitle>
                <CardDescription>Список усіх ваших замовлень.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {orders.map(order => {
                        const seller = sellers[order.sellerUid];
                        return (
                            <AccordionItem value={order.id} key={order.id}>
                                <AccordionTrigger>
                                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center w-full pr-4 text-left'>
                                        <span className="font-semibold">Замовлення №{order.id.substring(0, 6)}...</span>
                                        <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('uk-UA')}</span>
                                        <span className="font-medium">{order.totalAmount.toFixed(2)} грн</span>
                                        <Badge className={cn("mt-2 sm:mt-0", getStatusClass(order.status))}>{order.status}</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-muted/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Деталі замовлення</h4>
                                            {seller ? <p><strong>Продавець:</strong> <Link href={`/profile/${order.sellerUid}`} className="text-primary hover:underline">{seller.username}</Link></p> : <p>Продавець: ...</p>}
                                            <p><strong>Спосіб доставки:</strong> {getShippingMethodName(order.shippingInfo.shippingMethod)}</p>
                                            <p><strong>Адреса:</strong> {order.shippingInfo.city ? `${order.shippingInfo.city}, ${order.shippingInfo.department}` : 'Самовивіз або інше'}</p>
                                            {order.trackingNumber && <p><strong>ТТН:</strong> {order.trackingNumber}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Лоти в замовленні</h4>
                                            <ul className="list-disc list-inside">
                                                {order.lots.map(lot => (
                                                    <li key={lot.id}>{lot.name} - <strong>{lot.finalPrice?.toFixed(2)} грн</strong></li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
};
