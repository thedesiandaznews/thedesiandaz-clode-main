'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath, cacheTag, updateTag } from "next/cache";

// Helper function: Haversine distance calculator in kilometers
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

// ── Client CRUD Actions ──────────────────────────────────────────────────────

export async function getAdClients() {
  try {
    return await prisma.adClient.findMany({
      include: {
        ads: true
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Error fetching ad clients:", error);
    return [];
  }
}

export async function createAdClient(data: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}) {
  try {
    const client = await prisma.adClient.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
      }
    });
    revalidatePath("/admin/ads");
    return { success: true, client };
  } catch (error: any) {
    console.error("Error creating ad client:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAdClient(
  id: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }
) {
  try {
    const client = await prisma.adClient.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
      }
    });
    revalidatePath("/admin/ads");
    return { success: true, client };
  } catch (error: any) {
    console.error("Error updating ad client:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAdClient(id: string) {
  try {
    await prisma.adClient.delete({
      where: { id }
    });
    revalidatePath("/admin/ads");
    revalidatePath("/", "layout");
    updateTag('client-ads');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting ad client:", error);
    return { success: false, error: error.message };
  }
}

// ── Campaign Ads CRUD Actions ─────────────────────────────────────────────────

export async function getClientAds() {
  try {
    return await prisma.clientAd.findMany({
      include: {
        client: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching client campaigns:", error);
    return [];
  }
}

export async function createClientAd(data: {
  clientId: string;
  title: string;
  categoryName: string;
  position: number;
  desktopImgUrl?: string | null;
  mobileImgUrl?: string | null;
  linkUrl?: string | null;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  
  targetType?: string;
  targetStates?: string | null;
  targetDistricts?: string | null;
  targetLat?: number | null;
  targetLng?: number | null;
  targetRadius?: number | null;
}) {
  try {
    const ad = await prisma.clientAd.create({
      data: {
        clientId: data.clientId,
        title: data.title,
        categoryName: data.categoryName,
        position: data.position,
        desktopImgUrl: data.desktopImgUrl || null,
        mobileImgUrl: data.mobileImgUrl || null,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        
        targetType: data.targetType || "All",
        targetStates: data.targetStates || null,
        targetDistricts: data.targetDistricts || null,
        targetLat: data.targetLat || null,
        targetLng: data.targetLng || null,
        targetRadius: data.targetRadius || null,
      }
    });
    revalidatePath("/admin/ads");
    revalidatePath("/", "layout");
    updateTag('client-ads');
    return { success: true, ad };
  } catch (error: any) {
    console.error("Error creating client ad campaign:", error);
    return { success: false, error: error.message };
  }
}

export async function updateClientAd(
  id: string,
  data: {
    clientId: string;
    title: string;
    categoryName: string;
    position: number;
    desktopImgUrl?: string | null;
    mobileImgUrl?: string | null;
    linkUrl?: string | null;
    isActive?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    
    targetType?: string;
    targetStates?: string | null;
    targetDistricts?: string | null;
    targetLat?: number | null;
    targetLng?: number | null;
    targetRadius?: number | null;
  }
) {
  try {
    const ad = await prisma.clientAd.update({
      where: { id },
      data: {
        clientId: data.clientId,
        title: data.title,
        categoryName: data.categoryName,
        position: data.position,
        desktopImgUrl: data.desktopImgUrl !== undefined ? data.desktopImgUrl : undefined,
        mobileImgUrl: data.mobileImgUrl !== undefined ? data.mobileImgUrl : undefined,
        linkUrl: data.linkUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        startDate: data.startDate !== undefined ? data.startDate : undefined,
        endDate: data.endDate !== undefined ? data.endDate : undefined,
        
        targetType: data.targetType !== undefined ? data.targetType : undefined,
        targetStates: data.targetStates !== undefined ? data.targetStates : undefined,
        targetDistricts: data.targetDistricts !== undefined ? data.targetDistricts : undefined,
        targetLat: data.targetLat !== undefined ? data.targetLat : undefined,
        targetLng: data.targetLng !== undefined ? data.targetLng : undefined,
        targetRadius: data.targetRadius !== undefined ? data.targetRadius : undefined,
      }
    });
    revalidatePath("/admin/ads");
    revalidatePath("/", "layout");
    updateTag('client-ads');
    return { success: true, ad };
  } catch (error: any) {
    console.error("Error updating client ad campaign:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteClientAd(id: string) {
  try {
    await prisma.clientAd.delete({
      where: { id }
    });
    revalidatePath("/admin/ads");
    revalidatePath("/", "layout");
    updateTag('client-ads');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting client ad campaign:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleClientAdActive(id: string, isActive: boolean) {
  try {
    await prisma.clientAd.update({
      where: { id },
      data: { isActive }
    });
    revalidatePath("/admin/ads");
    revalidatePath("/", "layout");
    updateTag('client-ads');
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling client ad campaign status:", error);
    return { success: false, error: error.message };
  }
}

export async function resetClientAdStats(id: string) {
  try {
    await prisma.clientAd.update({
      where: { id },
      data: { impressions: 0, clicks: 0 }
    });
    revalidatePath("/admin/ads");
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting campaign stats:", error);
    return { success: false, error: error.message };
  }
}

// ── Dynamic Rotation and Stats Tracking Actions ──────────────────────────────

async function getCachedActiveAdsForPosition(position: number) {
  'use cache';
  cacheTag('client-ads');
  return prisma.clientAd.findMany({
    where: {
      isActive: true,
      position: position
    }
  });
}

export async function getRandomActiveAd(
  categoryName: string,
  position: number,
  userGeo?: {
    state?: string;
    district?: string;
    lat?: number;
    lng?: number;
  }
) {
  try {
    const now = new Date();
    
    // SQLite doesn't do case-insensitive lookups easily, so we filter active ads by position
    const activeAds = await getCachedActiveAdsForPosition(position);

    const targetCategory = categoryName.trim().toLowerCase();

    // 1. Filter by categoryName and dates
    const scheduledAds = activeAds.filter(ad => {
      const adCategory = ad.categoryName.trim().toLowerCase();
      if (adCategory !== targetCategory) return false;

      // Start date check
      if (ad.startDate && new Date(ad.startDate) > now) {
        return false;
      }
      
      // End date check
      if (ad.endDate && new Date(ad.endDate) < now) {
        return false;
      }

      return true;
    });

    // 2. Filter based on Geotargeting parameters
    const geotargetedAds = scheduledAds.filter(ad => {
      // General All India ads always match
      if (!ad.targetType || ad.targetType === "All") {
        return true;
      }

      // If user geo is missing but ad targets specific location, filter out
      if (!userGeo) {
        return false;
      }

      // STATE TARGETING
      if (ad.targetType === "State") {
        if (!userGeo.state || !ad.targetStates) return false;
        try {
          const states: string[] = JSON.parse(ad.targetStates);
          return states.some(st => st.trim().toLowerCase() === userGeo.state!.trim().toLowerCase());
        } catch (e) {
          console.error("Error matching state targeting", e);
          return false;
        }
      }

      // DISTRICT TARGETING
      if (ad.targetType === "District") {
        if (!userGeo.district || !ad.targetDistricts) return false;
        try {
          const districts: string[] = JSON.parse(ad.targetDistricts);
          return districts.some(dt => dt.trim().toLowerCase() === userGeo.district!.trim().toLowerCase());
        } catch (e) {
          console.error("Error matching district targeting", e);
          return false;
        }
      }

      // RADIUS GEOTARGETING (GEOFENCE)
      if (ad.targetType === "Radius") {
        if (
          userGeo.lat === undefined || 
          userGeo.lng === undefined || 
          ad.targetLat === null || 
          ad.targetLng === null || 
          ad.targetRadius === null
        ) {
          return false;
        }
        const distance = getDistanceInKm(ad.targetLat, ad.targetLng, userGeo.lat, userGeo.lng);
        return distance <= ad.targetRadius;
      }

      return false;
    });

    if (geotargetedAds.length === 0) {
      return null;
    }

    // Pick random ad campaign from matching set
    const randomIndex = Math.floor(Math.random() * geotargetedAds.length);
    return geotargetedAds[randomIndex];
  } catch (error) {
    console.error("Error fetching random active client ad:", error);
    return null;
  }
}

export async function incrementAdImpressions(adId: string) {
  try {
    await prisma.clientAd.update({
      where: { id: adId },
      data: {
        impressions: {
          increment: 1
        }
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error incrementing ad impressions:", error);
    return { success: false };
  }
}

export async function incrementAdClicks(adId: string) {
  try {
    await prisma.clientAd.update({
      where: { id: adId },
      data: {
        clicks: {
          increment: 1
        }
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error incrementing ad clicks:", error);
    return { success: false };
  }
}
