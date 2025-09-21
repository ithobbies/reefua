
import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import type { Metadata } from 'next';
import CommentForm from '@/components/blog/comment-form';
import CommentsList from '@/components/blog/comments-list';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  category: string;
  authorName: string;
  authorAvatar: string;
  createdAt: Timestamp;
  tags: string[];
  content: string;
}

type PageParams = {
  params: Promise<{ slug: string }>;
};

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const postsRef = collection(db, 'blogPosts');
  const q = query(
    postsRef,
    where('slug', '==', slug),
    where('isPublished', '==', true),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() } as BlogPost;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Статтю не знайдено' };
  
  const excerpt = post.content.replace(/<[^>]+>/g, '').substring(0, 155);
  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: post.title,
      description: excerpt,
      images: [{ url: post.coverImageUrl, width: 1200, height: 630, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <article>
        <header className="mb-8">
          <div className="mb-4">
            <Badge variant="secondary">{post.category}</Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary leading-tight tracking-tight">
            {post.title}
          </h1>
          <div className="mt-6 flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.authorName}</p>
                <p className="text-muted-foreground">
                  {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('uk-UA') : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-8">
          <Image
            src={post.coverImageUrl}
            alt={`Обкладинка для статті "${post.title}"`}
            width={1200}
            height={600}
            className="object-cover w-full rounded-lg shadow-md"
            priority
          />
        </div>

        <div
          className="prose dark:prose-invert max-w-none prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <div className="mt-12">
          <h3 className="text-2xl font-semibold mb-4">Теги</h3>
          <div className="flex flex-wrap gap-2">
              {post.tags && post.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
          </div>
        </div>
      </article>
      
      <div className="mt-16 border-t pt-8">
        <h2 className="text-3xl font-bold mb-6">Коментарі</h2>
        <div className="space-y-8">
          <CommentForm postId={post.id} />
          <CommentsList postId={post.id} />
        </div>
      </div>
    </div>
  );
}
