
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// This type should ideally be shared from a central types definition
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Timestamp;
  content: string; // We'll use this to generate an excerpt
}

// Function to generate a short excerpt from HTML content
const createExcerpt = (htmlContent: string, length = 120) => {
  const text = htmlContent.replace(/<[^>]+>/g, ''); // Strip HTML tags
  if (text.length <= length) return text;
  return text.substr(0, text.lastIndexOf(' ', length)) + '...';
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsQuery = query(
      collection(db, 'blogPosts'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, 
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as BlogPost));
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching blog posts: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Блог про морську акваріумістику</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Поради, огляди та новини зі світу рифових акваріумів від нашої команди.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="p-0">
                <Link href={`/blog/${post.slug}`} aria-label={post.title}>
                  <Image
                    src={post.coverImageUrl}
                    alt={`Обкладинка для статті "${post.title}"`}
                    width={600}
                    height={400}
                    className="object-cover w-full h-48"
                  />
                </Link>
              </CardHeader>
              <CardContent className="flex-grow p-6">
                <Badge variant="secondary" className="mb-2">{post.category}</Badge>
                <CardTitle className="text-xl font-semibold leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </CardTitle>
                <p className="mt-3 text-sm text-muted-foreground">
                  {createExcerpt(post.content)}
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-0 border-t">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('uk-UA') : ''}
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-muted-foreground">Ще немає опублікованих статей. Завітайте пізніше!</p>
        </div>
      )}
    </div>
  );
}
