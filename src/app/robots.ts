
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://reefua.store';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/profile/', '/checkout/', '/login'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
