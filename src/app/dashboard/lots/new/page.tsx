
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
import { functions, db, app } from '@/lib/firebase'; // Import the firebase app
import { httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface LotFormData {
  name: string;
  description: string;
  category: string;
  startingBid: number;
  buyNowPrice?: number;
  endTime: string; 
  salinity: string;
  par: string;
  flow: string;
  images: string[];
}

export default function NewLotPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<Partial<LotFormData>>({
    salinity: '1.025 SG',
    par: '150-250 PAR',
    flow: 'Помірна течія',
  });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Створити новий лот - ReefUA';

    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: 'Доступ заборонено', description: 'Будь ласка, увійдіть, щоб створити лот.'});
      router.push('/auctions');
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

  }, [authLoading, user, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' && value !== '' ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, images: [] }));
    }
  };

  const uploadImage = async (): Promise<string> => {
      if (!imageFile) {
        throw new Error("Файл зображення не вибрано.");
      }
      if (!user) {
        throw new Error("Користувач не автентифікований.");
      }
      
      setIsUploading(true);
      setUploadProgress(0);

      // Get storage instance and increase the timeout
      const storage: FirebaseStorage = getStorage(app);
      storage.maxUploadRetryTime = 60000; // 60 seconds

      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `lot-images/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          }, 
          (error) => {
            console.error("Upload failed:", error);
            setIsUploading(false);
            // The toast is now handled in the catch block of handleSubmit
            reject(error);
          }, 
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setIsUploading(false);
              resolve(downloadURL);
            }).catch(error => {
               console.error("Failed to get download URL:", error);
               setIsUploading(false);
               reject(error);
            });
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
    if (!imageFile) {
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
            parameters: {
                salinity: formData.salinity,
                par: formData.par,
                flow: formData.flow,
            },
        };

        if (formData.buyNowPrice) {
            payload.buyNowPrice = formData.buyNowPrice;
        }

        const createLotFunc = httpsCallable(functions, 'createLot');
        const result: any = await createLotFunc(payload);

        toast({ title: 'Лот створено!', description: `Лот "${formData.name}" успішно додано.` });
        
        router.push(`/lot/${result.data.id}`);

    } catch (error: any) {
        console.error("Failed to create lot:", error);
        
        if (error.code === 'storage/retry-limit-exceeded') {
             toast({ variant: "destructive", title: "Помилка мережі", description: "Не вдалося завантажити зображення. Перевірте з'єднання та спробуйте ще раз." });
        } else if (error.message.includes("Користувач не автентифікований.")) {
            toast({ variant: "destructive", title: "Помилка автентифікації", description: "Схоже, ви не увійшли в систему. Будь ласка, оновіть сторінку та спробуйте ще раз." });
        } else {
             toast({ variant: "destructive", title: "Помилка створення лоту", description: "Будь ласка, перевірте дані та спробуйте ще раз." });
        }
    } finally {
        setIsSubmitting(false);
        setIsUploading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="text-center py-20">Завантаження або перенаправлення...</div>;
  }

  const isLoading = isUploading || isSubmitting;

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
         <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/lots">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <h1 className="text-2xl font.headline font-semibold text-primary">Створити Новий Лот</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Основна інформація</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Назва лоту*</Label>
                  <Input id="name" name="name" onChange={handleChange} placeholder="Наприклад, Фраг Acropora Red Planet" required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="description">Опис лоту*</Label>
                  <Textarea id="description" name="description" onChange={handleChange} placeholder="Детальний опис вашого коралу..." required disabled={isLoading} />
                </div>
                <div>
                  <Label htmlFor="category">Категорія*</Label>
                  <Select name="category" onValueChange={handleSelectChange} required disabled={isLoading || categories.length === 0}>
                    <SelectTrigger><SelectValue placeholder={categories.length > 0 ? "Оберіть категорію" : "Завантаження категорій..."} /></SelectTrigger>
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
                    <Input id="startingBid" name="startingBid" type="number" onChange={handleChange} placeholder="100" min="0" step="10" required disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="buyNowPrice">Ціна "Купити зараз" (грн)</Label>
                    <Input id="buyNowPrice" name="buyNowPrice" type="number" onChange={handleChange} placeholder="500" min="0" step="10" disabled={isLoading} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endTime">Час завершення аукціону*</Label>
                  <Input id="endTime" name="endTime" type="datetime-local" onChange={handleChange} required disabled={isLoading}
                         min={new Date(Date.now() + 60*60*1000).toISOString().slice(0, 16)} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Параметри утримання</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <Label htmlFor="salinity">Солоність</Label>
                    <Input id="salinity" name="salinity" defaultValue={formData.salinity} onChange={handleChange} placeholder="1.025 SG" disabled={isLoading}/>
                  </div>
                  <div>
                    <Label htmlFor="par">PAR</Label>
                    <Input id="par" name="par" defaultValue={formData.par} onChange={handleChange} placeholder="250-350" disabled={isLoading}/>
                  </div>
                  <div>
                    <Label htmlFor="flow">Течія</Label>
                    <Input id="flow" name="flow" defaultValue={formData.flow} onChange={handleChange} placeholder="Помірна" disabled={isLoading}/>
                  </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Зображення лоту*</CardTitle></CardHeader>
              <CardContent>
                <Label htmlFor="image" className={`block w-full cursor-pointer ${isLoading ? 'cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted rounded-md hover:border-primary transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Попередній перегляд" className="max-h-48 rounded-md object-contain" />
                    ) : (
                      <>
                        <UploadCloud className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Натисніть, щоб завантажити</p>
                      </>
                    )}
                  </div>
                </Label>
                <Input id="image" name="image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="sr-only" required disabled={isLoading}/>
                {isUploading && <div className="w-full bg-muted rounded-full h-2.5 mt-2"><div className="bg-primary h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div></div>}
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Створення лоту...' : isUploading ? 'Завантаження фото...' : 'Створити лот'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
