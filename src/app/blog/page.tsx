
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Clock, CalendarDays, ArrowRight, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

// Explicitly force dynamic rendering because we are fetching fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export const metadata: Metadata = {
  title: 'Блог про морську акваріумістику | ReefUA',
  description: 'Поради експертів, детальні огляди та останні новини зі світу рифових акваріумів.',
  openGraph: {
    title: 'Блог ReefUA',
    description: 'Все про утримання морського акваріума.',
    type: 'website',
  }
};

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

const createExcerpt = (htmlContent: string, length = 120) => {
  const text = htmlContent.replace(/<[^>]+>/g, '');
  if (text.length <= length) return text;
  return text.substring(0, text.lastIndexOf(' ', length)) + '...';
};

const calculateReadingTime = (htmlContent: string) => {
  const text = htmlContent.replace(/<[^>]+>/g, '');
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s/g).length;
  const minutes = Math.ceil(noOfWords / wordsPerMinute);
  return minutes;
};

async function getBlogPosts(): Promise<BlogPost[]> {
  const postsRef = collection(db, 'blogPosts');
  const q = query(
    postsRef,
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as BlogPost));
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const regularPosts = posts.slice(1);
  const categories = Array.from(new Set(posts.map(p => p.category))).sort();

  return (
    <div className="container mx-auto py-12 px-4 space-y-16">
      {/* Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight mb-4">
          Блог про морську акваріумістику
        </h1>
        <p className="text-lg text-muted-foreground">
          Поради експертів, детальні огляди та останні новини зі світу рифових акваріумів.
        </p>
      </div>

      {posts.length > 0 ? (
        <>
          {/* Featured Post (Hero Section) */}
          {featuredPost && (
            <section className="mb-16">
              <div className="group relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden p-6 lg:p-0">
                 <div className="lg:col-span-7 h-64 lg:h-[500px] relative overflow-hidden rounded-2xl lg:rounded-none lg:rounded-l-3xl">
                   <Link href={`/blog/${featuredPost.slug}`} className="block w-full h-full">
                    <Image
                      src={featuredPost.coverImageUrl}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                   </Link>
                   <Badge className="absolute top-4 left-4 z-10 text-sm py-1 px-3 shadow-sm">{featuredPost.category}</Badge>
                 </div>
                 <div className="lg:col-span-5 lg:p-10 flex flex-col justify-center space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                             {featuredPost.createdAt ? new Date(featuredPost.createdAt.seconds * 1000).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{calculateReadingTime(featuredPost.content)} хв читання</span>
                        </div>
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`} className="block group-hover:text-primary transition-colors">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline leading-tight">
                          {featuredPost.title}
                        </h2>
                      </Link>
                      <p className="text-muted-foreground text-lg line-clamp-3">
                        {createExcerpt(featuredPost.content, 180)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                       <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarImage src={featuredPost.authorAvatar} alt={featuredPost.authorName} />
                          <AvatarFallback>{featuredPost.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{featuredPost.authorName}</span>
                      </div>
                      <Button variant="ghost" className="group/btn" asChild>
                        <Link href={`/blog/${featuredPost.slug}`}>
                          Читати далі <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      </Button>
                    </div>
                 </div>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content - Regular Posts */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h3 className="text-2xl font-bold font-headline">Останні публікації</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {regularPosts.map((post) => (
                  <Card key={post.id} className="group flex flex-col overflow-hidden border-none shadow-none hover:bg-muted/30 transition-colors rounded-xl h-full">
                    <CardHeader className="p-0 overflow-hidden rounded-xl mb-4 relative aspect-[16/10]">
                       <Link href={`/blog/${post.slug}`}>
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </Link>
                      <Badge variant="secondary" className="absolute top-3 right-3 backdrop-blur-md bg-background/80 hover:bg-background/90 transition-colors">
                        {post.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 px-2 flex-grow space-y-3">
                       <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('uk-UA') : ''}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {calculateReadingTime(post.content)} хв</span>
                       </div>
                      <CardTitle className="text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </CardTitle>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {createExcerpt(post.content)}
                      </p>
                    </CardContent>
                    <CardFooter className="p-0 px-2 pt-4 mt-auto">
                      <div className="flex items-center space-x-2.5">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                          <AvatarFallback className="text-[10px]">{post.authorName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">{post.authorName}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar (Sticky) */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="sticky top-24 space-y-8">
                {/* Categories Widget */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Категорії</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                         <Link 
                           key={cat} 
                           href={`/blog/category/${cat}`}
                           className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm group"
                         >
                           <span className="text-foreground group-hover:text-primary transition-colors">{cat}</span>
                           <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-muted-foreground/10 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
                              {posts.filter(p => p.category === cat).length}
                           </Badge>
                         </Link>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Категорії не знайдено</p>
                    )}
                  </CardContent>
                </Card>

                {/* Newsletter / Promo Widget (Placeholder) */}
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                   <h4 className="font-bold text-lg mb-2 text-primary">Хочете продати корал?</h4>
                   <p className="text-sm text-muted-foreground mb-4">
                     Розмістіть свій лот на нашому аукціоні та знайдіть покупця вже сьогодні.
                   </p>
                   <Button className="w-full" asChild>
                     <Link href="/sell">Створити лот</Link>
                   </Button>
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : (
         <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Поки що тут пусто</h2>
            <p className="text-muted-foreground max-w-md">
              Ми готуємо для вас цікаві статті. Завітайте пізніше або підпишіться на оновлення.
            </p>
         </div>
      )}
    </div>
  );
}
