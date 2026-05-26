'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './politics.module.css';

const subCategories = ['सभी राजनीति', 'राष्ट्रीय', 'राज्य', 'चुनाव', 'विश्लेषण'];

export default function PoliticsClient({ initialNews }: { initialNews: any[] }) {
  const [activeSub, setActiveSub] = useState(0);

  // Generic keyword filtering for demo purposes
  const filtered = initialNews.filter(n => {
    if (activeSub === 0) return true;
    const key = subCategories[activeSub].toLowerCase();
    return n.title.toLowerCase().includes(key) || n.content.toLowerCase().includes(key);
  });

  const featured = filtered[0];
  const list = filtered.slice(1);

  return (
    <div className={styles.inner}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚖️ राजनीति <span className={styles.titleAccent}>डेस्क</span></h1>
        <div className={styles.filterBar}>
          {subCategories.map((cat, i) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeSub === i ? styles.active : ''}`}
              onClick={() => setActiveSub(i)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.layout}>
        <main className={styles.mainFeed}>
          {featured && (
            <Link href={`/news/${featured.slug || featured.id}`} className={styles.featuredCard}>
               <img src={featured.imageUrl || `https://picsum.photos/800/450?random=${featured.id}`} alt={featured.title} className={styles.featuredImg} />
               <div className={styles.featuredContent}>
                  <span className={styles.badge}>{featured.category?.name || 'Politics'}</span>
                  <h2 className={styles.featuredTitle}>{featured.title}</h2>
                  <div className={styles.meta}>
                    <span>By {featured.reporter}</span>
                    <span>{new Date(featured.createdAt).toLocaleDateString()}</span>
                  </div>
               </div>
            </Link>
          )}

          <div className={styles.listGrid}>
            {list.map(n => (
              <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.itemCard}>
                <div className={styles.itemImg}>
                  <img src={n.imageUrl || `https://picsum.photos/300/200?random=${n.id}`} alt={n.title} />
                </div>
                <div className={styles.itemBody}>
                  <h3 className={styles.itemTitle}>{n.title}</h3>
                  <div className={styles.itemTime}>{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className={styles.empty}>अभी इस श्रेणी में कोई खबर नहीं है।</div>
          )}
        </main>

        <aside className={styles.sidebar}>
           <div className={styles.adBox}>
             <img src="https://picsum.photos/300/600?random=politics-ad" alt="Ad" />
           </div>
        </aside>
      </div>
    </div>
  );
}
