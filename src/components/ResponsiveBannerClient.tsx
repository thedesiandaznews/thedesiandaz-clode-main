'use client';

import React, { useState, useEffect } from 'react';
import { incrementAdImpressions } from '@/actions/client-ads';
import styles from './responsive-banner.module.css';

interface ResponsiveBannerClientProps {
  categoryName: string;
  position: number;
  fallbackDesktopBanner: React.ReactNode;
  fallbackMobileBanner: React.ReactNode;
}

let sharedGeoPromise: Promise<any> | null = null;

const getSharedGeo = (): Promise<any> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  
  const cached = sessionStorage.getItem('user_geo_cache');
  if (cached) {
    try {
      return Promise.resolve(JSON.parse(cached));
    } catch (e) {
      console.error(e);
    }
  }

  if (sharedGeoPromise) {
    return sharedGeoPromise;
  }

  sharedGeoPromise = fetch('https://ipapi.co/json/')
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const geo = {
          state: data.region || null,
          district: data.city || null,
          lat: data.latitude || null,
          lng: data.longitude || null
        };
        sessionStorage.setItem('user_geo_cache', JSON.stringify(geo));
        return geo;
      }
      return null;
    })
    .catch((err) => {
      console.error("Silent geolocation lookup failed, falling back to all ads", err);
      return null;
    });

  return sharedGeoPromise;
};

export default function ResponsiveBannerClient({
  categoryName,
  position,
  fallbackDesktopBanner,
  fallbackMobileBanner
}: ResponsiveBannerClientProps) {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeotargetedAd = async () => {
      try {
        const geo = await getSharedGeo();

        // Build query string
        let url = `/api/ads/serve?category=${encodeURIComponent(categoryName)}&position=${position}`;
        if (geo) {
          if (geo.state) url += `&state=${encodeURIComponent(geo.state)}`;
          if (geo.district) url += `&district=${encodeURIComponent(geo.district)}`;
          if (geo.lat) url += `&lat=${geo.lat}`;
          if (geo.lng) url += `&lng=${geo.lng}`;
        }

        const adRes = await fetch(url);
        if (adRes.ok) {
          const data = await adRes.json();
          if (data.ad) {
            setAd(data.ad);
            // Record impression asynchronously (non-blocking)
            incrementAdImpressions(data.ad.id).catch(err => 
              console.error("Error recording dynamic impression:", err)
            );
          }
        }
      } catch (err) {
        console.error("Failed to load geotargeted client ad", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeotargetedAd();
  }, [categoryName, position]);

  // While loading, render server fallback placeholders to avoid CLS (Cumulative Layout Shift)
  if (loading) {
    return (
      <div className={styles.bannerContainer}>
        <div className={styles.desktopWrapper}>{fallbackDesktopBanner}</div>
        <div className={styles.mobileWrapper}>{fallbackMobileBanner}</div>
      </div>
    );
  }

  // Renderdynamic client campaign ad if found
  if (ad) {
    const clickUrl = `/api/ads/click?id=${ad.id}`;
    const desktopImg = ad.desktopImgUrl;
    const mobileImg = ad.mobileImgUrl;

    if (!desktopImg && !mobileImg) return null;

    return (
      <div className={styles.bannerContainer}>
        {/* Desktop Version */}
        {desktopImg && (
          <div className={styles.desktopWrapper}>
            <a href={clickUrl} target="_blank" rel="noopener noreferrer sponsored">
              <img src={desktopImg} alt={ad.title} loading="lazy" />
            </a>
          </div>
        )}

        {/* Mobile Version */}
        {mobileImg && (
          <div className={styles.mobileWrapper}>
            <a href={clickUrl} target="_blank" rel="noopener noreferrer sponsored">
              <img src={mobileImg} alt={ad.title} loading="lazy" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Fallback to static slot placeholders if no geotargeted ads match
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.desktopWrapper}>{fallbackDesktopBanner}</div>
      <div className={styles.mobileWrapper}>{fallbackMobileBanner}</div>
    </div>
  );
}
