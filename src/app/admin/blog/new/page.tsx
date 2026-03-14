'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import withAdminAuth from '@/components/auth/with-admin-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';

const blogCategories = [
  'Обладнання',
  'Корали',
  'Риби',
  'Догляд за акваріумом',
  'Гайди для новачків',
  'Новини',
];

const formSchema = z.object({
  title: z.string().min(5, { message: "Заголовок повинен містити мінімум 5 символів" }),
  slug: z.string().min(3, { message: "Slug обов'язковий і повинен бути унікальним" }),
  content: z.string().min(50, { message: "Контент занадто короткий (мінімум 50 символів)" }),
  excerpt: z.string().optional(),
  category: z.string({ required_error: "Будь ласка, виберіть категорію" }),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically import Editor
  const Editor = useMemo(() => 
    dynamic(() => import('@/components/ui/editor').then(mod => mod.Editor), { 
      ssr: false,
      loading: () => <Skeleton className="h-[400px] w-full" />,
    }), 
  []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      tags: [],
      isPublished: false,
    },
  });

  // Warn before unload if form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.formState.isDirty]);

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('title', e.target.value, { shouldValidate: true });
    
    // Only auto-update slug if it hasn't been manually touched yet or is empty
    if (!form.getFieldState('slug').isDirty || !form.getValues('slug')) {
      const slug = slugify(e.target.value, { lower: true, strict: true });
      form.setValue('slug', slug);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Помилка",
          description: "Файл занадто великий. Максимальний розмір 5MB.",
          variant: "destructive"
        });
        return;
      }
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setCoverImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    // Reset file input value if needed (requires ref usually, but simple state is okay here)
  };

  // Tag handling
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !form.getValues('tags').includes(newTag)) {
        const currentTags = form.getValues('tags');
        form.setValue('tags', [...currentTags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({ title: "Помилка", description: "Ви не авторизовані", variant: "destructive" });
      return;
    }

    if (!coverImage) {
      toast({
        title: "Зображення відсутнє",
        description: "Будь ласка, завантажте обкладинку для статті.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Image
      const imageRef = ref(storage, `blog-covers/${uuidv4()}-${coverImage.name}`);
      const snapshot = await uploadBytes(imageRef, coverImage);
      const imageUrl = await getDownloadURL(snapshot.ref);

      // 2. Save Document
      await addDoc(collection(db, 'blogPosts'), {
        ...values,
        coverImageUrl: imageUrl,
        authorId: user.uid,
        authorName: user.displayName || 'Admin',
        authorAvatar: user.photoURL || '/default-avatar.png',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0, 
      });

      toast({
        title: 'Успіх!',
        description: `Статтю "${values.title}" успішно створено.`,
      });

      router.push('/admin/blog');
    } catch (error) {
      console.error("Error creating blog post: ", error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти статтю. Спробуйте пізніше.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Нова стаття</h1>
            <p className="text-muted-foreground mt-1">Створіть та опублікуйте новий контент для блогу.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-card">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {field.value ? 'Опубліковано' : 'Чернетка'}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Збереження...' : 'Зберегти статтю'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Основна інформація</CardTitle>
                <CardDescription>Заголовок, текст та наповнення статті.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заголовок статті</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введіть заголовок..." 
                          {...field} 
                          onChange={handleTitleChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Зміст</FormLabel>
                      <FormControl>
                        <div className="min-h-[400px] border rounded-md">
                           <Editor content={field.value} onChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 
                 <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Короткий опис (Excerpt)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Короткий опис для відображення в списку статей..." 
                          className="h-24 resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Відображається на картці статті та в результатах пошуку (SEO).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 space-y-8">
             <Card>
              <CardHeader>
                <CardTitle>Медіа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <FormLabel>Обкладинка</FormLabel>
                  {previewUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <img 
                        src={previewUrl} 
                        alt="Cover preview" 
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="cover-upload" 
                      className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <span className="text-sm font-medium">Завантажити фото</span>
                      </div>
                      <input 
                        id="cover-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                  {!coverImage && (
                    <p className="text-xs text-muted-foreground text-center">
                      PNG, JPG або WebP. Макс. 5MB.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Налаштування</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="url-statti" {...field} />
                      </FormControl>
                      <FormDescription>Унікальний ідентифікатор в URL адресі.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категорія</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Виберіть категорію" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {blogCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Теги</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введіть тег і натисніть Enter..." 
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                        />
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {field.value.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1 gap-1">
                            {tag}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>Натисніть Enter або кому, щоб додати тег.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

export default withAdminAuth(NewBlogPostPage);
