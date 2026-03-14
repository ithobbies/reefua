
import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const BASE_URL = 'https://reefua.store';

const toValidDate = (value: any): Date => {
  if (!value) return new Date();
  
  // Handle Firestore Timestamp (has toDate method or seconds property)
  if (typeof value?.toDate === 'function') {
    return value.toDate();
  }
  if (value?.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  
  // Handle Strings / Numbers
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Fallback to current date if parsing fails
  return new Date();
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  const staticRoutes = [
    '',
    '/blog',
    '/auctions',
    '/sell',
    '/rules',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Blog Posts
  const postsRef = collection(db, 'blogPosts');
  const postsQuery = query(postsRef, where('isPublished', '==', true));
  const postsSnapshot = await getDocs(postsQuery);
  
  const blogRoutes = postsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      url: `${BASE_URL}/blog/${data.slug}`,
      lastModified: toValidDate(data.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    };
  });

  // 3. Active Lots
  const lotsRef = collection(db, 'lots');
  const lotsQuery = query(lotsRef, where('status', '==', 'active'));
  const lotsSnapshot = await getDocs(lotsQuery);

  const lotRoutes = lotsSnapshot.docs.map((doc) => {
    const data = doc.data();
    // Prioritize updatedAt, fallback to createdAt
    const dateValue = data.updatedAt || data.createdAt;
    
    return {
      url: `${BASE_URL}/lot/${doc.id}`,
      lastModified: toValidDate(dateValue),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    };
  });

  return [...staticRoutes, ...blogRoutes, ...lotRoutes];
}
