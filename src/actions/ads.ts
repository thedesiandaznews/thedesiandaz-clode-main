'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Jimp, JimpMime } from 'jimp';

async function saveFile(file: File, categoryId: string, type: string, position: number): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners", categoryId, type);
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const extension = file.name.split('.').pop() || 'png';
  const fileName = `pos${position}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);

  try {
    // Read the uploaded image using Jimp
    const image = await Jimp.read(buffer);
    
    // Scale/upscale by 5X for absolute high-definition quality
    image.scale(5);
    
    // Determine target MIME type based on file extension
    let mimeType: any = JimpMime.png;
    const lowerExt = extension.toLowerCase();
    if (lowerExt === 'jpg' || lowerExt === 'jpeg') {
      mimeType = JimpMime.jpeg;
    } else if (lowerExt === 'gif') {
      mimeType = JimpMime.gif;
    } else if (lowerExt === 'bmp') {
      mimeType = JimpMime.bmp;
    } else if (lowerExt === 'tiff') {
      mimeType = JimpMime.tiff;
    }
    
    // Retrieve the high-quality 5X upscaled buffer
    const upscaledBuffer = await image.getBuffer(mimeType);
    
    // Save the upscaled buffer
    await writeFile(filePath, upscaledBuffer);
  } catch (error) {
    console.error('Failed to upscale image with Jimp, falling back to original buffer:', error);
    // Safe fallback to original uploaded buffer in case of processing error
    await writeFile(filePath, buffer);
  }
  
  return `/uploads/banners/${categoryId}/${type}/${fileName}`;
}

// -- Category Actions --

export async function getAdCategories() {
  try {
    return await prisma.adCategory.findMany({
      include: {
        banners: true,
      },
      orderBy: { createdAt: "desc" },
    });
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
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ad category:", error);
    return { success: false, error: error.message };
  }
}

// -- Banner Actions --

export async function getBannersByCategory(categoryId: string) {
  try {
    return await prisma.banner.findMany({
      where: { categoryId },
      orderBy: [
        { type: "asc" },
        { position: "asc" }
      ]
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return [];
  }
}

export async function getActiveBannersByCategoryName(categoryName: string) {
  try {
    const trimmedName = categoryName.trim().toLowerCase();
    
    // SQLite doesn't support mode: 'insensitive', so we fetch all and filter in JS
    const allCategories = await prisma.adCategory.findMany({
      include: {
        banners: {
          where: { isActive: true },
        },
      },
    });
    
    const category = allCategories.find(c => c.name.trim().toLowerCase() === trimmedName);
    
    console.log(`Fetching active banners for category "${trimmedName}":`, category?.banners?.length ?? 0, 'banners');
    return category?.banners || [];
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
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting banner:", error);
    return { success: false, error: error.message };
  }
}
