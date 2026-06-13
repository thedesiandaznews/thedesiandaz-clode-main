import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/login/', '/search/', '/api/private/'],
    },
    sitemap: [
      'https://www.thedesiandaz.com/sitemap.xml',
      'https://www.thedesiandaz.com/news-sitemap.xml',
      'https://www.thedesiandaz.com/image-sitemap.xml'
    ],
  };
}
