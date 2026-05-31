'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Fetch all settings as a key-value object
export async function getSiteSettings() {
  let settings = await prisma.siteSetting.findMany();
  
  // Proactively seed default admin credentials if the settings are empty
  const hasAdminId = settings.some(s => s.key === 'adminId');
  const hasAdminPassword = settings.some(s => s.key === 'adminPassword');
  
  if (!hasAdminId || !hasAdminPassword) {
    try {
      if (!hasAdminId) {
        await prisma.siteSetting.upsert({
          where: { key: 'adminId' },
          update: { value: 'ThedesiandazNews' },
          create: { key: 'adminId', value: 'ThedesiandazNews' }
        });
      }
      if (!hasAdminPassword) {
        await prisma.siteSetting.upsert({
          where: { key: 'adminPassword' },
          update: { value: 'Thedesiandaz@3820' },
          create: { key: 'adminPassword', value: 'Thedesiandaz@3820' }
        });
      }
      // Re-fetch after seeding
      settings = await prisma.siteSetting.findMany();
    } catch (e) {
      console.error("Failed to seed default admin settings:", e);
    }
  }

  const settingsMap: Record<string, string> = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

// Fetch a single setting
export async function getSiteSetting(key: string) {
  const setting = await prisma.siteSetting.findUnique({
    where: { key }
  });
  return setting?.value || null;
}

// Update multiple settings at once
export async function updateSiteSettings(settings: Record<string, string>) {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

// Verify admin credentials
export async function verifyAdminLogin(userId: string, password: string) {
  const settingsMap = await getSiteSettings();
  const dbId = settingsMap.adminId || 'admin';
  const dbPassword = settingsMap.adminPassword || 'admin123';
  
  if (userId === dbId && password === dbPassword) {
    return { success: true };
  }
  return { success: false };
}
