'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './local.module.css';

const cities = ['सभी शहर', 'रांची', 'जमशेदपुर', 'धनबाद', 'बोकारो', 'देवघर', 'हजारीबाग', 'पलामू'];

export default function LocalClient({ initialNews = [] }: { initialNews: any[] }) {
  const [activeCity, setActiveCity] = useState(0);

  const safeNews = Array.isArray(initialNews) ? initialNews : [];
  
  const filtered = safeNews.filter(n => {
    if (activeCity === 0) return true;
    const key = cities[activeCity].toLowerCase();
    return (n?.district || '').toLowerCase().includes(key) || (n?.title || '').toLowerCase().includes(key);
  });

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)' }} /> 
          लोकल <span className={styles.titleAccent}>News</span>
        </h1>
        <div className={styles.cityBar}>
          {cities.map((city, i) => (
            <button
              key={city}
              className={`${styles.cityBtn} ${activeCity === i ? styles.active : ''}`}
              onClick={() => setActiveCity(i)}
            >
              {city}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.feed}>
        {filtered.length > 0 ? (
          <div className={styles.grid}>
            {filtered.map(n => (
              <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.card}>
                <div className={styles.cardImgWrap}>
                  <div className={styles.cardBadge}>
                    {n.district || 'Jharkhand'}
                  </div>
                  <img src={n.imageUrl || `https://picsum.photos/400/250?random=${n.id}`} alt={n.title} className={styles.cardImg} />
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{n?.title || 'No Title'}</h3>
                  <p className={styles.cardExcerpt}>{n?.seoDesc || (typeof n?.content === 'string' ? n.content.replace(/<[^>]*>?/gm, '').slice(0, 120) : '')}...</p>
                  <div className={styles.cardFooter}>
                    <span>{n?.createdAt && !isNaN(new Date(n.createdAt).getTime()) ? new Date(n.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
                    <span className={styles.readMore}>पढ़ें →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <i className="fas fa-newspaper" style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ccc' }} /><br />
            इस शहर के लिए अभी कोई खबर नहीं है।
          </div>
        )}
      </div>
    </>
  );
}
