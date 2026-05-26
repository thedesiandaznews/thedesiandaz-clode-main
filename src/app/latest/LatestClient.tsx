'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './latest.module.css';

export default function LatestClient({ initialNews }: { initialNews: any[] }) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  const [newsList, setNewsList] = useState(initialNews);
  
  // Extract dynamic categories from news, plus "All" at the beginning
  const dynamicCategories = ['सभी', ...Array.from(new Set(initialNews.map(n => n.category?.name).filter(Boolean)))];
  
  // Determine active tab based on URL param or default to 0
  const initialTabIndex = urlCategory ? dynamicCategories.findIndex(c => c.toLowerCase() === urlCategory.toLowerCase()) : 0;
  const [activeTab, setActiveTab] = useState(initialTabIndex !== -1 ? initialTabIndex : 0);

  // If URL changes, update active tab
  useEffect(() => {
    if (urlCategory) {
      const idx = dynamicCategories.findIndex(c => c.toLowerCase() === urlCategory.toLowerCase());
      if (idx !== -1) setActiveTab(idx);
    } else {
      setActiveTab(0);
    }
  }, [urlCategory]);

  const filtered = newsList.filter(n => {
    // If we are on a specific tab but it's not "सभी" (All)
    if (activeTab > 0) {
      const key = dynamicCategories[activeTab].toLowerCase();
      const matchesPrimary = n.category?.name?.toLowerCase() === key;
      const matchesAdditional = n.additionalCategories?.some((ac: any) => ac.name?.toLowerCase() === key);
      return matchesPrimary || matchesAdditional;
    }
    
    // If we are on "सभी" (All) but there is a URL category that wasn't in our tabs (rare)
    if (activeTab === 0 && urlCategory && initialTabIndex === -1) {
       const key = urlCategory.toLowerCase();
       const matchesPrimary = n.category?.name?.toLowerCase() === key;
       const matchesAdditional = n.additionalCategories?.some((ac: any) => ac.name?.toLowerCase() === key);
       return matchesPrimary || matchesAdditional;
    }
    
    return true;
  });

  return (
    <div className={styles.inner}>
      {/* ── Cinematic bg glows ── */}
      <div className={styles.bgGlow} aria-hidden="true" />

      {/* ── PAGE HEADER ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{urlCategory || 'ताज़ा'} <span>ख़बरें</span></h1>
        <div className={styles.liveBadge}><span className={styles.liveDot} /> लाइव अपडेट्स</div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className={styles.filterBar}>
        {dynamicCategories.map((cat: any, i: number) => (
          <button
            key={i}
            className={`${styles.filterTab} ${activeTab === i ? styles.active : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <main className={styles.feed}>
          <div className={styles.newsList}>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>📰</span>
                <p className={styles.emptyStateTitle}>इस श्रेणी में अभी कोई खबर उपलब्ध नहीं है।</p>
              </div>
            ) : (
              filtered.map((news, idx) => (
                <Link key={news.id} href={`/news/${news.slug || news.id}`} className={idx === 0 ? styles.cardFeatured : styles.card}>
                  {idx === 0 ? (
                    <img src={news.imageUrl || `https://picsum.photos/600/350?random=${news.id}`} alt={news.title} className={styles.cardFeaturedImg} />
                  ) : (
                    <div className={styles.cardThumb}>
                      <img src={news.imageUrl || `https://picsum.photos/250/200?random=${news.id}`} alt={news.title} />
                    </div>
                  )}
                  <div className={idx === 0 ? styles.cardFeaturedBody : styles.cardBody}>
                    <div className={styles.cardTop}>
                      <span className={styles.cardCategory}>{news.category?.name || 'समाचार'}</span>
                      <span className={styles.cardTime}>
                        <i className="far fa-clock" style={{ marginRight: 4 }} />
                        {new Date(news.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className={idx === 0 ? `${styles.cardTitle} ${styles.cardTitleFeatured}` : styles.cardTitle}>
                      {news.title}
                    </h2>
                    <p className={styles.cardSummary}>{news.content.replace(/<[^>]*>/g, '').slice(0, 150)}...</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>By {news.reporter || 'डेस्क'}</span>
                      <span className={styles.cardReadMore}>पढ़ें →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.trendingBox}>
            <h3 className={styles.trendingTitle}>
              <i className="fas fa-fire" style={{ color: 'var(--primary)' }} /> ट्रेंडिंग खबरें
            </h3>
            {newsList.slice(0, 5).map((item, i) => (
              <Link key={item.id} href={`/news/${item.slug || item.id}`} className={styles.trendingItem}>
                <div className={styles.trendingNum}>{i + 1}</div>
                <p className={styles.trendingItemTitle}>{item.title}</p>
              </Link>
            ))}
          </div>

          {/* Newsletter Box */}
          <div className={styles.newsletterBox}>
            <span className={styles.newsletterIcon}>📧</span>
            <h3 className={styles.newsletterTitle}>न्यूज़लेटर सब्सक्राइब करें</h3>
            <p className={styles.newsletterDesc}>दैनिक समाचार अपडेट सीधे अपने इनबॉक्स में प्राप्त करें।</p>
            <input type="email" placeholder="आपका ईमेल पता" className={styles.newsletterInput} />
            <button className={styles.btnNewsletter}>सब्सक्राइब करें</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
