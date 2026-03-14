
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from 'firebase/firestore';
import type { Metadata } from 'next';
import CommentForm from '@/components/blog/comment-form';
import CommentsList from '@/components/blog/comments-list';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CalendarDays, Clock, Share2, ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

async function getRelatedPosts(currentId: string): Promise<BlogPost[]> {
   const postsRef = collection(db, 'blogPosts');
   const q = query(
     postsRef,
     where('isPublished', '==', true),
     orderBy('createdAt', 'desc'),
     limit(4)
   );
   const querySnapshot = await getDocs(q);
   return querySnapshot.docs
     .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
     .filter(post => post.id !== currentId)
     .slice(0, 3);
}

const calculateReadingTime = (htmlContent: string) => {
  const text = htmlContent.replace(/<[^>]+>/g, '');
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s/g).length;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return minutes;
};

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

  const relatedPosts = await getRelatedPosts(post.id);
  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      {/* Navigation Breadcrumb / Back Button */}
      <div className="mb-6 md:mb-8">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary pl-0 md:pl-4">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" /> До списку статей
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
            <article className="bg-card border shadow-sm rounded-xl p-5 md:p-10 mb-8">
                {/* Header */}
                <header className="mb-6 md:mb-8 space-y-4 md:space-y-6">
                  <Badge variant="secondary" className="px-3 py-1 text-sm">{post.category}</Badge>
                  <h1 className="text-2xl md:text-5xl font-headline font-bold text-primary leading-tight tracking-tight">
                    {post.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-6 text-muted-foreground">
                     <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 border">
                        <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                        <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{post.authorName}</p>
                      </div>
                    </div>
                    <div className="h-4 md:h-8 w-[1px] bg-border hidden sm:block"></div>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                        <CalendarDays className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('uk-UA') : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{readingTime} хв читання</span>
                    </div>
                  </div>
                </header>

                {/* Cover Image */}
                <div className="mb-6 md:mb-10 rounded-xl overflow-hidden shadow-sm aspect-video relative">
                  <Image
                    src={post.coverImageUrl}
                    alt={`Обкладинка для статті "${post.title}"`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Mobile Table of Contents (Collapsed) */}
                <div className="lg:hidden mb-8 border rounded-lg bg-muted/30">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="toc" className="border-none">
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
                        Зміст статті
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                         <TableOfContents contentSelector="#blog-content" />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Content */}
                <div id="blog-content" 
                  className="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-img:rounded-xl prose-headings:font-headline prose-a:text-primary hover:prose-a:underline break-words"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                {/* Tags & Share */}
                <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
                  <div className="flex flex-wrap gap-2">
                      {post.tags && post.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-muted-foreground hover:bg-secondary transition-colors">#{tag}</Badge>
                      ))}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                      <Share2 className="h-4 w-4" /> Поділитися
                  </Button>
                </div>
            </article>

            {/* Comments Section */}
            <div className="bg-card border shadow-sm rounded-xl p-5 md:p-10">
               <h3 className="text-xl md:text-2xl font-bold font-headline mb-6 md:mb-8">Коментарі</h3>
               <div className="space-y-6 md:space-y-8">
                  <CommentForm postId={post.id} />
                  <Separator />
                  <CommentsList postId={post.id} />
               </div>
            </div>
        </div>

        {/* Sidebar (Desktop) */}
        <aside className="lg:col-span-4 space-y-8 hidden lg:block">
            {/* Table of Contents Widget */}
            <TableOfContents contentSelector="#blog-content" />

             <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
               <h4 className="font-bold text-lg mb-2 text-primary">Сподобалась стаття?</h4>
               <p className="text-sm text-muted-foreground mb-4">
                 Приєднуйтесь до нас в Telegram, щоб не пропустити нові матеріали та аукціони.
               </p>
               <Button className="w-full" variant="outline" asChild>
                  <a href="https://t.me/reefua" target="_blank" rel="noopener noreferrer">Підписатися на Telegram</a>
               </Button>
            </div>
        </aside>
      </div>

      {/* Related Posts Section (Bottom) */}
      {relatedPosts.length > 0 && (
        <section className="mt-16 md:mt-24 pt-8 md:pt-12 border-t">
          <div className="flex items-center justify-between mb-6 md:mb-8">
             <h2 className="text-2xl md:text-3xl font-bold font-headline">Читайте також</h2>
             <Button variant="ghost" asChild>
                <Link href="/blog">Всі статті <ArrowRight className="ml-2 h-4 w-4" /></Link>
             </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map(related => (
               <Card key={related.id} className="group flex flex-col h-full hover:shadow-md transition-shadow">
                  <CardHeader className="p-0 overflow-hidden rounded-t-xl aspect-[16/10] relative">
                     <Link href={`/blog/${related.slug}`}>
                        <Image 
                           src={related.coverImageUrl} 
                           alt={related.title} 
                           fill 
                           className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                     </Link>
                  </CardHeader>
                  <CardContent className="flex-grow p-5 space-y-3">
                     <Badge variant="secondary" className="text-xs">{related.category}</Badge>
                     <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${related.slug}`}>{related.title}</Link>
                     </CardTitle>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                         <CalendarDays className="h-3 w-3" />
                         <span>{related.createdAt ? new Date(related.createdAt.seconds * 1000).toLocaleDateString('uk-UA') : ''}</span>
                     </div>
                  </CardContent>
               </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
