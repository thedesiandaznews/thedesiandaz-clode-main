'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SiteMetadata() {
  const pathname = usePathname();

  useEffect(() => {
    // Load custom site preferences from localStorage
    const savedSiteName = localStorage.getItem('customSiteName');
    if (savedSiteName) {
      document.title = savedSiteName;
    }

    const savedSiteIcon = localStorage.getItem('customSiteIcon');
    if (savedSiteIcon) {
      // Force browser to update favicon by removing old ones and appending a fresh one
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.parentNode?.removeChild(link));
      
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = savedSiteIcon.startsWith('data:image/png') ? 'image/png' : 
                     savedSiteIcon.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/x-icon';
      newLink.href = savedSiteIcon;
      document.head.appendChild(newLink);
    }
  }, [pathname]); // Re-run when route changes to ensure it persists

  return null;
}
