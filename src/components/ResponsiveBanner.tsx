import React from 'react';
import { getActiveBannersByCategoryName } from '@/actions/ads';
import ResponsiveBannerClient from './ResponsiveBannerClient';
import styles from './responsive-banner.module.css';

interface ResponsiveBannerProps {
  categoryName: string;
  position: number; // 1-4
  className?: string;
}

export default async function ResponsiveBanner({ categoryName, position, className = '' }: ResponsiveBannerProps) {
  // Query static fallback banners immediately on server (high-speed SSR placeholders)
  let banners = await getActiveBannersByCategoryName(categoryName);

  if ((!banners || banners.length === 0) && categoryName !== 'Global') {
    banners = await getActiveBannersByCategoryName('Global');
  }

  const desktopBanner = banners?.find(b => b.type === 'desktop' && b.position === position);
  const mobileBanner = banners?.find(b => b.type === 'mobile' && b.position === position);

  // Desktop SSR Fallback HTML
  const fallbackDesktopHtml = desktopBanner ? (
    desktopBanner.linkUrl ? (
      <a href={desktopBanner.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
        <img src={desktopBanner.imageUrl} alt={`Desktop Banner ${position}`} loading="lazy" />
      </a>
    ) : (
      <img src={desktopBanner.imageUrl} alt={`Desktop Banner ${position}`} loading="lazy" />
    )
  ) : null;

  // Mobile SSR Fallback HTML
  const fallbackMobileHtml = mobileBanner ? (
    mobileBanner.linkUrl ? (
      <a href={mobileBanner.linkUrl} target="_blank" rel="noopener noreferrer sponsored">
        <img src={mobileBanner.imageUrl} alt={`Mobile Banner ${position}`} loading="lazy" />
      </a>
    ) : (
      <img src={mobileBanner.imageUrl} alt={`Mobile Banner ${position}`} loading="lazy" />
    )
  ) : null;

  return (
    <div className={className} style={{ width: '100%' }}>
      <ResponsiveBannerClient
        categoryName={categoryName}
        position={position}
        fallbackDesktopBanner={fallbackDesktopHtml}
        fallbackMobileBanner={fallbackMobileHtml}
      />
    </div>
  );
}
