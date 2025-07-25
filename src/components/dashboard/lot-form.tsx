
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UploadCloud, Loader2, Info } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/auth-context';
import { functions, db, app } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { Lot } from '@/functions/src/types';
import { FLOW_OPTIONS, PAR_OPTIONS, difficultyOptions } from '@/lib/options';
import { productCategories, Category, Subcategory } from '@/lib/categories-data';

type SaleType = 'auction' | 'direct';

interface LotFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  parameters: {
    difficulty: string;
    par: string;
    flow: string;
  };
  type: SaleType;
  startingBid?: number;
  buyNowPrice?: number;
  durationDays?: number; 
  price?: number;
}

interface LotFormProps {
    existingLot?: Lot & { id: string };
}

// Reusable Tooltip Component with structured content
const InfoTooltip = ({ title, items }: { title: string, items: { label: string; description: string }[] }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3">
        <div className="font-bold text-foreground mb-2">{title}</div>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm">
              <span className="font-semibold text-foreground">{item.label}</span>
              <p className="text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function LotForm({ existingLot }: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isEditMode = !!existingLot;
  
  const [saleType, setSaleType] = useState<SaleType>(existingLot?.type || 'auction');
  const [formData, setFormData] = useState<Partial<LotFormData>>({
    name: existingLot?.name || '',
    description: existingLot?.description || '',
    category: existingLot?.category || '',
    subcategory: existingLot?.subcategory || '',
    images: existingLot?.images || [],
    parameters: existingLot?.parameters || { difficulty: '', par: '', flow: '' },
    type: existingLot?.type || 'auction',
    startingBid: existingLot?.startingBid,
    buyNowPrice: existingLot?.buyNowPrice,
    durationDays: existingLot?.durationDays || 5, 
    price: existingLot?.price,
  });
  
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingLot?.images?.[0] || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = isEditMode ? 'Редагувати лот' : 'Створити новий лот - ReefUA';

    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: 'Доступ заборонено', description: 'Будь ласка, увійдіть.'});
      router.push('/auctions');
    }
    
    // Pre-fill subcategories if editing an existing lot
    if (existingLot?.category) {
        const currentCategory = productCategories.find(cat => cat.slug === existingLot.category);
        if (currentCategory) {
            setSubcategories(currentCategory.subcategories);
        }
    }

  }, [authLoading, user, router, toast, isEditMode, existingLot]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
    
    if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: parsedValue }}));
    } else {
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };
  
  const handleSelectChange = (name: string, value: string | number) => {
    if (name === 'category') {
        const selectedCategory = productCategories.find(cat => cat.slug === value);
        setSubcategories(selectedCategory ? selectedCategory.subcategories : []);
        setFormData(prev => ({ ...prev, category: value as string, subcategory: '' })); // Reset subcategory
    } else if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: value }}));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSaleTypeChange = (type: SaleType) => {
      setSaleType(type);
      setFormData(prev => ({...prev, type: type}));
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string> => {
      if (!imageFile) {
        if (isEditMode && imagePreview) return imagePreview;
        throw new Error("Файл зображення не вибрано.");
      }
      if (!user) throw new Error("Користувач не автентифікований.");
      
      setIsUploading(true);
      setUploadProgress(0);

      const storage: FirebaseStorage = getStorage(app);
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `lot-images/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        uploadTask.on('state_changed', 
          (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
          (error) => { setIsUploading(false); reject(error); }, 
          () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject); setIsUploading(false); }
        );
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isAuction = saleType === 'auction';
    if (!formData.name || !formData.description || !formData.category || !formData.subcategory) {
      toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, заповніть усі обов'язкові поля, включаючи категорію та підкатегорію." });
      return;
    }
     if (isAuction && !formData.startingBid) {
        toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, вкажіть стартову ціну для аукціону." });
        return;
    }
     if (!isAuction && !formData.price) {
        toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, вкажіть ціну для прямого продажу." });
        return;
    }
    if (!imageFile && !isEditMode) {
        toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, завантажте зображення." });
        return;
    }

    setIsSubmitting(true);

    try {
        const imageUrl = await uploadImage();
        
        const { durationDays, ...restOfFormData } = formData;
        const payload: any = {
            ...restOfFormData,
            images: [imageUrl],
            type: saleType
        };

        if (payload.category !== 'corals') {
            delete payload.parameters;
        }
        
        if (!isEditMode && saleType === 'auction' && durationDays) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + durationDays);
            payload.endTime = endDate.toISOString();
        }

        if(isEditMode && existingLot) {
            await updateDoc(doc(db, 'lots', existingLot.id), payload);
            toast({ title: 'Лот оновлено!', description: `Лот "${formData.name}" успішно оновлено.` });
            router.push(`/dashboard/lots`);
        } else {
            const createLotFunc = httpsCallable(functions, 'createLot');
            const result: any = await createLotFunc(payload);
            toast({ title: 'Лот створено!', description: `Лот "${formData.name}" успішно додано.` });
            router.push(`/lot/${result.data.id}`);
        }

    } catch (error: any) {
        console.error(`Failed to ${isEditMode ? 'update' : 'create'} lot:`, error);
        toast({ variant: "destructive", title: `Помилка ${isEditMode ? 'оновлення' : 'створення'} лоту`, description: "Будь ласка, перевірте дані та спробуйте ще раз." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="text-center py-20">Завантаження...</div>;
  const isLoading = isUploading || isSubmitting;
  const pageTitle = isEditMode ? 'Редагувати Лот' : 'Створити Новий Лот';
  const buttonText = isEditMode ? 'Зберегти зміни' : 'Створити лот';

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild><Link href="/dashboard/lots"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-headline font-semibold text-primary">{pageTitle}</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Основна інформація</CardTitle><CardDescription>Надайте деталі про ваш лот.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div><Label htmlFor="name">Назва лоту*</Label><Input id="name" name="name" placeholder="Фраг Acropora Red Planet" value={formData.name || ''} onChange={handleChange} required disabled={isLoading} /></div>
                <div><Label htmlFor="description">Опис лоту*</Label><Textarea id="description" name="description" placeholder="Детальний опис вашого коралу, його особливості, розмір тощо." value={formData.description || ''} onChange={handleChange} required disabled={isLoading} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="category">Категорія*</Label>
                        <Select name="category" value={formData.category || ''} onValueChange={(val) => handleSelectChange('category', val)} required disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Оберіть категорію" /></SelectTrigger>
                            <SelectContent>{productCategories.map(cat => <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="subcategory">Підкатегорія*</Label>
                        <Select name="subcategory" value={formData.subcategory || ''} onValueChange={(val) => handleSelectChange('subcategory', val)} required disabled={isLoading || subcategories.length === 0}>
                            <SelectTrigger><SelectValue placeholder={subcategories.length > 0 ? "Оберіть підкатегорію" : "Спочатку оберіть категорію"} /></SelectTrigger>
                            <SelectContent>{subcategories.map(sub => <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Тип продажу</CardTitle>
                    {!isEditMode && <CardDescription>Виберіть, як ви хочете продати товар.</CardDescription>}
                 </CardHeader>
                <CardContent>
                    <RadioGroup value={saleType} onValueChange={handleSaleTypeChange} className="flex gap-4" disabled={isEditMode}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="auction" id="auction" />
                            <Label htmlFor="auction">Аукціон</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="direct" id="direct" />
                            <Label htmlFor="direct">Прямий продаж</Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{saleType === 'auction' ? "Налаштування аукціону" : "Ціна"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {saleType === 'auction' ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label htmlFor="startingBid">Стартова ціна (грн)*</Label><Input id="startingBid" name="startingBid" type="number" placeholder="100" value={formData.startingBid || ''} onChange={handleChange} required disabled={isLoading} /></div>
                      <div><Label htmlFor="buyNowPrice">Ціна "Купити зараз" (грн, необов'язково)</Label><Input id="buyNowPrice" name="buyNowPrice" type="number" placeholder="500" value={formData.buyNowPrice || ''} onChange={handleChange} disabled={isLoading} /></div>
                    </div>
                    {!isEditMode && (
                    <div>
                      <Label htmlFor="durationDays">Тривалість аукціону*</Label>
                       <Select name="durationDays" value={String(formData.durationDays || 5)} onValueChange={(val) => handleSelectChange('durationDays', parseInt(val, 10))} required>
                            <SelectTrigger><SelectValue placeholder="Оберіть тривалість" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3 дні</SelectItem>
                                <SelectItem value="5">5 днів</SelectItem>
                                <SelectItem value="7">7 днів</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    )}
                </>
                ) : (
                    <div><Label htmlFor="price">Ціна (грн)*</Label><Input id="price" name="price" type="number" placeholder="300" value={formData.price || ''} onChange={handleChange} required disabled={isLoading} /></div>
                )}
              </CardContent>
            </Card>
            
            {formData.category === 'corals' && (
                <Card>
                <CardHeader><CardTitle>Параметри утримання</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                        <Label htmlFor="difficulty">Складність</Label>
                        <InfoTooltip title="Складність утримання" items={difficultyOptions} />
                        </div>
                        <Select name="parameters.difficulty" value={formData.parameters?.difficulty || ''} onValueChange={(val) => handleSelectChange('parameters.difficulty', val)} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Оберіть складність" /></SelectTrigger>
                            <SelectContent>
                                {difficultyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                        <Label htmlFor="par">PAR</Label>
                        <InfoTooltip title="Рівень освітлення (PAR)" items={PAR_OPTIONS} />
                        </div>
                        <Select name="parameters.par" value={formData.parameters?.par || ''} onValueChange={(val) => handleSelectChange('parameters.par', val)} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Оберіть PAR" /></SelectTrigger>
                            <SelectContent>
                                {PAR_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                        <Label htmlFor="flow">Течія</Label>
                        <InfoTooltip title="Сила течії" items={FLOW_OPTIONS} />
                        </div>
                        <Select name="parameters.flow" value={formData.parameters?.flow || ''} onValueChange={(val) => handleSelectChange('parameters.flow', val)} disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Оберіть течію" /></SelectTrigger>
                            <SelectContent>
                                {FLOW_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                </Card>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Зображення лоту*</CardTitle><CardDescription>Завантажте основне фото вашого лоту.</CardDescription></CardHeader>
              <CardContent>
                <Label htmlFor="image" className={`block w-full cursor-pointer ${isLoading ? 'cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-md hover:border-primary transition-colors">
                    {imagePreview ? <img src={imagePreview} alt="Попередній перегляд" className="max-h-48 rounded-md object-contain" /> : (<><UploadCloud className="h-12 w-12 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Натисніть, щоб завантажити</p><p className="text-xs text-muted-foreground">(PNG, JPG, WEBP до 5MB)</p></>)}
                  </div>
                </Label>
                <Input id="image" name="image" type="file" onChange={handleImageChange} accept="image/*" className="sr-only" disabled={isLoading} required={!isEditMode}/>
                {isUploading && <div className="w-full bg-muted rounded-full h-2.5 mt-2"><div className="bg-primary h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
                <p className="mt-2 text-xs text-muted-foreground text-center">Для додавання більше фотографій, відредагуйте лот після створення.</p>
              </CardContent>
            </Card>
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? 'Обробка...' : buttonText}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
