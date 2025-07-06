
'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Order } from '@/functions/src/types';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const getShippingMethodName = (method: Order['shippingInfo']['shippingMethod']) => {
    switch(method) {
        case 'nova-poshta': return 'Нова Пошта (відділення)';
        case 'nova-poshta-courier': return "Нова Пошта (кур'єр)";
        case 'pickup': return 'Самовивіз';
        case 'other': return 'Інший спосіб (поїзд/автобус)';
        default: return 'Не вказано';
    }
}

const OrderDetailsPage = () => {
    const { orderId } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [status, setStatus] = useState<Order['status'] | undefined>();
    const [trackingNumber, setTrackingNumber] = useState('');

    useEffect(() => {
        if (!orderId) return;
        const docRef = doc(db, 'orders', orderId as string);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const orderData = { ...docSnap.data(), id: docSnap.id } as Order;
                if (user && orderData.sellerUid === user.uid) {
                    setOrder(orderData);
                    setStatus(orderData.status);
                    setTrackingNumber(orderData.trackingNumber || '');
                } else {
                    toast({title: "Помилка", description: "У вас немає доступу до цього замовлення.", variant: "destructive"})
                    router.push('/dashboard/sales');
                }
            } else {
                toast({title: "Помилка", description: "Замовлення не знайдено.", variant: "destructive"})
                router.push('/dashboard/sales');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderId, user, router, toast]);
    
    const handleUpdateOrder = async () => {
        if (!order || !status) return;
        setIsUpdating(true);
        
        const orderRef = doc(db, 'orders', order.id);
        try {
            await updateDoc(orderRef, {
                status: status,
                trackingNumber: trackingNumber,
                updatedAt: new Date().toISOString()
            });
            toast({title: "Успіх!", description: "Статус замовлення оновлено."});
        } catch (error) {
            console.error("Error updating order:", error);
            toast({title: "Помилка", description: "Не вдалося оновити замовлення.", variant: "destructive"});
        } finally {
            setIsUpdating(false);
        }
    };


    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!order) {
        return <div className="text-center py-10">Замовлення не знайдено або у вас немає доступу.</div>;
    }

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/dashboard/sales')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                До всіх продажів
            </Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Лоти в замовленні #{order.id.substring(0, 6)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.lots.map(lot => (
                                <div key={lot.id} className="flex items-center gap-4 py-3">
                                    <Image src={lot.images?.[0] || '/placeholder.png'} alt={lot.name} width={64} height={64} className="rounded-md object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{lot.name}</p>
                                    </div>
                                    <p className="font-medium">{lot.finalPrice?.toFixed(2)} грн</p>
                                </div>
                            ))}
                            <Separator className="my-4"/>
                            <div className="flex justify-end text-xl font-bold">
                                <span>Всього:</span>
                                <span className="text-primary ml-4">{order.totalAmount.toFixed(2)} грн</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle>Інформація про доставку</CardTitle>
                            <CardDescription>Адреса покупця для відправки замовлення.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Ім'я:</strong> {order.shippingInfo.firstName} {order.shippingInfo.lastName}</p>
                            <p><strong>Телефон:</strong> {order.shippingInfo.phone}</p>
                            <p><strong>Спосіб доставки:</strong> {getShippingMethodName(order.shippingInfo.shippingMethod)}</p>
                            {order.shippingInfo.city && <p><strong>Місто:</strong> {order.shippingInfo.city}</p>}
                            {order.shippingInfo.department && <p><strong>Відділення/Адреса:</strong> {order.shippingInfo.department}</p>}
                            {order.shippingInfo.shippingMethod === 'other' && order.shippingInfo.details && (
                                <div className="pt-2">
                                    <p><strong>Деталі доставки (поїзд/автобус):</strong></p>
                                    <p className="text-muted-foreground whitespace-pre-line">{order.shippingInfo.details}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Керування замовленням</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="status">Статус замовлення</Label>
                                <Select value={status} onValueChange={(val: Order['status']) => setStatus(val)}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Виберіть статус" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Нове</SelectItem>
                                        <SelectItem value="processing">В обробці</SelectItem>
                                        <SelectItem value="shipped">Відправлено</SelectItem>
                                        <SelectItem value="completed">Завершено</SelectItem>
                                        <SelectItem value="cancelled">Скасовано</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="trackingNumber">Номер накладної (ТТН)</Label>
                                <Input 
                                    id="trackingNumber" 
                                    value={trackingNumber} 
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="Введіть номер ТТН"
                                />
                            </div>
                            <Button onClick={handleUpdateOrder} disabled={isUpdating} className="w-full">
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Оновити замовлення
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;
