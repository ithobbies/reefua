
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockCategories } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';

// export const metadata: Metadata = { // Cannot be used in client component
//   title: 'Створити новий лот - Панель Продавця',
//   description: 'Додайте новий лот для продажу на аукціоні.',
// };

interface LotFormData {
  name: string;
  description: string;
  category: string;
  startingBid: number;
  buyNowPrice?: number;
  endTime: string; // Store as string for datetime-local input
  salinity: string;
  par: string;
  flow: string;
  image?: File;
}

export default function NewLotPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<LotFormData>>({
    category: '', // Initialize category for Select
    salinity: '1.025 SG',
    par: '150-250 PAR',
    flow: 'Помірна течія',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = 'Створити новий лот - ReefUA';
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({...prev, image: undefined}));
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.name || !formData.description || !formData.category || !formData.startingBid || !formData.endTime || !formData.image) {
      toast({
        title: 'Помилка валідації',
        description: "Будь ласка, заповніть усі обов'язкові поля та завантажте зображення.",
        variant: 'destructive',
      });
      return;
    }
    console.log('Lot data submitted:', formData);
    toast({
      title: 'Лот створено!',
      description: `Лот "${formData.name}" успішно додано на аукціон.`,
    });
    // Here you would typically send data to your backend
    // Reset form or redirect user
    setFormData({
      name: '',
      description: '',
      category: '',
      startingBid: 0,
      buyNowPrice: undefined,
      endTime: '',
      salinity: '1.025 SG',
      par: '150-250 PAR',
      flow: 'Помірна течія',
      image: undefined,
    });
    setImagePreview(null);
    if (document.getElementById('image')) {
      (document.getElementById('image') as HTMLInputElement).value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/lots">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Назад до Моїх лотів</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-headline font-semibold text-primary">Створити Новий Лот</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основна інформація</CardTitle>
                <CardDescription>Надайте деталі про ваш лот.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Назва лоту*</Label>
                  <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Наприклад, Фраг Acropora Red Planet" required />
                </div>
                <div>
                  <Label htmlFor="description">Опис лоту*</Label>
                  <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Детальний опис вашого коралу, його особливості, розмір тощо." required />
                </div>
                <div>
                  <Label htmlFor="category">Категорія*</Label>
                  <Select name="category" onValueChange={handleSelectChange} value={formData.category || ''} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Оберіть категорію" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ціноутворення та аукціон</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startingBid">Стартова ціна (грн)*</Label>
                    <Input id="startingBid" name="startingBid" type="number" value={formData.startingBid || ''} onChange={handleChange} placeholder="100" min="0" step="10" required />
                  </div>
                  <div>
                    <Label htmlFor="buyNowPrice">Ціна "Купити зараз" (грн, необов'язково)</Label>
                    <Input id="buyNowPrice" name="buyNowPrice" type="number" value={formData.buyNowPrice || ''} onChange={handleChange} placeholder="500" min="0" step="10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endTime">Час завершення аукціону*</Label>
                  <Input id="endTime" name="endTime" type="datetime-local" value={formData.endTime || ''} onChange={handleChange} required 
                         min={new Date(Date.now() + 60*60*1000).toISOString().slice(0, 16)} // Min 1 hour from now
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Параметри утримання</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salinity">Солоність</Label>
                    <Input id="salinity" name="salinity" value={formData.salinity || ''} onChange={handleChange} placeholder="1.025 SG" />
                  </div>
                  <div>
                    <Label htmlFor="par">PAR</Label>
                    <Input id="par" name="par" value={formData.par || ''} onChange={handleChange} placeholder="250-350" />
                  </div>
                  <div>
                    <Label htmlFor="flow">Течія</Label>
                    <Input id="flow" name="flow" value={formData.flow || ''} onChange={handleChange} placeholder="Помірна" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Зображення лоту*</CardTitle>
                <CardDescription>Завантажте основне фото вашого лоту.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label htmlFor="image" className="block w-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-md hover:border-primary transition-colors">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="Попередній перегляд" className="max-h-48 rounded-md object-contain" />
                    ) : (
                      <>
                        <UploadCloud className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Натисніть, щоб завантажити</p>
                        <p className="text-xs text-muted-foreground">(PNG, JPG, WEBP до 5MB)</p>
                      </>
                    )}
                  </div>
                </Label>
                <Input id="image" name="image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="sr-only" required />
                
                {/* Placeholder for multiple images - could be expanded later */}
                <p className="text-xs text-muted-foreground text-center">Для додавання більше фотографій, відредагуйте лот після створення.</p>
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full text-lg py-3">
              Створити лот
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
