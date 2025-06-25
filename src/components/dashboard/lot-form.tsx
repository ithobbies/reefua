
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/auth-context';
import { functions, db, app } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { Lot } from '@/functions/src/types';

interface LotFormData {
  name: string;
  description: string;
  category: string;
  startingBid: number;
  buyNowPrice?: number;
  endTime: string; 
  images: string[];
  parameters: {
    salinity: string;
    par: string;
    flow: string;
  };
}

interface LotFormProps {
  existingLot?: Lot | null;
}

export function LotForm({ existingLot }: LotFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isEditMode = !!existingLot;

  const [formData, setFormData] = useState<Partial<LotFormData>>({});
  
  const [categories, setCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = isEditMode ? 'Редагувати лот' : 'Створити новий лот - ReefUA';

    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: 'Доступ заборонено', description: 'Будь ласка, увійдіть.'});
      router.push('/auctions');
    }
    
    if (isEditMode && existingLot) {
        const {
            name,
            description,
            category,
            startingBid,
            buyNowPrice,
            endTime,
            images,
            parameters,
        } = existingLot;

        setFormData({
            name,
            description,
            category,
            startingBid,
            buyNowPrice,
            endTime: new Date(endTime).toISOString().slice(0, 16),
            images,
            parameters: {
                salinity: parameters?.salinity || '',
                par: parameters?.par || '',
                flow: parameters?.flow || '',
            },
        });
        
        if (existingLot.images && existingLot.images.length > 0) {
            setImagePreview(existingLot.images[0]);
        }
    } else {
        // Default values for new lot
        setFormData({
            parameters: {
              salinity: '',
              par: '',
              flow: '',
            }
        });
    }
    
    const categoriesCollection = collection(db, 'categories');
    const q = query(categoriesCollection, orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const categoriesList = snapshot.docs.map(doc => doc.data().name);
        setCategories(categoriesList);
    }, (error) => {
        console.error("Error fetching categories: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося завантажити категорії.' });
    });

    return () => unsubscribe();

  }, [authLoading, user, router, toast, isEditMode, existingLot]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
    
    if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({ 
            ...prev, 
            [parent]: {
                ...(prev as any)[parent],
                [child]: parsedValue
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string> => {
      if (!imageFile) {
        if (isEditMode && imagePreview) return imagePreview; // Return existing image if not changed
        throw new Error("Файл зображення не вибрано.");
      }
      if (!user) {
        throw new Error("Користувач не автентифікований.");
      }
      
      setIsUploading(true);
      setUploadProgress(0);

      const storage: FirebaseStorage = getStorage(app);
      storage.maxUploadRetryTime = 60000; 

      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `lot-images/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        uploadTask.on('state_changed', 
          (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100), 
          (error) => {
            console.error("Upload failed:", error);
            setIsUploading(false);
            reject(error);
          }, 
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
            setIsUploading(false);
          }
        );
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.startingBid || !formData.endTime) {
      toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, заповніть усі обов'язкові поля." });
      return;
    }
    if (!imageFile && !isEditMode) {
        toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, завантажте зображення." });
        return;
    }

    setIsSubmitting(true);

    try {
        const imageUrl = await uploadImage();
        
        const payload: any = {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            startingBid: formData.startingBid,
            endTime: new Date(formData.endTime).toISOString(),
            images: [imageUrl],
            parameters: formData.parameters,
        };

        if (formData.buyNowPrice) {
            payload.buyNowPrice = formData.buyNowPrice;
        }

        if(isEditMode && existingLot) {
            const lotRef = doc(db, 'lots', existingLot.id);
            await updateDoc(lotRef, payload);
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

  if (authLoading || !user) {
    return <div className="text-center py-20">Завантаження...</div>;
  }

  const isLoading = isUploading || isSubmitting;
  const pageTitle = isEditMode ? 'Редагувати Лот' : 'Створити Новий Лот';
  const buttonText = isEditMode ? 'Зберегти зміни' : 'Створити лот';

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/lots">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <h1 className="text-2xl font.headline font-semibold text-primary">{pageTitle}</h1>
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
                  <Input id="name" name="name" placeholder="Фраг Acropora Red Planet" value={formData.name || ''} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="description">Опис лоту*</Label>
                  <Textarea id="description" name="description" placeholder="Детальний опис вашого коралу, його особливості, розмір тощо." value={formData.description || ''} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="category">Категорія*</Label>
                  <Select name="category" value={formData.category || ''} onValueChange={handleSelectChange} required disabled={isLoading || categories.length === 0}>
                    <SelectTrigger><SelectValue placeholder={categories.length > 0 ? "Оберіть категорію" : "Завантаження..."} /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ціноутворення та аукціон</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startingBid">Стартова ціна (грн)*</Label>
                    <Input id="startingBid" name="startingBid" type="number" placeholder="100" value={formData.startingBid || ''} onChange={handleChange} required disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="buyNowPrice">Ціна "Купити зараз" (грн, необов'язково)</Label>
                    <Input id="buyNowPrice" name="buyNowPrice" type="number" placeholder="500" value={formData.buyNowPrice || ''} onChange={handleChange} disabled={isLoading} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endTime">Час завершення аукціону*</Label>
                  <Input id="endTime" name="endTime" type="datetime-local" value={formData.endTime || ''} onChange={handleChange} required disabled={isLoading} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Параметри утримання</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="salinity">Солоність</Label>
                    <Input id="salinity" name="parameters.salinity" placeholder="1.025 SG" value={formData.parameters?.salinity || ''} onChange={handleChange} disabled={isLoading}/>
                  </div>
                  <div>
                    <Label htmlFor="par">PAR</Label>
                    <Input id="par" name="parameters.par" placeholder="250-350" value={formData.parameters?.par || ''} onChange={handleChange} disabled={isLoading}/>
                  </div>
                  <div>
                    <Label htmlFor="flow">Течія</Label>
                    <Input id="flow" name="parameters.flow" placeholder="Помірна" value={formData.parameters?.flow || ''} onChange={handleChange} disabled={isLoading}/>
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
              <CardContent>
                <Label htmlFor="image" className={`block w-full cursor-pointer ${isLoading ? 'cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-md hover:border-primary transition-colors">
                    {imagePreview ? (
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
                <Input id="image" name="image" type="file" onChange={handleImageChange} accept="image/*" className="sr-only" disabled={isLoading} required={!isEditMode}/>
                {isUploading && <div className="w-full bg-muted rounded-full h-2.5 mt-2"><div className="bg-primary h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
                <p className="mt-2 text-xs text-muted-foreground text-center">Для додавання більше фотографій, відредагуйте лот після створення.</p>
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Обробка...' : buttonText}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
