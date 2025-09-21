
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

// Shared types and functions
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Timestamp;
  content: string;
}

type PageParams = {
  params: Promise<{ tagSlug: string }>;
};

const createExcerpt = (htmlContent: string, length = 120) => {
  const text = htmlContent.replace(/<[^>]+>/g, '');
  if (text.length <= length) return text;
  return text.substr(0, text.lastIndexOf(' ', length)) + '...';
};

// Data fetching function for this page
async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const postsRef = collection(db, 'blogPosts');
  const q = query(
    postsRef,
    where('tags', 'array-contains', tag),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
}

export default async function BlogTagPage({ params }: PageParams) {
  const { tagSlug } = await params;
  const tagName = decodeURIComponent(tagSlug);
  const posts = await getPostsByTag(tagName);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12">
        <p className="text-lg font-semibold text-primary">Тег</p>
        <h1 className="text-4xl font-headline font-bold tracking-tight">#{tagName}</h1>
      </div>

      {posts.length > 0 ? (
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
          <p className="text-lg text-muted-foreground">За цим тегом ще немає опублікованих статей.</p>
        </div>
      )}
    </div>
  );
}
