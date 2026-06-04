'use client';

import { useEffect } from 'react';
import { trackReferralClick } from '@/actions/affiliate';

// Helper to set cookie
function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
}

export default function ReferralTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('ref');
      const source = searchParams.get('source') || searchParams.get('utm_source');

      if (ref && ref.trim()) {
        const trimmedRef = ref.trim().toUpperCase();
        
        // Save referral code cookie for 90 days
        setCookie('tda_ref', trimmedRef, 90);

        if (source && source.trim()) {
          setCookie('tda_ref_source', source.trim(), 90);
        }

        // Call server action to log click event
        trackReferralClick(
          trimmedRef,
          source || 'Direct',
          window.location.pathname,
          null, // IP addresses are resolved on the server
          window.navigator.userAgent
        );
      }
    } catch (error) {
      console.error('Error tracking referral click:', error);
    }
  }, []);

  return null;
}
