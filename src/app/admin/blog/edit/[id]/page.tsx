
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';
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

function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const postId = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingCoverImageUrl, setExistingCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Dynamically import the Editor component to prevent SSR issues
  const Editor = useMemo(() => 
    dynamic(() => import('@/components/ui/editor').then(mod => mod.Editor), { 
      ssr: false,
      loading: () => <Skeleton className="h-[250px] w-full" />,
    }), 
  []);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setIsFetching(true);
      const docRef = doc(db, 'blogPosts', postId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = docSnap.data();
        setTitle(postData.title);
        setContent(postData.content);
        setCategory(postData.category);
        setTags(postData.tags.join(', '));
        setIsPublished(postData.isPublished);
        setExistingCoverImageUrl(postData.coverImageUrl);
      } else {
        toast({ title: 'Помилка', description: 'Статтю не знайдено.', variant: 'destructive' });
        router.push('/admin/blog');
      }
      setIsFetching(false);
    };

    fetchPost();
  }, [postId, router, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    if (!title || !content || content === '<p></p>' || !category) {
      toast({ title: 'Помилка валідації', description: 'Заголовок, контент та категорія є обов\'язковими.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      let imageUrl = existingCoverImageUrl;
      if (coverImage) {
        const imageRef = ref(storage, `blog-covers/${uuidv4()}-${coverImage.name}`);
        const snapshot = await uploadBytes(imageRef, coverImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const postRef = doc(db, 'blogPosts', postId);
      const newSlug = slugify(title, { lower: true, strict: true });
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      await updateDoc(postRef, {
        title,
        content,
        slug: newSlug,
        category,
        tags: tagsArray,
        isPublished,
        coverImageUrl: imageUrl,
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Успіх!', description: `Статтю "${title}" було оновлено.` });
      router.push('/admin/blog');

    } catch (error) {
      console.error("Error updating blog post: ", error);
      toast({ title: 'Помилка сервера', description: 'Не вдалося оновити статтю.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4">Завантаження редактора...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-semibold text-primary">Редагування статті</h1>
        <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
                <Switch id="publish-switch" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="publish-switch">{isPublished ? 'Опубліковано' : 'Чернетка'}</Label>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Оновлення...' : 'Оновити статтю'}
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
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cover-image">Змінити зображення-обкладинку</Label>
                <Input id="cover-image" type="file" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default withAdminAuth(EditBlogPostPage);
