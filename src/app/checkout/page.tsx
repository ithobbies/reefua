
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { functions, db } from '@/lib/firebase';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { useAuth } from '@/context/auth-context';
import type { Lot, ShippingInfo } from '@/functions/src/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const CheckoutPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [wonLots, setWonLots] = React.useState<Lot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedShipping, setSelectedShipping] = React.useState<ShippingInfo['shippingMethod'] | undefined>(undefined);
  
  // Form state
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [city, setCity] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [details, setDetails] = React.useState('');

  React.useEffect(() => {
    if (user) {
      const fetchWonLots = async () => {
        setIsLoading(true);
        try {
          const lotsQuery = query(
            collection(db, 'lots'), 
            where('winnerUid', '==', user.uid),
            where('status', '==', 'sold')
          );
          const querySnapshot = await getDocs(lotsQuery);
          const lotsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lot[];
          setWonLots(lotsData);
        } catch (error) {
          console.error("Error fetching won lots: ", error);
          toast({ title: "Помилка", description: "Не вдалося завантажити виграні лоти.", variant: "destructive" });
        }
        setIsLoading(false);
      };
      fetchWonLots();
    }
  }, [user, toast]);
  
  const handleRemoveLot = (lotId: string) => {
      setWonLots(prevLots => prevLots.filter(lot => lot.id !== lotId));
  };

  const totalAmount = wonLots.reduce((sum, lot) => sum + (lot.finalPrice || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wonLots.length === 0) {
        toast({ title: "Порожнє замовлення", description: "Будь ласка, додайте хоча б один лот.", variant: "destructive" });
        return;
    }
    if (!selectedShipping) {
      toast({ title: "Помилка валідації", description: "Будь ласка, оберіть спосіб доставки.", variant: "destructive" });
      return;
    }
    if (!user) {
         toast({ title: "Помилка", description: "Ви повинні бути авторизовані.", variant: "destructive" });
         return;
    }

    setIsSubmitting(true);

    const shippingInfo: ShippingInfo = {
      firstName,
      lastName,
      phone,
      shippingMethod: selectedShipping,
      city: showAddressFields || selectedShipping === 'other' ? city : undefined,
      department: showAddressFields ? department : undefined,
      details: selectedShipping === 'other' ? details : undefined,
    };

    try {
      const createOrder = httpsCallable(functions, 'createOrder');
      const result: HttpsCallableResult = await createOrder({
        lotIds: wonLots.map(lot => lot.id),
        shippingInfo,
      });

      const { orderIds } = result.data as { orderIds: string[] };
      router.push(`/checkout/success?orderIds=${orderIds.join(',')}`);

    } catch (error: any) {
        console.error("Order creation error:", error);
        if (error.code === 'functions/failed-precondition' && error.details) {
            const { lotId, lotName } = error.details;
            toast({ title: "Лот недоступний", description: `Лот "${lotName}" більше не доступний і був видалений з вашого замовлення.`, variant: "destructive", duration: 5000 });
            handleRemoveLot(lotId);
        } else {
            toast({ title: "Помилка оформлення замовлення", description: error.message || "Виникла невідома помилка.", variant: "destructive" });
        }
        setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
      return <div className="container mx-auto py-8 text-center">Завантаження...</div>
  }

  if (!isLoading && wonLots.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-headline font-bold mb-4">Ваш кошик порожній</h1>
        <p className="text-muted-foreground mb-6">Схоже, у вас немає виграних лотів, які очікують оформлення.</p>
        <Button asChild><a href="/auctions">До аукціонів</a></Button>
      </div>
    );
  }
  
  const showAddressFields = selectedShipping === 'nova-poshta' || selectedShipping === 'nova-poshta-courier';
  const showOtherFields = selectedShipping === 'other';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8 text-primary">Оформлення Замовлення</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Виграні лоти</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {wonLots.map((lot) => (
                <React.Fragment key={lot.id}>
                <div className="flex items-center gap-4">
                  <Image src={(lot.images && lot.images[0]) || '/placeholder.png'} alt={lot.name} width={80} height={60} className="rounded-md object-cover"/>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{lot.name}</h3>
                    <p className="text-sm text-muted-foreground">Продавець: {lot.sellerUsername}</p>
                  </div>
                  <p className="font-semibold text-primary mr-2">{(lot.finalPrice || 0).toFixed(2)} грн</p>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveLot(lot.id)}><X className="h-4 w-4"/></Button>
                </div>
                <Separator className="my-2"/>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Інформація про доставку</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Імʼя*</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ваше імʼя" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Прізвище*</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ваше прізвище" required />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Телефон*</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+380 XX XXX XX XX" required />
              </div>
              <div>
                <Label htmlFor="shipping">Спосіб доставки*</Label>
                 <Select onValueChange={(value: ShippingInfo['shippingMethod']) => setSelectedShipping(value)} value={selectedShipping} required>
                  <SelectTrigger id="shipping"><SelectValue placeholder="Оберіть спосіб доставки" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova-poshta">Нова Пошта (відділення/поштомат)</SelectItem>
                    <SelectItem value="nova-poshta-courier">Нова Пошта (курʼєр)</SelectItem>
                    <SelectItem value="pickup">Самовивіз</SelectItem>
                    <SelectItem value="other">Інший спосіб (поїзд/автобус)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {showAddressFields && (
                <>
                  <div className='mt-4'>
                    <Label htmlFor="city">Місто*</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Наприклад, Київ" required={showAddressFields} />
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="np-department">Номер відділення / Адреса*</Label>
                    <Input id="np-department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Наприклад, Відділення №15" required={showAddressFields} />
                  </div>
                </>
              )}
              {showOtherFields && (
                  <>
                    <div className='mt-4'>
                        <Label htmlFor="cityOther">Місто*</Label>
                        <Input id="cityOther" value={city} onChange={e => setCity(e.target.value)} placeholder="Наприклад, Одеса" required={showOtherFields} />
                    </div>
                    <div className="mt-4">
                        <Label htmlFor="details">Деталі доставки*</Label>
                        <Textarea id="details" value={details} onChange={e => setDetails(e.target.value)} placeholder="Автобус/поїзд, номер, час прибуття, інші деталі маршруту" required={showOtherFields} />
                    </div>
                  </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="sticky top-24">
            <CardHeader><CardTitle>Сума замовлення</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Товари ({wonLots.length} шт.):</span>
                <span>{totalAmount.toFixed(2)} грн</span>
              </div>
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>За тарифами перевізника</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Всього до сплати:</span>
                <span className="text-primary">{totalAmount.toFixed(2)} грн</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting || wonLots.length === 0}>
                {isSubmitting ? 'Оформлення...' : 'Оформити замовлення'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
