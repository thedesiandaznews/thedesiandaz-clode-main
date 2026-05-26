'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getNewsArticles } from '@/actions/news';
import { getCategories } from '@/actions/categories';
import { getActiveBannersByCategoryName } from '@/actions/ads';
import { stateDistricts } from '@/lib/localization';

export default function Header() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchAd, setSearchAd] = useState<any>(null);

  useEffect(() => {
    // Load live news from DB for search and ticker
    getNewsArticles({ status: 'Published' }).then(setLiveNews);
    getCategories().then(setCategories);
    
    // Fetch Global category banners to get mobile 320x50 banner
    getActiveBannersByCategoryName('Global').then(banners => {
      if (banners && banners.length > 0) {
        // Find position 4 mobile banner or fallback to any mobile banner
        const ad = banners.find(b => b.type === 'mobile' && b.position === 4);
        setSearchAd(ad || banners.find(b => b.type === 'mobile') || banners[0]);
      }
    });
  }, []);

  const searchResults = searchTerm.length > 1 
    ? liveNews.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (n.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.district.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Force light theme
    document.documentElement.setAttribute('data-theme', 'light');

    // Dynamic Clock
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const dateStr = now.toLocaleDateString('hi-IN', options);
      const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setCurrentTime(`${dateStr} | ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* SECTION 1 — TOP BAR */}
      <div className="topbar">
        <div className="container">
          <div className="topbar-left m-hide">
            <span id="liveClock">{currentTime}</span>
          </div>
          <div className="topbar-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, width: '100%' }}>
            <span style={{ 
              fontWeight: 700, 
              fontSize: '12.5px', 
              letterSpacing: '0.6px',
              background: 'linear-gradient(120deg, #aaaaaa 20%, #ffffff 50%, #aaaaaa 80%)',
              backgroundSize: '200% auto',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              animation: 'rniShimmer 3.5s linear infinite',
              display: 'inline-block',
              textAlign: 'center'
            }}>
              RNI Registration Number: JHBIL/26/A3245
            </span>
            <style>{`
              @keyframes rniShimmer {
                0% { background-position: 200% center; }
                100% { background-position: -200% center; }
              }
            `}</style>
          </div>
          <div className="topbar-right m-hide">
            <a href="https://facebook.com/thedesiandaznews" target="_blank" className="social-icon fb" title="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="https://twitter.com/thedesiandaznews" target="_blank" className="social-icon tw" title="Twitter/X"><i className="fab fa-x-twitter"></i></a>
            <a href="https://youtube.com/@thedesiandaznews" target="_blank" className="social-icon yt" title="YouTube"><i className="fab fa-youtube"></i></a>
            <a href="https://instagram.com/thedesiandaznews" target="_blank" className="social-icon ig" title="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="https://wa.me/918409659560" target="_blank" className="social-icon wa" title="WhatsApp"><i className="fab fa-whatsapp"></i></a>
          </div>
        </div>
      </div>

      {/* SECTION 2 — HEADER (STICKY) */}
      <header className="header" id="mainHeader">
        <div className="container">
          <div className="header-row1">
            <button className="hamburger-btn d-desktop-none" id="hbBtn" onClick={() => document.getElementById('mobileMenu')?.classList.add('active')}>
              <i className="fas fa-bars"></i>
            </button>

            <div className="logo">
              <Link href="/">
                <img src="/logo.png" alt="The Desi Andaz" style={{ height: '70px', width: 'auto', display: 'block' }} />
              </Link>
            </div>

            <div className="search-wrap m-hide" style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="खबर खोजें... Search news" 
                id="searchInput" 
                autoComplete="off" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
              />
              <button className="search-btn"><i className="fas fa-search"></i></button>
              
              {/* SEARCH DROPDOWN */}
              {isSearchOpen && searchTerm.length > 0 && (
                <div className="search-dropdown glass" style={{ 
                  display: 'block', 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1000, 
                  marginTop: '10px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  borderRadius: '16px',
                  padding: '10px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                  {searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <Link 
                        key={result.id} 
                        href={`/news/${result.slug || result.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchTerm('');
                        }}
                        style={{ 
                          display: 'flex', 
                          gap: '12px', 
                          padding: '12px', 
                          borderRadius: '10px', 
                          textDecoration: 'none',
                          color: 'var(--dark)',
                          transition: 'var(--transition)'
                        }}
                        className="card-hover"
                      >
                        <img src={result.imageUrl || `https://picsum.photos/50/50?random=${result.id}`} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' }} alt={result.title} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.3' }}>{result.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', marginTop: '4px' }}>
                            {result.category?.name} • {result.district}, {result.state}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray)', fontSize: '14px' }}>
                      <i className="fas fa-search-minus" style={{ fontSize: '24px', marginBottom: '10px', display: 'block' }}></i>
                      के लिए कोई परिणाम नहीं मिला: <b>&quot;{searchTerm}&quot;</b>
                    </div>
                  )}

                  {/* SEARCH AD BANNER (locked at 320x50 size only) */}
                  {searchAd && (
                    <div style={{ 
                      margin: '10px auto 4px', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      width: '100%',
                      borderTop: '1px solid rgba(229, 231, 235, 0.4)',
                      paddingTop: '10px'
                    }}>
                      {searchAd.linkUrl ? (
                        <a href={searchAd.linkUrl} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', width: '320px', height: '50px' }}>
                          <img 
                            src={searchAd.imageUrl} 
                            alt="Search Ad" 
                            style={{ width: '320px', height: '50px', objectFit: 'contain', borderRadius: '6px' }} 
                          />
                        </a>
                      ) : (
                        <img 
                          src={searchAd.imageUrl} 
                          alt="Search Ad" 
                          style={{ width: '320px', height: '50px', objectFit: 'contain', borderRadius: '6px' }} 
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Mobile Only Icons */}
              <Link href="/anonymous" className="d-desktop-none" style={{ color: 'var(--primary)', fontSize: '20px' }} title="Anonymous">
                <i className="fas fa-user-secret"></i>
              </Link>
              <Link href="/epaper" className="d-desktop-none" style={{ color: '#ff4d4d', fontSize: '20px' }}>
                <i className="fas fa-newspaper"></i>
              </Link>

              {/* Standalone Mobile Search Button */}
              <button 
                className="mobile-search-btn d-desktop-none" 
                onClick={() => document.getElementById('mobileMenu')?.classList.add('active')}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--dark)', padding: 0 }}
              >
                <i className="fas fa-search"></i>
              </button>

              <Link href="/epaper" className="btn-outline btn-epaper m-hide"><i className="fas fa-newspaper"></i> E-Paper</Link>
              <Link href="/anonymous" className="btn-yt-sub m-hide" style={{ background: 'var(--primary)', borderColor: 'var(--primary-dark)' }}><i className="fas fa-user-secret"></i> Anonymous</Link>
            </div>
          </div>
        </div>

        <div className="nav-row">
          <div className="container">
            <nav className="nav-links">
              <Link href="/" className="nav-link">Home</Link>
              
              <div className="nav-link has-dropdown">Categories ▼
                <div className="mega-menu">
                  <div className="mega-menu-title">All Categories</div>
                  <div className="mega-menu-grid">
                    {categories.map(c => (
                      <Link 
                        key={c.id} 
                        href={`/latest?category=${encodeURIComponent(c.name)}`} 
                        className="mega-menu-link"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/latest" className="nav-link">Latest News</Link>
              <Link href="https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d" className="nav-link" target="_blank" rel="noopener noreferrer">CERTIFICATE</Link>
              <div className="nav-link has-dropdown">राज्य ▼
                <div className="mega-menu">
                  <div className="mega-menu-title">अपना राज्य चुनें</div>
                  <div className="mega-menu-grid">
                    {Object.keys(stateDistricts).map(state => (
                      <Link 
                        key={state} 
                        href={`/state/${state.toLowerCase().replace(/ /g, '-')}`} 
                        className="mega-menu-link"
                      >
                        {state}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/livetv" className="nav-link">LIVE TV</Link>
              <Link href="/advertise" className="nav-link">ADVERTISE</Link>
              <Link href="/about" className="nav-link">ABOUT US</Link>
              <Link href="/contact" className="nav-link">CONTACT US</Link>
            </nav>
          </div>
        </div>
      </header>



      {/* MOBILE MENU OVERLAY */}
      <div className="mobile-menu-overlay" id="mobileMenu">
        <div className="mm-header">
          <div className="logo">
            <img src="/logo.png" alt="The Desi Andaz" style={{ height: '50px', width: 'auto' }} />
          </div>
          <button className="mm-close" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>✕</button>
        </div>
        <div className="mobile-search">
          <input type="text" placeholder="खोजें..." />
          <button><i className="fas fa-search"></i></button>
        </div>
        <div className="mm-links">
          <Link href="/" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>Home</Link>
          
          <div className="mm-link" style={{ borderBottom: 'none', paddingBottom: '8px' }}>श्रेणियाँ (Categories)</div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '10px', 
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)'
          }}>
            {categories.map(c => (
              <Link 
                key={c.id} 
                href={`/latest?category=${encodeURIComponent(c.name)}`} 
                style={{ 
                  background: 'var(--bg-alt, #f8f9fa)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '10px 8px', 
                  fontSize: '13px', 
                  color: 'var(--dark)', 
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1.2'
                }}
                onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <Link href="/latest" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>Latest News</Link>
          <Link href="https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d" className="mm-link" target="_blank" rel="noopener noreferrer" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>CERTIFICATE</Link>
          <Link href="/livetv" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>LIVE TV</Link>
          <Link href="/advertise" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>ADVERTISE WITH US</Link>

          <Link href="/epaper" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>E-Paper</Link>
          <Link href="/about" className="mm-link" onClick={() => document.getElementById('mobileMenu')?.classList.remove('active')}>ABOUT US</Link>
        </div>
      </div>
    </>
  );
}
