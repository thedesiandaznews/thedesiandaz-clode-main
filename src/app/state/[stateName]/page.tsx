import Link from 'next/link';
import { stateDistricts } from '@/lib/localization';
import DistrictSelect from '@/components/DistrictSelect';
import styles from '../state.module.css';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { stripHtml } from '@/lib/utils';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ stateName: string }> }): Promise<Metadata> {
  const { stateName } = await params;
  const displayStateName = stateName.charAt(0).toUpperCase() + stateName.slice(1);
  const title = `${displayStateName} News | The Desi Andaz Media Network`;
  const description = `Read latest updates, breaking news, politics affairs, and local stories from ${displayStateName} on The Desi Andaz Media Network.`;
  const canonicalUrl = `https://www.thedesiandaz.com/state/${stateName}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
  };
}

export default async function StatePage({ params }: { params: Promise<{ stateName: string }> }) {
  const stateInfo = await params;
  const stateSlug = stateInfo.stateName;

  const actualStateName = Object.keys(stateDistricts).find(
    (key) => key.toLowerCase().replace(/ /g, '-') === stateSlug
  );

  const displayStateName = actualStateName || stateSlug.charAt(0).toUpperCase() + stateSlug.slice(1);
  const districts = actualStateName ? stateDistricts[actualStateName as keyof typeof stateDistricts] : [];

  // Fetch real news for this state
  const newsItems = await getNewsArticles({ state: actualStateName || displayStateName, status: 'Published', limit: 100 });

  const buzzItems = [
    { title: `${displayStateName} विकास प्राधिकरण की नई पहल`, img: 'https://picsum.photos/100/100?random=411' },
    { title: `${displayStateName} में किसानों के लिए नई योजना`, img: 'https://picsum.photos/100/100?random=412' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <ResponsiveBanner categoryName="State" position={1} />
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerContent}>
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.breadcrumbLink}>होम</Link>
              <span className={styles.breadcrumbSep}>›</span>
              <span>{displayStateName}</span>
            </nav>
            <h1 className={styles.heroPageTitle}>
              <i className="fas fa-map-marker-alt" /> {displayStateName} की खबरें
            </h1>
          </div>
        </div>

        <div className={styles.pageHeaderRow}>
          <div className={styles.liveBadge}><span className={styles.liveDot} /> LIVE Updates</div>
          <DistrictSelect stateSlug={stateSlug} districts={districts} />
        </div>

        <div className={styles.layout}>
          <main className={styles.feed}>
            {newsItems.length > 0 ? (
              <div className={styles.newsList}>
                {newsItems.map((news, idx) => (
                  <Link key={news.id} href={`/news/${news.slug || news.id}`} className={idx === 0 ? styles.cardFeatured : styles.card}>
                    <img src={news.imageUrl || `https://picsum.photos/600/350?random=${news.id}`} alt={news.title} className={idx === 0 ? styles.cardFeaturedImg : styles.cardThumbImg} />
                    <div className={idx === 0 ? styles.cardFeaturedBody : styles.cardBody}>
                       <div className={styles.cardMeta}>
                          <span className={styles.cardBadge}>{news.category?.name}</span>
                          <span className={styles.cardDistrict}>{news.district}</span>
                       </div>
                       <h2 className={styles.cardTitle}>{news.title}</h2>
                       <p className={styles.cardDesc}>{stripHtml(news.content).slice(0, 150)}...</p>
                       <div className={styles.cardFooter}>
                          <span>{new Date(news.createdAt).toLocaleDateString()}</span>
                          <span className={styles.cardReadMore}>पढ़ें →</span>
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>📭</span>
                <p className={styles.emptyStateTitle}>इस राज्य के लिए फिलहाल कोई खबर उपलब्ध नहीं है।</p>
              </div>
            )}
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.buzzBox}>
              <h3 className={styles.buzzTitle}>{displayStateName} की चर्चा</h3>
              {buzzItems.map((item, i) => (
                <div key={i} className={styles.buzzItem}>
                  <img src={item.img} alt="" className={styles.buzzThumb} />
                  <div className={styles.buzzItemTitle}>{item.title}</div>
                </div>
              ))}
            </div>
            {districts.length > 0 && (
              <div className={styles.quickLinksBox}>
                <div className={styles.quickLinksTitle}>जिले चुनें</div>
                <div className={styles.quickLinksList}>
                  {districts.slice(0, 15).map((d) => (
                    <Link key={d} href={`/state/${stateSlug}/${d.toLowerCase().replace(/ /g, '-')}`} className={styles.quickLink}>{d}</Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
