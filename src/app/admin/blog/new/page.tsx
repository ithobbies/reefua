
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import withAdminAuth from '@/components/auth/with-admin-auth';
import { Skeleton } from '@/components/ui/skeleton';

const blogCategories = [
  'Обладнання',
  'Корали',
  'Риби',
  'Догляд за акваріумом',
  'Гайди для новачків',
  'Новини',
];

function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamically import the Editor component to prevent SSR issues
  const Editor = useMemo(() => 
    dynamic(() => import('@/components/ui/editor').then(mod => mod.Editor), { 
      ssr: false,
      loading: () => <Skeleton className="h-[250px] w-full" />,
    }), 
  []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    if (!title || !content || content === '<p></p>' || !category || !coverImage) {
      toast({
        title: 'Помилка валідації',
        description: 'Заголовок, контент, категорія та зображення є обов\'язковими.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const imageRef = ref(storage, `blog-covers/${uuidv4()}-${coverImage.name}`);
      const snapshot = await uploadBytes(imageRef, coverImage);
      const imageUrl = await getDownloadURL(snapshot.ref);

      const slug = slugify(title, { lower: true, strict: true });
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await addDoc(collection(db, 'blogPosts'), {
        title,
        content,
        slug,
        category,
        tags: tagsArray,
        isPublished,
        coverImageUrl: imageUrl,
        authorId: user.uid,
        authorName: user.displayName || 'Admin',
        authorAvatar: user.photoURL || '/default-avatar.png',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Успіх!',
        description: `Статтю "${title}" було успішно створено.`,
      });

      router.push('/admin/blog');

    } catch (error) {
      console.error("Error creating blog post: ", error);
      toast({
        title: 'Помилка сервера',
        description: 'Не вдалося зберегти статтю.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-semibold text-primary">Створення нової статті</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch id="publish-switch" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="publish-switch">{isPublished ? 'Опубліковано' : 'Чернетка'}</Label>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Збереження...' : 'Зберегти статтю'}
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Основний контент</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок статті</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Як доглядати за SPS коралами" />
              </div>
              <div>
                <Label>Зміст статті</Label>
                <Editor content={content} onChange={setContent} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>Параметри публікації</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Категорія</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Виберіть категорію" /></SelectTrigger>
                  <SelectContent>
                    {blogCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Теги (через кому)</Label>
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sps, lps, догляд" />
              </div>
              <div>
                <Label htmlFor="cover-image">Зображення-обкладинка</Label>
                <Input id="cover-image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default withAdminAuth(NewBlogPostPage);
