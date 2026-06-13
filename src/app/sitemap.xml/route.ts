import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.thedesiandaz.com';

  try {
    // 1. Fetch all published articles
    const articles = await prisma.article.findMany({
      where: { status: 'Published' },
      select: { id: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Fetch all categories
    const categories = await prisma.category.findMany({
      select: { name: true },
    });

    // 3. Fetch all unique states and districts for regional pages
    const locations = await prisma.article.findMany({
      where: { status: 'Published' },
      select: { state: true, district: true },
      distinct: ['state', 'district'],
    });

    // Define static pages
    const staticPages = ['', 'about', 'contact', 'advertise', 'epaper', 'livetv', 'pricing'];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `
  <url>
    <loc>${baseUrl}/${page}</loc>
    <changefreq>${page === '' ? 'daily' : 'monthly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add categories
    categories.forEach((cat) => {
      xml += `
  <url>
    <loc>${baseUrl}/latest?category=${encodeURIComponent(cat.name)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add location pages
    locations.forEach((loc) => {
      if (loc.state) {
        xml += `
  <url>
    <loc>${baseUrl}/state/${encodeURIComponent(loc.state)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
        if (loc.district) {
          xml += `
  <url>
    <loc>${baseUrl}/state/${encodeURIComponent(loc.state)}/${encodeURIComponent(loc.district)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`;
        }
      }
    });

    // Add articles
    articles.forEach((art) => {
      const slugOrId = art.slug || art.id;
      const lastMod = art.updatedAt ? new Date(art.updatedAt).toISOString() : new Date().toISOString();
      xml += `
  <url>
    <loc>${baseUrl}/news/${slugOrId}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
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
    console.error('Error generating sitemap.xml:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
