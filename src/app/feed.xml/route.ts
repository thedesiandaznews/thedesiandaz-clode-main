import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://www.thedesiandaz.com';

  try {
    const articles = await prisma.article.findMany({
      where: { status: 'Published' },
      select: { id: true, slug: true, title: true, content: true, seoDesc: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit feed items to last 50 published articles
    });

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>The Desi Andaz Media Network</title>
    <link>${baseUrl}</link>
    <description>देसी नज़रिया, सच्ची खबर - Premium Hindi News Portal</description>
    <language>hi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

    articles.forEach((art) => {
      const slugOrId = art.slug || art.id;
      const escapedTitle = art.title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const descClean = art.seoDesc || (art.content ? art.content.replace(/<[^>]*>/g, '').substring(0, 200).trim() + '...' : '');
      const escapedDesc = descClean
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      xml += `
    <item>
      <title>${escapedTitle}</title>
      <link>${baseUrl}/news/${slugOrId}</link>
      <guid isPermaLink="true">${baseUrl}/news/${slugOrId}</guid>
      <pubDate>${new Date(art.createdAt).toUTCString()}</pubDate>
      <description>${escapedDesc}</description>
      <content:encoded><![CDATA[${art.content}]]></content:encoded>
    </item>`;
    });

    xml += `
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error generating feed.xml:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
