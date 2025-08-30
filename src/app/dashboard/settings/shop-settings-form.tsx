
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { Loader2 } from 'lucide-react';
import { regions } from '@/lib/regions-data';

export function ShopSettingsForm() {
    const { firestoreUser, loading } = useAuth();
    const { toast } = useToast();

    const [phone, setPhone] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Встановлюємо початкові значення, коли дані користувача завантажені
    useEffect(() => {
        if (firestoreUser) {
            setPhone(firestoreUser.shopPhoneNumber || '');
            setSelectedRegion(firestoreUser.shopRegion || '');
            setSelectedCity(firestoreUser.shopCity || '');
        }
    }, [firestoreUser]);

    const cities = useMemo(() => {
        const regionData = regions.find(r => r.slug === selectedRegion);
        return regionData ? regionData.cities : [];
    }, [selectedRegion]);
    
    // Скидуємо місто, якщо змінилася область
    useEffect(() => {
        if (cities.length > 0 && !cities.find(c => c.slug === selectedCity)) {
            setSelectedCity('');
        }
    }, [cities, selectedCity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const updateShopSettings = httpsCallable(functions, 'updateShopSettings');
            await updateShopSettings({
                shopPhoneNumber: phone,
                shopRegion: selectedRegion,
                shopCity: selectedCity,
            });
            toast({ title: "Успіх!", description: "Налаштування вашого магазину оновлено." });
        } catch (error: any) {
            console.error("Error updating shop settings:", error);
            toast({ variant: "destructive", title: "Помилка", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Card><CardHeader><CardTitle>Завантаження...</CardTitle></CardHeader></Card>
    }

    // Форма рендериться, але буде показана тільки на батьківському компоненті, якщо роль 'shop'
    return (
        <Card>
            <CardHeader>
                <CardTitle>Налаштування магазину</CardTitle>
                <CardDescription>
                    Ця інформація буде автоматично додаватися до ваших нових оголошень.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="shop-phone">Публічний номер телефону</Label>
                        <Input 
                            id="shop-phone" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+380..." 
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="shop-region">Область за замовчуванням</Label>
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger><SelectValue placeholder="Оберіть область" /></SelectTrigger>
                                <SelectContent>
                                    {regions.map(region => (
                                        <SelectItem key={region.slug} value={region.slug}>{region.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="shop-city">Місто / НП за замовчуванням</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedRegion}>
                                <SelectTrigger><SelectValue placeholder="Спочатку оберіть область" /></SelectTrigger>
                                <SelectContent>
                                    {cities.map(city => (
                                        <SelectItem key={city.slug} value={city.slug}>{city.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Зберегти налаштування
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
