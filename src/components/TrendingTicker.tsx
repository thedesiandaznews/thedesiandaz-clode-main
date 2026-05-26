'use client';

import Link from 'next/link';
import styles from './trending-ticker.module.css';

interface TrendingTickerProps {
  news: any[];
}

export default function TrendingTicker({ news }: TrendingTickerProps) {
  if (!news || news.length === 0) return null;

  // Duplicate items to create a seamless infinite scroll effect
  const repeatedNews = [...news, ...news];

  return (
    <div className={styles.tickerWrap}>
      <div className={styles.tickerLabel}>
        <i className="fas fa-bolt"></i> ब्रेकिंग
      </div>
      <div className={styles.tickerScroll}>
        <div className={styles.tickerInner}>
          {repeatedNews.map((item, i) => (
            <Link key={i} href={`/news/${item.slug || item.id}`} className={styles.tickerItem}>
              <span className={styles.tickerDot}></span>
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
