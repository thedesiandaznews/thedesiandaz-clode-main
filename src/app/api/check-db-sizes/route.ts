import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET() {
  try {
    // 1. Check PageContent sizes
    const pages = await prisma.pageContent.findMany({
      select: {
        pageSlug: true,
        content: true
      }
    });

    const pageSizes = pages.map(p => ({
      slug: p.pageSlug,
      sizeBytes: p.content ? Buffer.byteLength(p.content, 'utf8') : 0,
      sizeMB: p.content ? (Buffer.byteLength(p.content, 'utf8') / (1024 * 1024)).toFixed(2) : '0'
    }));

    // 2. Check Article count and total sizes
    const articlesCount = await prisma.article.count();
    
    // Find the largest articles
    const largeArticles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        seoDesc: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Look at the first 100 articles that the home page fetches
    });

    let totalContentSize = 0;
    const articleSizes = largeArticles.map(art => {
      const len = art.content ? Buffer.byteLength(art.content, 'utf8') : 0;
      totalContentSize += len;
      return {
        id: art.id,
        title: art.title.substring(0, 50),
        sizeBytes: len,
        sizeKB: (len / 1024).toFixed(1),
        hasSeoDesc: !!art.seoDesc
      };
    });

    // Sort by largest content size
    articleSizes.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return NextResponse.json({
      success: true,
      pageSizes,
      articlesCount,
      fetched100ArticlesTotalContentSizeMB: (totalContentSize / (1024 * 1024)).toFixed(2),
      top10LargestArticlesFetched: articleSizes.slice(0, 10)
    });
  } catch (error) {
    console.error('Check db sizes error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
