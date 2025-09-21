
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import withAdminAuth from '@/components/auth/with-admin-auth';

interface BlogPost {
  id: string;
  title: string;
  isPublished: boolean;
  category: string;
  createdAt: Timestamp;
}

function AdminBlogPage() {
  const { user, loading: userLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The HOC already ensures user and isAdmin is true, 
    // but we keep this check for safety.
    if (!user) {
        setLoading(false);
        return;
    }
    
    const postsQuery = query(
        collection(db, 'blogPosts'),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, 
        (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BlogPost));
        setPosts(postsData);
        setLoading(false);
        },
        (error) => {
        console.error("Error fetching blog posts: ", error);
        toast({
            title: "Помилка",
            description: "Не вдалося завантажити статті.",
            variant: "destructive",
        });
        setLoading(false);
        }
    );

    return () => unsubscribe();
  }, [user, toast]);

  const handleDeletePost = async (postId: string, postTitle: string) => {
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      toast({
        title: 'Успішно',
        description: `Статтю "${postTitle}" було видалено.`,
      });
    } catch (error) {
      console.error("Error deleting post: ", error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити статтю.",
        variant: "destructive",
      });
    }
  };

  // The HOC handles the main loading and auth state,
  // but we keep this internal loading for fetching posts.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-semibold text-primary">Керування блогом</h1>
        <Button asChild>
          <Link href="/admin/blog/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Створити нову статтю
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Список статей</CardTitle>
          <CardDescription>Тут ви можете редагувати, видаляти та публікувати статті.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва статті</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Категорія</TableHead>
                <TableHead>Дата створення</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length > 0 ? posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.isPublished ? 'default' : 'secondary'}>
                      {post.isPublished ? 'Опубліковано' : 'Чернетка'}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell>
                    {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/blog/edit/${post.id}`}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ця дія є незворотною. Стаття "{post.title}" буде видалена назавжди.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePost(post.id, post.title)}>
                            Так, видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">
                        Ще не створено жодної статті.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAdminAuth(AdminBlogPage);
