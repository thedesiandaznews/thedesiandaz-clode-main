import LocationBar from '@/components/LocationBar';
import Link from 'next/link';
import styles from './page.module.css';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import TrendingTicker from '@/components/TrendingTicker';
import PersonalizedLocalNews from '@/components/PersonalizedLocalNews';
import { getPageContent } from '@/actions/pages';
import BlockRenderer from '@/components/BlockRenderer';
import { stripHtml } from '@/lib/utils';
import { getSiteSettings } from '@/actions/settings';
import HomeMediaWidget from '@/components/HomeMediaWidget';
import { Metadata } from 'next';

export const revalidate = 60; // Cache page for 60 seconds, revalidate on demand or in background

export const metadata: Metadata = {
  title: 'Jharkhand News | Breaking News | Hindi News | The Desi Andaz Media Network',
  description: 'Latest Jharkhand News, Hindi News, Breaking News, Ranchi News, Dhanbad News, Bokaro News, Jamshedpur News, Santhal Pargana News and Public Interest Stories from The Desi Andaz Media Network.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/',
  },
};

export default async function Home() {
  const pageData = await getPageContent('home');
  const pageContent = pageData?.content || {};

  // Fetch settings for Featured Media
  const settings = await getSiteSettings();
  const featuredVideoTitle = settings.featuredVideoTitle || 'ताज़ा वीडियो बुलेटिन';
  const featuredVideoUrl = settings.featuredVideoUrl || '';
  const featuredVideoThumb = settings.featuredVideoThumb || null;
  const featuredPodcastTitle = settings.featuredPodcastTitle || 'विशेष पॉडकास्ट एपिसोड';
  const featuredPodcastUrl = settings.featuredPodcastUrl || '';
  const featuredPodcastThumb = settings.featuredPodcastThumb || null;

  if (pageContent.editorMode === 'drag-and-drop') {
    return (
      <div className={styles.page} style={{ padding: '20px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <BlockRenderer blocks={pageContent.blocks || []} />
        </div>
      </div>
    );
  }

  // Fetch live published news from Database
  const publishedNews = (await getNewsArticles({ status: 'Published', limit: 100 })) || [];
  
  // Sort by latest
  const latestNews = [...publishedNews].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  // Distribute data for different sections
  const topStory = latestNews.length > 0 ? latestNews[0] : null;
  const subNews = latestNews.slice(1, 4); // 3 items under hero
  
  // Trending News: Top 5 most viewed articles
  const trendingNews = [...publishedNews]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  
  // Exclude Top 5 from the rest of the layout to avoid duplicates
  const remainingNews = latestNews.slice(5);

  // Group news by category (including additionalCategories)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryGroups = latestNews.reduce((acc: any, n: any) => {
    // Add to primary category
    const catName = n.category?.name;
    if (catName) {
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(n);
    }
    
    // Add to all additional categories
    if (n.additionalCategories && n.additionalCategories.length > 0) {
      n.additionalCategories.forEach((addCat: { name: string }) => {
        const addCatName = addCat.name;
        if (addCatName) {
          if (!acc[addCatName]) acc[addCatName] = [];
          // Avoid pushing duplicate if it somehow matches primary
          if (!acc[addCatName].find((item: { id: string }) => item.id === n.id)) {
            acc[addCatName].push(n);
          }
        }
      });
    }
    
    return acc;
  }, {});

  // Custom Order defined by User (We will iterate this directly to guarantee all sections render)
  const categoryOrder = [
    'Breaking News',
    'India',
    'Jharkhand News',
    'Politics',
    'Education',
    'Sports',
    'Business & Finance',
    'Automobile',
    'Entertainment',
    'Religion & Culture',
    'Technology',
    'Agriculture',
    'Weather',
    'Jobs & Career',
    'Lifestyle'
  ];

  // Fallback for Live TV
  const liveTv = {
    title: 'LIVE न्यूज़ देखें',
    description: 'देश और दुनिया की हर खबर अब सीधे आपके स्क्रीन पर। बिना रुके, बिना थके। 24x7 Coverage.',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/livetv'
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "The Desi Andaz Media Network",
    "url": "https://www.thedesiandaz.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.thedesiandaz.com/logo.png"
    },
    "sameAs": [
      "https://facebook.com/thedesiandaznews",
      "https://twitter.com/thedesiandaznews",
      "https://youtube.com/@thedesiandaznews",
      "https://instagram.com/thedesiandaznews"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-8409659560",
      "contactType": "editorial desk",
      "email": "info@thedesiandaz.com",
      "areaServed": "IN",
      "availableLanguage": ["Hindi", "English"]
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "The Desi Andaz Media Network",
    "image": "https://www.thedesiandaz.com/logo.png",
    "telephone": "+91-8409659560",
    "email": "info@thedesiandaz.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Near Everett Mission School Dhanush Puja, Gokulpur",
      "addressLocality": "Pakur",
      "addressRegion": "Jharkhand",
      "postalCode": "816107",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 24.6335,
      "longitude": 87.8285
    },
    "url": "https://www.thedesiandaz.com",
    "priceRange": "$$",
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Jharkhand"
    }
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {/* ── LOCATION BAR ── */}
      <LocationBar />

      {/* ── TRENDING TICKER ── */}
      <TrendingTicker news={latestNews.slice(0, 10)} />

      {/* ── TOP BILLBOARD AD (Position 1) ── */}
      <div className={styles.container}>
        <div className={styles.adContainer}>
          <ResponsiveBanner categoryName="Home" position={1} />
        </div>
      </div>

      {/* ── REDESIGNED HERO SECTION (Aaj Tak Style - Same to Same) ── */}
      <section className={styles.heroRedesign}>
        <div className={styles.container}>
          <div className={styles.heroThreeColumnGrid}>
            
            {/* COLUMN 1: Main Story (occupies about 50% width) */}
            <div className={styles.mainStoryCol}>
              {topStory ? (
                <Link href={`/news/${topStory.slug || topStory.id}`} className={styles.mainStoryLink}>
                  <h1 className={styles.mainStoryTitle}>
                    {topStory.title}
                  </h1>
                  <div className={styles.mainStoryImgWrap}>
                    <img
                      src={topStory.imageUrl || `https://picsum.photos/800/500?random=${topStory.id}`}
                      alt={topStory.title}
                      className={styles.mainStoryImg}
                    />
                  </div>
                  <p className={styles.mainStoryCaption}>
                    {topStory.content ? stripHtml(topStory.content).slice(0, 240) + '...' : ''}
                  </p>
                </Link>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '4px' }}>
                  <h2>खबरें उपलब्ध नहीं हैं</h2>
                  <p>कृपया एडमिन पैनल से खबरें जोड़ें।</p>
                </div>
              )}
            </div>

            {/* COLUMN 2: Superfast News (occupies about 25% width) */}
            <div className={styles.superfastCol}>
              <div className={styles.superfastHeader}>
                <span className={styles.superfastTitle}>⚡ सुपरफास्ट न्यूज़</span>
              </div>
              <div className={styles.superfastList}>
                {latestNews.slice(1, 6).length > 0 ? (
                  latestNews.slice(1, 6).map((n: any) => (
                    <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.superfastItem}>
                      <img 
                        src={n.imageUrl || `https://picsum.photos/100/75?random=${n.id}`} 
                        alt="" 
                        className={styles.superfastThumb} 
                        loading="lazy"
                      />
                      <div className={styles.superfastText}>{n.title}</div>
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    कोई अन्य खबर उपलब्ध नहीं है।
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: Right Sidebar (Ad + Video tabs + Google news fav) */}
            <div className={styles.sidebarCol}>
              {/* ADVERTISEMENT WIDGET */}
              <div className={styles.adWidget}>
                <div className={styles.adLabel}>ADVERTISEMENT</div>
                <div className={styles.adContent}>
                  <ResponsiveBanner categoryName="Home" position={2} />
                </div>
              </div>

              {/* VIDEO TABS WIDGET */}
              <HomeMediaWidget 
                featuredVideoTitle={featuredVideoTitle}
                featuredVideoUrl={featuredVideoUrl}
                featuredVideoThumb={featuredVideoThumb}
                featuredPodcastTitle={featuredPodcastTitle}
                featuredPodcastUrl={featuredPodcastUrl}
                featuredPodcastThumb={featuredPodcastThumb}
                defaultThumbnail={topStory?.imageUrl || "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3"}
              />

            </div>

          </div>

          {/* BOTTOM STORIES GRID (aligned under Left + Middle columns) */}
          {latestNews.slice(6, 15).length > 0 && (
            <div className={styles.bottomHeroGridWrap}>
              <div className={styles.bottomHeroGrid}>
                {latestNews.slice(6, 15).map((n: any) => (
                  <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.bottomHeroItem}>
                    <img 
                      src={n.imageUrl || `https://picsum.photos/120/90?random=${n.id}`} 
                      alt="" 
                      className={styles.bottomHeroThumb} 
                      loading="lazy"
                    />
                    <div className={styles.bottomHeroText}>{n.title}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── PERSONALIZED LOCAL NEWS ── */}
      <section className={styles.blockSection} style={{ background: 'var(--bg-alt, #f8f9fa)' }}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📍 अपने शहर की खबर</h2>
            <Link href="/local" className={styles.sectionViewAll}>झारखंड लोकल <i className="fas fa-arrow-right"></i></Link>
          </div>
          {/* We pass all news to the personalized component so it can filter by district */}
          <PersonalizedLocalNews initialNews={latestNews} />
        </div>
      </section>

      {/* ── ALL CATEGORIES (Aaj Tak Layout Styles) ── */}
      {categoryOrder.map((categoryName, index) => {
        const articles = categoryGroups[categoryName] || [];
        
        // Define layout style based on category
        let layoutStyle = 'B'; // Default is layout B (grid)
        if (['India', 'Jharkhand News', 'Politics', 'Breaking News', 'Agriculture'].includes(categoryName)) {
          layoutStyle = 'A'; // Split classic
        } else if (['Entertainment', 'Sports', 'Religion & Culture', 'Lifestyle'].includes(categoryName)) {
          layoutStyle = 'C'; // Visual photo card
        }

        // Section Title Left Red Accent Header rendering
        const sectionHeader = (
          <div className={styles.sectionHeaderRedAccent}>
            <h2 className={styles.sectionTitleRedBar}>{categoryName}</h2>
            <Link href={`/latest?category=${encodeURIComponent(categoryName)}`} className={styles.sectionViewAll}>
              और पढ़ें <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        );

        return (
          <div key={categoryName}>
            <section className={styles.blockSection} style={{ background: index % 2 === 0 ? 'var(--bg)' : 'var(--bg-alt, #f9fafb)' }}>
              <div className={styles.container}>
                {sectionHeader}

                {/* LAYOUT A: SPLIT CLASSIC (60% / 40%) */}
                {layoutStyle === 'A' && (
                  articles.length > 0 ? (
                    <div className={styles.sectionSplitGrid}>
                      
                      {/* Left: Large Featured Article */}
                      <div className={styles.sectionSplitLeft}>
                        {articles[0] && (
                          <Link href={`/news/${articles[0].slug || articles[0].id}`} className={styles.splitFeaturedCard}>
                            <div className={styles.splitFeaturedImgWrap}>
                              <img 
                                src={articles[0].imageUrl || `https://picsum.photos/600/350?random=${articles[0].id}`} 
                                alt={articles[0].title} 
                                className={styles.splitFeaturedImg} 
                                loading="lazy"
                              />
                            </div>
                            <div className={styles.splitFeaturedBody}>
                              <div className={styles.splitFeaturedMeta}>
                                <span>{articles[0].category?.name}</span>
                                <span>•</span>
                                <span>{articles[0].district || 'लोकल'}</span>
                              </div>
                              <h3 className={styles.splitFeaturedTitle}>{articles[0].title}</h3>
                              <p className={styles.splitFeaturedText}>
                                {articles[0].content ? stripHtml(articles[0].content).slice(0, 160) + '...' : ''}
                              </p>
                            </div>
                          </Link>
                        )}
                      </div>

                      {/* Right: Vertical List of next 4 articles */}
                      <div className={styles.sectionSplitRight}>
                        {articles.slice(1, 5).map((n: any) => (
                          <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.splitListItem}>
                            <img 
                              src={n.imageUrl || `https://picsum.photos/100/75?random=${n.id}`} 
                              alt="" 
                              className={styles.splitListThumb} 
                              loading="lazy"
                            />
                            <div className={styles.splitListText}>{n.title}</div>
                          </Link>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                      इस श्रेणी में अभी कोई खबर नहीं है।
                    </div>
                  )
                )}

                {/* LAYOUT B: PREMIUM 3-COLUMN GRID (Exactly 6 Articles) */}
                {layoutStyle === 'B' && (
                  articles.length > 0 ? (
                    <div className={styles.grid9}>
                      {articles.slice(0, 6).map((n: any) => (
                        <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.newsCard}>
                          <div className={styles.cardImgWrap}>
                            <img src={n.imageUrl || `https://picsum.photos/400/250?random=${n.id}`} alt={n.title} className={styles.cardImg} loading="lazy" />
                          </div>
                          <div className={styles.cardBody}>
                            <div className={styles.cardMeta}>{n.category?.name}</div>
                            <div className={styles.cardTitle}>{n.title}</div>
                            <div className={styles.cardFooter}>
                              {n.createdAt && !isNaN(new Date(n.createdAt).getTime()) ? new Date(n.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : ''}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                      इस श्रेणी में अभी कोई खबर नहीं है।
                    </div>
                  )
                )}

                {/* LAYOUT C: MEDIA VISUAL PHOTO CARDS */}
                {layoutStyle === 'C' && (
                  articles.length > 0 ? (
                    <div className={styles.mediaGrid}>
                      {articles.slice(0, 4).map((n: any) => (
                        <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.mediaCard}>
                          <div className={styles.mediaImgWrap}>
                            <img 
                              src={n.imageUrl || `https://picsum.photos/400/250?random=${n.id}`} 
                              alt={n.title} 
                              className={styles.mediaImg} 
                              loading="lazy" 
                            />
                            {/* Visual Photo overlay badge */}
                            <div className={styles.mediaOverlayBadge}>
                              <i className="fas fa-camera"></i> 📸 {Math.floor(Math.random() * 8) + 3} Photos
                            </div>
                            <div className={styles.mediaPlayOverlay}>
                              <i className="fas fa-play"></i>
                            </div>
                          </div>
                          <div className={styles.mediaCardBody}>
                            <h4 className={styles.mediaCardTitle}>{n.title}</h4>
                            <div className={styles.mediaCardFooter}>
                              {n.district || 'लोकल'} • {n.createdAt && !isNaN(new Date(n.createdAt).getTime()) ? new Date(n.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : ''}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                      इस श्रेणी में अभी कोई खबर नहीं है।
                    </div>
                  )
                )}

              </div>
            </section>

            {/* ── FULL WIDTH CATEGORY AD (Alternating between Wide Leaderboard Pos 1 and 4) ── */}
            <div className={styles.container}>
              <div className={styles.adContainer} style={{ margin: '24px 0 32px' }}>
                <ResponsiveBanner categoryName="Home" position={index % 2 === 0 ? 1 : 4} />
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}
