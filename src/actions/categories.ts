'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Failed to get categories', error);
    return [];
  }
}

export async function addCategory(name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false, message: 'Category name is required' };
  }

  try {
    await prisma.category.create({
      data: { name: name.trim() }
    });
    
    // Refresh the categories lists
    revalidatePath('/admin/categories');
    revalidatePath('/admin/news/add');
    return { success: true };
  } catch (error) {
    console.error('Failed to add category', error);
    return { success: false, message: 'Failed to add category. It may already exist.' };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    });
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete category', error);
    return { success: false, message: 'Failed to delete category' };
  }
}

export async function updateCategory(id: string, name: string) {
  if (!name || name.trim().length === 0) {
    return { success: false, message: 'Category name is required' };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: { name: name.trim() }
    });
    
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Failed to update category', error);
    return { success: false, message: 'Failed to update category' };
  }
}

// High-performance server action to seed standard Hindi categories
export async function seedDefaultCategoriesAction() {
  const defaultCategories = [
    'राष्ट्रीय',
    'अंतरराष्ट्रीय',
    'स्थानीय / राज्य',
    'राजनीति',
    'अपराध',
    'मनोरंजन',
    'खेल',
    'व्यापार / अर्थव्यवस्था',
    'धर्म और संस्कृति',
    'शिक्षा और करियर',
    'तकनीक और विज्ञान',
    'स्वास्थ्य और जीवनशैली'
  ];

  try {
    let createdCount = 0;
    for (const catName of defaultCategories) {
      const existing = await prisma.category.findUnique({
        where: { name: catName }
      });
      if (!existing) {
        await prisma.category.create({
          data: { name: catName }
        });
        createdCount++;
      }
    }
    
    revalidatePath('/admin/categories');
    revalidatePath('/admin/news/add');
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error('Failed to seed categories', error);
    return { success: false, message: error.message || 'Failed to seed categories' };
  }
}

