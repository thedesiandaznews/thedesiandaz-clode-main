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

    const normalizedDistricts: Record<string, string> = {
      'ranchi': 'ranchi-news',
      'dhanbad': 'dhanbad-news',
      'bokaro': 'bokaro-news',
      'eastsinghbhum': 'jamshedpur-news',
      'westsinghbhum': 'west-singhbhum-news',
      'seraikelakharsawan': 'saraikela-kharsawan-news',
      'hazaribag': 'hazaribagh-news',
      'hazaribagh': 'hazaribagh-news',
      'ramgarh': 'ramgarh-news',
      'chatra': 'chatra-news',
      'koderma': 'koderma-news',
      'giridih': 'giridih-news',
      'palamu': 'palamu-news',
      'garhwa': 'garhwa-news',
      'latehar': 'latehar-news',
      'gumla': 'gumla-news',
      'lohardaga': 'lohardaga-news',
      'simdega': 'simdega-news',
      'khunti': 'khunti-news',
      'pakur': 'pakur-news',
      'dumka': 'dumka-news',
      'deoghar': 'deoghar-news',
      'godda': 'godda-news',
      'sahibganj': 'sahibganj-news',
      'jamtara': 'jamtara-news'
    };

    // Add categories
    categories.forEach((cat) => {
      const catLower = cat.name.toLowerCase();
      let catSlug = '';
      if (catLower === 'breaking news') catSlug = 'breaking-news';
      else if (catLower === 'crime') catSlug = 'crime';
      else if (catLower === 'politics') catSlug = 'politics';
      else if (catLower === 'sports') catSlug = 'sports';
      else if (catLower === 'education') catSlug = 'education';
      else if (catLower === 'business' || catLower === 'business & finance') catSlug = 'business';
      else if (catLower === 'entertainment') catSlug = 'entertainment';

      const locUrl = catSlug ? `${baseUrl}/${catSlug}` : `${baseUrl}/latest?category=${encodeURIComponent(cat.name)}`;
      xml += `
  <url>
    <loc>${locUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add location pages
    locations.forEach((loc) => {
      if (loc.state) {
        const stateLower = loc.state.toLowerCase();
        let stateUrl = `${baseUrl}/state/${encodeURIComponent(loc.state)}`;
        if (stateLower === 'jharkhand') {
          stateUrl = `${baseUrl}/jharkhand-news`;
        }

        xml += `
  <url>
    <loc>${stateUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;

        if (loc.district) {
          const distKey = loc.district.toLowerCase().replace(/[^a-z0-9]/g, '');
          const prettySlug = normalizedDistricts[distKey];
          const distUrl = (stateLower === 'jharkhand' && prettySlug)
            ? `${baseUrl}/${prettySlug}`
            : `${baseUrl}/state/${encodeURIComponent(loc.state)}/${encodeURIComponent(loc.district)}`;

          xml += `
  <url>
    <loc>${distUrl}</loc>
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
