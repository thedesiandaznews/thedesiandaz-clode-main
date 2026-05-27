'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function SiteMetadata() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Load custom site preferences from localStorage safely
        const savedSiteName = localStorage.getItem('customSiteName');
        if (savedSiteName) {
          document.title = savedSiteName;
        }

        const savedSiteIcon = localStorage.getItem('customSiteIcon');
        if (savedSiteIcon) {
          // Force browser to update favicon safely by updating the first icon's href or creating a new one
          const existingLinks = document.querySelectorAll("link[rel*='icon']");
          if (existingLinks.length > 0) {
            existingLinks.forEach((link, idx) => {
              if (idx === 0) {
                const htmlLink = link as HTMLLinkElement;
                htmlLink.type = savedSiteIcon.startsWith('data:image/png') ? 'image/png' : 
                                savedSiteIcon.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/x-icon';
                htmlLink.href = savedSiteIcon;
              } else {
                if (link && link.parentNode) {
                  link.parentNode.removeChild(link);
                }
              }
            });
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.type = savedSiteIcon.startsWith('data:image/png') ? 'image/png' : 
                           savedSiteIcon.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/x-icon';
            newLink.href = savedSiteIcon;
            document.head.appendChild(newLink);
          }
        }
      }
    } catch (err) {
      console.error('Error setting site metadata safely:', err);
    }
  }, [pathname]); // Re-run when route changes to ensure it persists

  return null;
}
