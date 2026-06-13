'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsSidebarOpen(false); // Auto-close sidebar drawer when navigating to a new page
    setIsNavigating(false); // Done navigating!
    
    // Simple mock auth check
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (!isLoggedIn && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  // If we are on login page, don't show sidebar/header
  if (pathname === '/admin/login') {
    return <div className={styles.adminLayout}>{children}</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    router.push('/admin/login');
  };

  const startNavigation = () => {
    setIsNavigating(true);
  };

  if (!mounted) return null; // Prevent hydration errors

  return (
    <div className={styles.adminLayout}>
      {/* Translucent Backdrop Overlay (visible on mobile when sidebar is active) */}
      {isSidebarOpen && (
        <div 
          className={styles.sidebarOverlay} 
          onClick={() => setIsSidebarOpen(false)}
          title="Click to close sidebar"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>TDA<span style={{ color: '#111827' }}> Admin</span></div>
          {/* Close Sidebar button for mobile viewports */}
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(false)} 
            className={styles.sidebarClose}
            aria-label="Close sidebar menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <nav className={styles.navMenu}>
          <Link href="/admin" onClick={startNavigation} className={`${styles.navItem} ${pathname === '/admin' ? styles.navItemActive : ''}`}>
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/news" onClick={startNavigation} className={`${styles.navItem} ${pathname === '/admin/news' ? styles.navItemActive : ''}`}>
            <i className="fas fa-newspaper"></i>
            <span>News Management</span>
          </Link>
          <Link href="/admin/correspondents" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/reporters') || pathname?.includes('/admin/correspondents') ? styles.navItemActive : ''}`}>
            <i className="fas fa-id-card"></i>
            <span>संवाददाता KYC</span>
          </Link>
          <Link href="/admin/news-moderation" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/news-moderation') ? styles.navItemActive : ''}`}>
            <i className="fas fa-gavel"></i>
            <span>News Moderation</span>
          </Link>
          <Link href="/admin/print" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/print') ? styles.navItemActive : ''}`}>
            <i className="fas fa-print"></i>
            <span>Print Edition</span>
          </Link>
          <Link href="/admin/logs" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/logs') ? styles.navItemActive : ''}`}>
            <i className="fas fa-history"></i>
            <span>Activity Logs</span>
          </Link>
          <Link href="/admin/anonymous" onClick={startNavigation} className={`${styles.navItem} ${pathname === '/admin/anonymous' ? styles.navItemActive : ''}`}>
            <i className="fas fa-user-secret"></i>
            <span>Anonymous Accounts KYC</span>
          </Link>
          <Link href="/admin/submissions" onClick={startNavigation} className={`${styles.navItem} ${pathname === '/admin/submissions' ? styles.navItemActive : ''}`}>
            <i className="fas fa-inbox"></i>
            <span>Citizen Reports</span>
          </Link>
          <Link href="/admin/categories" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/categories') ? styles.navItemActive : ''}`}>
            <i className="fas fa-tags"></i>
            <span>Categories</span>
          </Link>
          <Link href="/admin/pages" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/pages') ? styles.navItemActive : ''}`}>
            <i className="fas fa-file-code"></i>
            <span>Page Editor & SEO</span>
          </Link>
          <Link href="/admin/ads" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/ads') ? styles.navItemActive : ''}`}>
            <i className="fas fa-ad"></i>
            <span>Ads Management</span>
          </Link>
          <Link href="/advertise" className={styles.navItem} target="_blank">
            <i className="fas fa-external-link-alt"></i>
            <span>B2B Landing Page</span>
          </Link>
          <Link href="/admin/advertiser" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/advertiser') ? styles.navItemActive : ''}`}>
            <i className="fas fa-bullhorn"></i>
            <span>Advertiser Panel</span>
          </Link>
          <Link href="/admin/affiliates" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/affiliates') ? styles.navItemActive : ''}`}>
            <i className="fas fa-handshake"></i>
            <span>Affiliates</span>
          </Link>
          <Link href="/admin/epaper" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/epaper') ? styles.navItemActive : ''}`}>
            <i className="fas fa-file-pdf"></i>
            <span>E-Paper</span>
          </Link>
          <Link href="/admin/livetv" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/livetv') ? styles.navItemActive : ''}`}>
            <i className="fas fa-tv"></i>
            <span>Live TV Management</span>
          </Link>
          <Link href="/admin/settings" onClick={startNavigation} className={`${styles.navItem} ${pathname?.includes('/admin/settings') ? styles.navItemActive : ''}`}>
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Workspace Wrapper */}
      <div className={styles.mainWrapper}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            {/* Hamburger Toggle Button visible only on mobile/tablet viewports */}
            <button 
              type="button"
              onClick={() => setIsSidebarOpen(true)} 
              className={styles.sidebarToggle}
              aria-label="Open sidebar menu"
            >
              <i className="fas fa-bars"></i>
            </button>
            <span className={styles.headerPortalTitle}>Super Admin Portal</span>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.adminProfile}>
              <div className={styles.avatar}>A</div>
              <span className={styles.adminProfileName}>Admin User</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <i className="fas fa-sign-out-alt"></i> <span className={styles.logoutBtnText}>Logout</span>
            </button>
          </div>
        </header>

        <main className={styles.contentArea} style={{ position: 'relative' }}>
          {isNavigating && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              minHeight: '80vh',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              transition: 'all 0.3s ease'
            }}>
              <div className="fas fa-circle-notch fa-spin" style={{ fontSize: '36px', color: '#ef4444' }}></div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', letterSpacing: '0.5px' }}>
                कृपया प्रतीक्षा करें... (Loading Workspace...)
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
