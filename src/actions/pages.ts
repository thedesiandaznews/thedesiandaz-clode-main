'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, cacheTag, updateTag } from 'next/cache';

export async function getPageContent(pageSlug: string) {
  'use cache';
  cacheTag(`page-content-${pageSlug}`);
  try {
    const page = await prisma.pageContent.findUnique({
      where: { pageSlug }
    });
    
    if (!page) return null;
    
    return {
      ...page,
      content: JSON.parse(page.content) // Parse JSON string back to object
    };
  } catch (error) {
    console.error(`Error fetching page content for ${pageSlug}:`, error);
    return null;
  }
}

export async function updatePageContent(
  pageSlug: string, 
  content: any, 
  seoData: { seoTitle?: string, seoDesc?: string, seoKeys?: string, seoImage?: string }
) {
  try {
    await prisma.pageContent.upsert({
      where: { pageSlug },
      update: {
        content: JSON.stringify(content),
        seoTitle: seoData.seoTitle,
        seoDesc: seoData.seoDesc,
        seoKeys: seoData.seoKeys,
        seoImage: seoData.seoImage
      },
      create: {
        pageSlug,
        content: JSON.stringify(content),
        seoTitle: seoData.seoTitle,
        seoDesc: seoData.seoDesc,
        seoKeys: seoData.seoKeys,
        seoImage: seoData.seoImage
      }
    });
    
    // Revalidate the page so the changes show up immediately on the frontend
    const routeMap: Record<string, string> = {
      'home': '/',
      'about': '/about',
      'contact': '/contact',
      'epaper': '/epaper',
      'anonymous': '/anonymous'
    };
    
    if (routeMap[pageSlug]) {
      revalidatePath(routeMap[pageSlug]);
    }
    
    updateTag(`page-content-${pageSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating page content:", error);
    return { success: false, error: "Failed to update page content" };
  }
}
