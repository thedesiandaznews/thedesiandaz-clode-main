'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getCompanyApprovedNews() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: {
          in: [
            'Company Approved',
            'Website Published',
            'Sent To Print',
            'Print Approved',
            'Print Published'
          ]
        }
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return articles.map(art => ({
      ...art,
      imageUrl: art.imageUrl && art.imageUrl.startsWith('data:')
        ? `/api/news/image?id=${art.id}`
        : art.imageUrl
    }));
  } catch (error) {
    console.error('Error fetching company approved news for print:', error);
    return [];
  }
}

export async function updateArticlePrintLayout(
  articleId: string,
  data: {
    printPage?: number | null;
    printHeadline?: string | null;
    isPrintSelected?: boolean;
    status?: string;
  }
) {
  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: {
        printPage: data.printPage !== undefined ? data.printPage : undefined,
        printHeadline: data.printHeadline !== undefined ? data.printHeadline : undefined,
        isPrintSelected: data.isPrintSelected !== undefined ? data.isPrintSelected : undefined,
        status: data.status !== undefined ? data.status : undefined,
      }
    });

    revalidatePath('/admin/print');
    revalidatePath('/admin/news');
    return { success: true, article: updated };
  } catch (error: any) {
    console.error('Error updating print layout for article:', error);
    return { success: false, message: error.message || 'Failed to update print layout.' };
  }
}

export async function publishPrintEdition(articleIds: string[]) {
  try {
    await prisma.article.updateMany({
      where: { id: { in: articleIds } },
      data: { status: 'Print Published' }
    });

    revalidatePath('/admin/print');
    revalidatePath('/admin/news');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error publishing print edition:', error);
    return { success: false, message: error.message || 'Failed to publish print edition.' };
  }
}
