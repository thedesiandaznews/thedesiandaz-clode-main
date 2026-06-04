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

  useEffect(() => {
    setMounted(true);
    setIsSidebarOpen(false); // Auto-close sidebar drawer when navigating to a new page
    
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
          <Link href="/admin" className={`${styles.navItem} ${pathname === '/admin' ? styles.navItemActive : ''}`}>
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/news" className={`${styles.navItem} ${pathname === '/admin/news' ? styles.navItemActive : ''}`}>
            <i className="fas fa-newspaper"></i>
            <span>News Management</span>
          </Link>
          <Link href="/admin/reporters" className={`${styles.navItem} ${pathname?.includes('/admin/reporters') ? styles.navItemActive : ''}`}>
            <i className="fas fa-id-card"></i>
            <span>Reporter KYC</span>
          </Link>
          <Link href="/admin/news-moderation" className={`${styles.navItem} ${pathname?.includes('/admin/news-moderation') ? styles.navItemActive : ''}`}>
            <i className="fas fa-gavel"></i>
            <span>News Moderation</span>
          </Link>
          <Link href="/admin/anonymous" className={`${styles.navItem} ${pathname === '/admin/anonymous' ? styles.navItemActive : ''}`}>
            <i className="fas fa-user-secret"></i>
            <span>Anonymous Accounts KYC</span>
          </Link>
          <Link href="/admin/submissions" className={`${styles.navItem} ${pathname === '/admin/submissions' ? styles.navItemActive : ''}`}>
            <i className="fas fa-inbox"></i>
            <span>Citizen Reports</span>
          </Link>
          <Link href="/admin/categories" className={`${styles.navItem} ${pathname?.includes('/admin/categories') ? styles.navItemActive : ''}`}>
            <i className="fas fa-tags"></i>
            <span>Categories</span>
          </Link>
          <Link href="/admin/pages" className={`${styles.navItem} ${pathname?.includes('/admin/pages') ? styles.navItemActive : ''}`}>
            <i className="fas fa-file-code"></i>
            <span>Page Editor & SEO</span>
          </Link>
          <Link href="/admin/ads" className={`${styles.navItem} ${pathname?.includes('/admin/ads') ? styles.navItemActive : ''}`}>
            <i className="fas fa-ad"></i>
            <span>Ads Management</span>
          </Link>
          <Link href="/advertise" className={styles.navItem} target="_blank">
            <i className="fas fa-external-link-alt"></i>
            <span>B2B Landing Page</span>
          </Link>
          <Link href="/admin/advertiser" className={`${styles.navItem} ${pathname?.includes('/admin/advertiser') ? styles.navItemActive : ''}`}>
            <i className="fas fa-bullhorn"></i>
            <span>Advertiser Panel</span>
          </Link>
          <Link href="/admin/affiliates" className={`${styles.navItem} ${pathname?.includes('/admin/affiliates') ? styles.navItemActive : ''}`}>
            <i className="fas fa-handshake"></i>
            <span>Affiliates</span>
          </Link>
          <Link href="/admin/epaper" className={`${styles.navItem} ${pathname?.includes('/admin/epaper') ? styles.navItemActive : ''}`}>
            <i className="fas fa-file-pdf"></i>
            <span>E-Paper</span>
          </Link>
          <Link href="/admin/livetv" className={`${styles.navItem} ${pathname?.includes('/admin/livetv') ? styles.navItemActive : ''}`}>
            <i className="fas fa-tv"></i>
            <span>Live TV Management</span>
          </Link>
          <Link href="/admin/settings" className={`${styles.navItem} ${pathname?.includes('/admin/settings') ? styles.navItemActive : ''}`}>
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

        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
