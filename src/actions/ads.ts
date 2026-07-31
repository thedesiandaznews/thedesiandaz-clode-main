'use server';

import prisma from "@/lib/db";
import { revalidatePath, cacheTag, updateTag } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Jimp, JimpMime } from 'jimp';

async function saveFile(file: File, categoryId: string, type: string, position: number): Promise<string> {
  const bytes = await file.arrayBuffer();
  let buffer: any = Buffer.from(bytes);

  const extension = file.name.split('.').pop() || 'png';
  const lowerExt = extension.toLowerCase();
  
  // Downscale and optimize extremely large images to prevent database bloat
  try {
    const image = await Jimp.read(buffer);
    const maxWidth = type === 'desktop' ? 1200 : 600;
    if (image.width > maxWidth) {
      const scaleFactor = maxWidth / image.width;
      image.scale(scaleFactor);
    }
    
    let mimeType: any = JimpMime.png;
    if (lowerExt === 'jpg' || lowerExt === 'jpeg') {
      mimeType = JimpMime.jpeg;
    } else if (lowerExt === 'gif') {
      mimeType = JimpMime.gif;
    } else if (lowerExt === 'bmp') {
      mimeType = JimpMime.bmp;
    } else if (lowerExt === 'tiff') {
      mimeType = JimpMime.tiff;
    }
    
    buffer = await image.getBuffer(mimeType);
  } catch (error) {
    console.error('Failed to process image with Jimp, falling back to original buffer:', error);
  }

  // Determine standard mime type for Base64 Data URL
  let mimeString = file.type || 'image/png';
  if (lowerExt === 'jpg' || lowerExt === 'jpeg') {
    mimeString = 'image/jpeg';
  } else if (lowerExt === 'gif') {
    mimeString = 'image/gif';
  } else if (lowerExt === 'png') {
    mimeString = 'image/png';
  }

  // If in Vercel/production, convert the upscaled buffer to Base64 data URL directly
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    const base64 = buffer.toString('base64');
    return `data:${mimeString};base64,${base64}`;
  }

  // Otherwise, try saving locally in development
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "banners", categoryId, type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const fileName = `pos${position}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    return `/uploads/banners/${categoryId}/${type}/${fileName}`;
  } catch (fsError: any) {
    console.warn('Local banner write failed, falling back to Base64:', fsError.message);
    const base64 = buffer.toString('base64');
    return `data:${mimeString};base64,${base64}`;
  }
}

// -- Category Actions --

export async function getAdCategories() {
  'use cache';
  cacheTag('ad-banners');
  try {
    let categories = await prisma.adCategory.findMany({
      include: {
        banners: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // If database has no ad categories, seed the default 8 categories immediately
    if (categories.length === 0) {
      console.log("No ad categories found in PostgreSQL, seeding default categories...");
      const defaults = ["Global", "Home", "Contact", "Latest", "LiveTV", "Local", "News", "State"];
      
      for (const name of defaults) {
        try {
          await prisma.adCategory.create({
            data: { name }
          });
        } catch (err) {
          console.warn(`AdCategory "${name}" might already exist:`, err);
        }
      }

      // Re-fetch categories
      categories = await prisma.adCategory.findMany({
        include: {
          banners: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return categories.map(cat => ({
      ...cat,
      banners: cat.banners.map(b => ({
        ...b,
        imageUrl: b.imageUrl && b.imageUrl.startsWith('data:') 
          ? `/api/ads/image?type=banner&id=${b.id}` 
          : b.imageUrl
      }))
    }));
  } catch (error) {
    console.error("Error fetching ad categories:", error);
    return [];
  }
}

export async function createAdCategory(name: string) {
  try {
    await prisma.adCategory.create({
      data: { name },
    });
    revalidatePath("/", "layout");
    updateTag('ad-banners');
    return { success: true };
  } catch (error: any) {
    console.error("Error creating ad category:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAdCategory(id: string, name: string) {
  try {
    await prisma.adCategory.update({
      where: { id },
      data: { name },
    });
    revalidatePath("/", "layout");
    updateTag('ad-banners');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating ad category:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAdCategory(id: string) {
  try {
    await prisma.adCategory.delete({
      where: { id },
    });
    revalidatePath("/", "layout");
    updateTag('ad-banners');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ad category:", error);
    return { success: false, error: error.message };
  }
}

// -- Banner Actions --

export async function getBannersByCategory(categoryId: string) {
  'use cache';
  cacheTag('ad-banners', `ad-banners-category-${categoryId}`);
  try {
    const banners = await prisma.banner.findMany({
      where: { categoryId },
      orderBy: [
        { type: "asc" },
        { position: "asc" }
      ]
    });
    return banners.map(b => {
      if (b.imageUrl && b.imageUrl.startsWith('data:')) {
        return { ...b, imageUrl: `/api/ads/image?type=banner&id=${b.id}` };
      }
      return b;
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

export async function getActiveBannersByCategoryName(categoryName: string) {
  'use cache';
  cacheTag('ad-banners', `ad-banners-categoryname-${categoryName}`);
  try {
    const trimmedName = categoryName.trim();
    
    const category = await prisma.adCategory.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      },
      include: {
        banners: {
          where: { isActive: true },
        },
      },
    });
    
    console.log(`Fetching active banners for category "${trimmedName}":`, category?.banners?.length ?? 0, 'banners');
    const banners = category?.banners || [];
    return banners.map(b => {
      if (b.imageUrl && b.imageUrl.startsWith('data:')) {
        return { ...b, imageUrl: `/api/ads/image?type=banner&id=${b.id}` };
      }
      return b;
    });
  } catch (error) {
    console.error("Error fetching active banners:", error);
    return [];
  }
}

export async function upsertBanner(formData: FormData) {
  try {
    const categoryId = formData.get("categoryId") as string;
    const type = formData.get("type") as string; // 'desktop' or 'mobile'
    const positionStr = formData.get("position") as string;
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const isActiveRaw = formData.get("isActive");
    const isActive = isActiveRaw === "true" || isActiveRaw === "on";
    const imageFile = formData.get("imageFile") as File;

    if (!categoryId || !type || !positionStr) {
      return { success: false, error: "Missing required fields." };
    }

    const position = parseInt(positionStr, 10);
    if (position < 1 || position > 4) {
      return { success: false, error: "Position must be between 1 and 4." };
    }

    // Check if banner exists
    const existing = await prisma.banner.findUnique({
      where: {
        categoryId_type_position: { categoryId, type, position },
      }
    });

    let imageUrl = existing?.imageUrl;

    if (imageFile && imageFile.size > 0) {
      imageUrl = await saveFile(imageFile, categoryId, type, position);
    }

    if (!imageUrl) {
      return { success: false, error: "Image is required." };
    }

    await prisma.banner.upsert({
      where: {
        categoryId_type_position: { categoryId, type, position },
      },
      update: {
        imageUrl,
        linkUrl,
        isActive,
      },
      create: {
        categoryId,
        type,
        position,
        imageUrl,
        linkUrl,
        isActive,
      }
    });

    // Revalidate the entire site so ads update on all pages
    revalidatePath("/", "layout");
    updateTag('ad-banners');
    console.log("All banners published and paths revalidated");
    return { success: true };
  } catch (error: any) {
    console.error("Error upserting banner:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBanner(id: string) {
  try {
    await prisma.banner.delete({
      where: { id },
    });
    // Revalidate the entire site so ads update on all pages
    revalidatePath("/", "layout");
    updateTag('ad-banners');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return { success: false, error: error.message };
  }
}
