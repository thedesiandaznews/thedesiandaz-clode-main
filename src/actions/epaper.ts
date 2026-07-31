'use server';

import { revalidatePath, cacheTag, updateTag } from 'next/cache';
import prisma from '@/lib/db';

export async function getEpapers(filters?: { date?: string }) {
  'use cache';
  cacheTag('epaper');
  try {
    const where: any = {};
    if (filters?.date) {
      const parts = filters.date.split('-').map(Number);
      if (parts.length === 3 && parts.every(num => !isNaN(num))) {
        const [year, month, day] = parts;
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        where.date = { gte: startOfDay, lte: endOfDay };
      }
    }

    return await prisma.epaper.findMany({
      where,
      orderBy: { date: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching epapers:', error);
    return [];
  }
}

export async function addEpaper(data: {
  title?: string;
  date: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  pages?: string;
}) {
  try {
    const [year, month, day] = data.date.split('-').map(Number);
    const paperDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    
    // Check if entry for this date already exists
    const existing = await prisma.epaper.findUnique({
      where: { date: paperDate }
    });

    if (existing) {
      await prisma.epaper.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          pdfUrl: data.pdfUrl,
          thumbnailUrl: data.thumbnailUrl,
          pages: data.pages
        }
      });
    } else {
      await prisma.epaper.create({
        data: {
          title: data.title,
          date: paperDate,
          pdfUrl: data.pdfUrl,
          thumbnailUrl: data.thumbnailUrl,
          pages: data.pages
        }
      });
    }

    revalidatePath('/admin/epaper');
    revalidatePath('/epaper');
    updateTag('epaper');
    return { success: true };
  } catch (error) {
    console.error('Failed to save epaper:', error);
    return { success: false, message: 'Failed to save E-Paper.' };
  }
}

export async function deleteEpaper(id: string) {
  try {
    await prisma.epaper.delete({
      where: { id }
    });
    revalidatePath('/admin/epaper');
    revalidatePath('/epaper');
    updateTag('epaper');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete epaper:', error);
    return { success: false };
  }
}
