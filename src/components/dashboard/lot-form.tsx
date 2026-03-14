
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, UploadCloud, Loader2, Info, X } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/context/auth-context';
import { functions, db, app } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import type { Lot } from '@functions/types';
import { FLOW_OPTIONS, PAR_OPTIONS, difficultyOptions } from '@/lib/options';
import { productCategories, Category, Subcategory } from '@/lib/categories-data';
import { ImageCropper } from '@/components/ui/image-cropper';
import { regionsOfUkraine, Region, City } from '@/lib/regions-data';

type SaleType = 'auction' | 'direct';

interface LotFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  region: string;
  city: string;
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

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  isNew: boolean;
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
  const { user, firestoreUser, loading: authLoading } = useAuth();
  const isEditMode = !!existingLot;
  
  // Initialize form data with existing lot data or defaults
  const [formData, setFormData] = useState<Partial<LotFormData>>(() => {
    const initialData: Partial<LotFormData> = {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      images: [],
      region: '',
      city: '',
      parameters: { difficulty: '', par: '', flow: '' },
      type: 'direct',
      durationDays: 5,
    };

    if (isEditMode && existingLot) {
      return {
        ...initialData,
        ...existingLot,
        buyNowPrice: existingLot.buyNowPrice === null ? undefined : existingLot.buyNowPrice,
        price: existingLot.price === null ? undefined : existingLot.price,
        parameters: {
          difficulty: existingLot.parameters?.difficulty || '',
          par: existingLot.parameters?.par || '',
          flow: existingLot.parameters?.flow || '',
        },
      };
    }
    
    if (!isEditMode && firestoreUser?.roles?.includes('shop')) {
      initialData.region = firestoreUser.shopRegion || '';
      initialData.city = firestoreUser.shopCity || '';
    }

    return initialData;
  });

  const [saleType, setSaleType] = useState<SaleType>(existingLot?.type || 'direct');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Image handling state
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (existingLot?.images && existingLot.images.length > 0) {
      return existingLot.images.map(url => ({
        id: uuidv4(),
        preview: url,
        isNew: false
      }));
    }
    return [];
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imgSrcToCrop, setImgSrcToCrop] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = isEditMode ? 'Редагувати лот' : 'Створити новий лот - ReefUA';

    if (!authLoading && !user) {
      toast({ variant: 'destructive', title: 'Доступ заборонено', description: 'Будь ласка, увійдіть.'});
      router.push('/auctions');
    }
    
    const currentCategorySlug = formData.category;
    if (currentCategorySlug) {
      const currentCategory = productCategories.find(cat => cat.slug === currentCategorySlug);
      if (currentCategory) {
          setSubcategories(currentCategory.subcategories);
      }
    }
    
    const currentRegionSlug = formData.region;
    if (currentRegionSlug) {
      const currentRegion = regionsOfUkraine.find(reg => reg.slug === currentRegionSlug);
      if (currentRegion) {
          setCities(currentRegion.cities);
      }
    }

  }, [authLoading, user, router, toast, isEditMode, formData.category, formData.region]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | undefined = value;

    if (type === 'number') {
        parsedValue = value === '' ? undefined : parseFloat(value);
    }
    
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
        setFormData(prev => ({ ...prev, category: value as string, subcategory: '' }));
    } else if (name === 'region') {
        const selectedRegion = regionsOfUkraine.find(reg => reg.slug === value);
        setCities(selectedRegion ? selectedRegion.cities : []);
        setFormData(prev => ({ ...prev, region: value as string, city: '' }));
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

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (images.length >= 3) {
      toast({ variant: 'destructive', title: 'Ліміт фото', description: 'Можна завантажити не більше 3 фото.' });
      return;
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setOriginalFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrcToCrop(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleCropConfirm = (croppedFile: File) => {
    const newItem: ImageItem = {
      id: uuidv4(),
      file: croppedFile,
      preview: URL.createObjectURL(croppedFile),
      isNew: true
    };
    setImages(prev => [...prev, newItem]);
    setCropModalOpen(false);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };


  const uploadImage = async (file: File): Promise<string> => {
      if (!user) throw new Error("Користувач не автентифікований.");
      
      const storage: FirebaseStorage = getStorage(app);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `lot-images/${fileName}`);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', 
          (snapshot) => {
             // We could aggregate progress here if needed, but for simplicity we'll just show activity
          }, 
          (error) => { reject(error); }, 
          () => { getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject); }
        );
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
        toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, завантажте хоча б одне зображення." });
        return;
    }

    const isAuction = saleType === 'auction';
    if (!formData.name || !formData.description || !formData.category || !formData.subcategory || !formData.region || !formData.city) {
      toast({ variant: 'destructive', title: 'Помилка валідації', description: "Будь ласка, заповніть усі обов'язкові поля." });
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
    
    setIsSubmitting(true);
    setIsUploading(true);

    try {
        // Upload new images and collect all URLs
        const imageUrls: string[] = [];
        
        for (const img of images) {
          if (img.isNew && img.file) {
            const url = await uploadImage(img.file);
            imageUrls.push(url);
          } else {
            imageUrls.push(img.preview);
          }
        }
        
        const { durationDays, ...restOfFormData } = formData;
        let payload: any = {
            ...restOfFormData,
            images: imageUrls,
            type: saleType,
            updatedAt: serverTimestamp()
        };

        if(isEditMode && existingLot) {
            const updatePayload: { [key: string]: any } = {
                name: payload.name,
                description: payload.description,
                category: payload.category,
                subcategory: payload.subcategory,
                region: payload.region,
                city: payload.city,
                images: payload.images,
                updatedAt: payload.updatedAt,
            };
            
            if (payload.category === 'corals') {
                updatePayload.parameters = payload.parameters;
            }

            if (saleType === 'auction') {
                updatePayload.startingBid = payload.startingBid || 0;
                updatePayload.buyNowPrice = payload.buyNowPrice || null;
                updatePayload.price = null; 
            } else {
                updatePayload.price = payload.price || 0;
                updatePayload.startingBid = null;
                updatePayload.buyNowPrice = null;
                updatePayload.endTime = null;
            }

            await updateDoc(doc(db, 'lots', existingLot.id), updatePayload);
            toast({ title: 'Лот оновлено!', description: `Лот "${formData.name}" успішно оновлено.` });
            router.push(`/dashboard/lots`);
        } else {
            if (payload.category !== 'corals') {
                delete payload.parameters;
            }
            if (saleType === 'auction' && durationDays) {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + durationDays);
                payload.endTime = endDate.toISOString();
            } else {
                delete payload.startingBid;
                delete payload.buyNowPrice;
            }

            const createLotFunc = httpsCallable(functions, 'createLot');
            const result: any = await createLotFunc(payload);
            toast({ title: 'Лот створено!', description: `Лот "${formData.name}" успішно додано.` });
            router.push(`/lot/${result.data.id}`);
        }

    } catch (error: any) {
        console.error(`Failed to ${isEditMode ? 'update' : 'create'} lot:`, error);
        const errorMessage = error.message || "Будь ласка, перевірте дані та спробуйте ще раз.";
        toast({ variant: "destructive", title: `Помилка ${isEditMode ? 'оновлення' : 'створення'} лоту`, description: errorMessage });
    } finally {
        setIsSubmitting(false);
        setIsUploading(false);
    }
  };

  if (authLoading || !user) return <div className="text-center py-20">Завантаження...</div>;
  const isLoading = isUploading || isSubmitting;
  const pageTitle = isEditMode ? 'Редагувати Лот' : 'Створити Новий Лот';
  const buttonText = isEditMode ? 'Зберегти зміни' : 'Створити лот';

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild><Link href="/dashboard/lots"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-2xl font-headline font-semibold text-primary">{pageTitle}</h1>
        </div>
        <form onSubmit={handleSubmit} noValidate>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="region">Область*</Label>
                            <Select name="region" value={formData.region || ''} onValueChange={(val) => handleSelectChange('region', val)} required disabled={isLoading}>
                                <SelectTrigger><SelectValue placeholder="Оберіть область" /></SelectTrigger>
                                <SelectContent>{regionsOfUkraine.map(reg => <SelectItem key={reg.slug} value={reg.slug}>{reg.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="city">Населений пункт*</Label>
                            <Select name="city" value={formData.city || ''} onValueChange={(val) => handleSelectChange('city', val)} required disabled={isLoading || cities.length === 0}>
                                <SelectTrigger><SelectValue placeholder={cities.length > 0 ? "Оберіть місто" : "Спочатку оберіть область"} /></SelectTrigger>
                                <SelectContent>{cities.map(city => <SelectItem key={city.slug} value={city.slug}>{city.name}</SelectItem>)}</SelectContent>
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
                      <RadioGroup defaultValue="direct" value={saleType} onValueChange={handleSaleTypeChange} className="flex gap-4" disabled={isEditMode}>
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
                <CardHeader>
                  <CardTitle>Зображення лоту ({images.length}/3)</CardTitle>
                  <CardDescription>Завантажте до 3 фото вашого лоту.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                        <img src={img.preview} alt="Лот" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    {images.length < 3 && (
                      <Label 
                        htmlFor="image-upload" 
                        className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-md hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground font-medium">Додати фото</span>
                      </Label>
                    )}
                  </div>
                  
                  <Input 
                    ref={fileInputRef} 
                    id="image-upload" 
                    type="file" 
                    onChange={handleImageInput} 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isLoading || images.length >= 3}
                  />
                  
                  {isUploading && (
                     <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex justify-between">
                            <span>Завантаження...</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full animate-pulse w-full"></div>
                        </div>
                     </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Підтримуються формати: PNG, JPG, WEBP. Максимальний розмір: 5MB.
                  </p>
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
      
      {cropModalOpen && imgSrcToCrop && (
        <ImageCropper
          isOpen={cropModalOpen}
          imgSrc={imgSrcToCrop}
          aspect={4 / 3}
          circularCrop={false}
          onClose={() => setCropModalOpen(false)}
          onConfirm={handleCropConfirm}
          originalFileName={originalFileName}
        />
      )}
    </>
  );
}
