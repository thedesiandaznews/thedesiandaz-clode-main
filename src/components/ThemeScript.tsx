'use client';

import { useEffect } from 'react';

export default function ThemeScript() {
  useEffect(() => {
    // Clear any user-saved dark/light theme preferences
    localStorage.removeItem('theme');
    
    // Always force light theme
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return null;
}
