'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockWonLots, type Lot } from '@/lib/mock-data';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Metadata } from 'next';
import React from 'react';

// export const metadata: Metadata = { // Cannot be used in client component
//   title: 'Оформлення замовлення - ReefUA',
//   description: 'Перевірте ваше замовлення та виберіть спосіб оплати і доставки.',
// };


const CheckoutPage = () => {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = React.useState<string | undefined>(undefined);
  const [selectedShipping, setSelectedShipping] = React.useState<string | undefined>(undefined);

  const totalAmount = mockWonLots.reduce((sum, lot) => sum + (lot as any).wonPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !selectedShipping) {
      toast({
        title: "Помилка валідації",
        description: "Будь ласка, оберіть спосіб оплати та доставки.",
        variant: "destructive",
      });
      return;
    }
    // Process checkout
    toast({
      title: "Замовлення оформлено!",
      description: `Дякуємо! Загальна сума: ${totalAmount} грн. Очікуйте на підтвердження.`,
    });
  };
  
  if (mockWonLots.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-headline font-bold mb-4">Ваш кошик порожній</h1>
        <p className="text-muted-foreground mb-6">Схоже, ви ще не виграли жодного лоту.</p>
        <Button asChild>
          <a href="/">До аукціонів</a>
        </Button>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold mb-8 text-primary">Оформлення Замовлення</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Виграні лоти</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockWonLots.map((lot) => (
                <React.Fragment key={lot.id}>
                <div className="flex items-center gap-4">
                  <Image src={lot.imageUrl} alt={lot.name} width={80} height={60} className="rounded-md object-cover" data-ai-hint={lot.dataAiHint || "coral"}/>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{lot.name}</h3>
                    <p className="text-sm text-muted-foreground">Продавець: {lot.seller}</p>
                  </div>
                  <p className="font-semibold text-primary">{(lot as any).wonPrice} грн</p>
                </div>
                <Separator className="my-2"/>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Інформація про доставку</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Імʼя</Label>
                  <Input id="firstName" placeholder="Ваше імʼя" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input id="lastName" placeholder="Ваше прізвище" required />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" type="tel" placeholder="+380 XX XXX XX XX" required />
              </div>
              <div>
                <Label htmlFor="shipping">Спосіб доставки</Label>
                 <Select onValueChange={setSelectedShipping} value={selectedShipping}>
                  <SelectTrigger id="shipping">
                    <SelectValue placeholder="Оберіть спосіб доставки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nova-poshta">Нова Пошта (відділення/поштомат)</SelectItem>
                    <SelectItem value="mist-express">Міст-Експрес (відділення)</SelectItem>
                    <SelectItem value="nova-poshta-courier">Нова Пошта (курʼєр)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedShipping && selectedShipping.includes('nova-poshta') && (
                <div>
                  <Label htmlFor="city">Місто</Label>
                  <Input id="city" placeholder="Наприклад, Київ" required />
                  <Label htmlFor="np-department" className="mt-2 block">Номер відділення/поштомату Нової Пошти</Label>
                  <Input id="np-department" placeholder="Наприклад, Відділення №15" required />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card className="sticky top-24"> {/* For sticky summary card */}
            <CardHeader>
              <CardTitle>Сума замовлення</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Товари ({mockWonLots.length} шт.):</span>
                <span>{totalAmount} грн</span>
              </div>
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>За тарифами перевізника</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Всього до сплати:</span>
                <span className="text-primary">{totalAmount} грн</span>
              </div>
              
              <h3 className="font-semibold mt-6 mb-2">Спосіб оплати:</h3>
              <RadioGroup onValueChange={setSelectedPayment} value={selectedPayment} className="space-y-2">
                {[
                  { value: 'liqpay', label: 'LiqPay (Visa/Mastercard)' },
                  { value: 'fondy', label: 'Fondy (Visa/Mastercard/GooglePay)' },
                  { value: 'monopay', label: 'MonoPay' },
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted has-[:checked]:bg-secondary has-[:checked]:border-primary">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-grow cursor-pointer">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full text-lg py-3">Оплатити {totalAmount} грн</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
