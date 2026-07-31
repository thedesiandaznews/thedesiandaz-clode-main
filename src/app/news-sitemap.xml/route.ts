import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET() {
  const baseUrl = 'https://www.thedesiandaz.com';

  try {
    // Google News sitemaps only include articles published in the last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const articles = await prisma.article.findMany({
      where: {
        status: 'Published',
        createdAt: { gte: twoDaysAgo },
      },
      select: { id: true, slug: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Google recommends a limit of 1000 URLs
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    articles.forEach((art) => {
      const slugOrId = art.slug || art.id;
      // Escape XML characters
      const escapedTitle = art.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const pubDate = art.createdAt ? new Date(art.createdAt).toISOString() : new Date().toISOString();

      xml += `
  <url>
    <loc>${baseUrl}/news/${slugOrId}</loc>
    <news:news>
      <news:publication>
        <news:name>The Desi Andaz Media Network</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapedTitle}</news:title>
    </news:news>
  </url>`;
    });

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error generating news-sitemap.xml:', error);
    return new Response('Error generating news sitemap', { status: 500 });
  }
}
