import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { seoDesc: null },
          { seoDesc: '' }
        ]
      },
      select: { id: true, content: true }
    });

    let updatedCount = 0;
    for (const art of articles) {
      if (art.content) {
        const cleanContent = art.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 160).trim();
        if (cleanContent) {
          await prisma.article.update({
            where: { id: art.id },
            data: { seoDesc: cleanContent }
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, updated: updatedCount, totalFound: articles.length });
  } catch (error) {
    console.error('Backfill seoDesc error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
