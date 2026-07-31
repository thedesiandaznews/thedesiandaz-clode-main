import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET() {
  const baseUrl = 'https://www.thedesiandaz.com';

  try {
    const articles = await prisma.article.findMany({
      where: {
        status: 'Published',
        imageUrl: { not: null },
      },
      select: { id: true, slug: true, title: true, imageUrl: true },
      orderBy: { createdAt: 'desc' },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    articles.forEach((art) => {
      if (art.imageUrl) {
        const slugOrId = art.slug || art.id;
        const escapedTitle = art.title
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        const escapedImgUrl = art.imageUrl
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        xml += `
  <url>
    <loc>${baseUrl}/news/${slugOrId}</loc>
    <image:image>
      <image:loc>${escapedImgUrl}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>
  </url>`;
      }
    });

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error generating image-sitemap.xml:', error);
    return new Response('Error generating image sitemap', { status: 500 });
  }
}
