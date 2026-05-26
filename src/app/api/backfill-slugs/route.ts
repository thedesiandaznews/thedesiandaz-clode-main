import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateUniqueSlug } from '@/lib/slug';

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { slug: null },
      select: { id: true, title: true }
    });
    for (const art of articles) {
      const slug = await generateUniqueSlug(art.title, async (s) => {
        const found = await prisma.article.findUnique({ where: { slug: s } });
        return !!found;
      });
      await prisma.article.update({ where: { id: art.id }, data: { slug } });
    }
    return NextResponse.json({ success: true, updated: articles.length });
  } catch (error) {
    console.error('Backfill slugs error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
