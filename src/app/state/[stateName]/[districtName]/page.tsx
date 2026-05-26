import Link from 'next/link';
import { stateDistricts } from '@/lib/localization';
import DistrictSelect from '@/components/DistrictSelect';
import styles from '../../state.module.css';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { stripHtml } from '@/lib/utils';

export default async function DistrictPage({ params }: { params: Promise<{ stateName: string; districtName: string }> }) {
  const { stateName, districtName } = await params;

  const actualStateName = Object.keys(stateDistricts).find(
    (key) => key.toLowerCase().replace(/ /g, '-') === stateName
  );
  const displayStateName = actualStateName || stateName.charAt(0).toUpperCase() + stateName.slice(1);
  const districts = actualStateName ? stateDistricts[actualStateName as keyof typeof stateDistricts] : [];

  const actualDistrictName = districts.find(
    (d) => d.toLowerCase().replace(/ /g, '-') === districtName
  );
  const displayDistrictName = actualDistrictName || districtName.charAt(0).toUpperCase() + districtName.slice(1);

  // Fetch news for this district
  const districtNews = await getNewsArticles({ district: actualDistrictName || displayDistrictName, status: 'Published' });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <ResponsiveBanner categoryName="State" position={1} />
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerContent}>
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.breadcrumbLink}>होम</Link>
              <span className={styles.breadcrumbSep}>›</span>
              <Link href={`/state/${stateName}`} className={styles.breadcrumbLink}>{displayStateName}</Link>
              <span className={styles.breadcrumbSep}>›</span>
              <span>{displayDistrictName}</span>
            </nav>
            <h1 className={styles.heroPageTitle}>
              <i className="fas fa-map-marker-alt" /> {displayDistrictName} की खबरें
            </h1>
          </div>
        </div>

        <div className={styles.pageHeaderRow}>
          <div className={styles.liveBadge}><span className={styles.liveDot} /> LIVE Updates</div>
          <DistrictSelect stateSlug={stateName} districts={districts} currentDistrict={displayDistrictName} />
        </div>

        <div className={styles.layout}>
          <main className={styles.feed}>
            {districtNews.length > 0 ? (
               <div className={styles.newsList}>
                 {districtNews.map((news, idx) => (
                   <Link key={news.id} href={`/news/${news.slug || news.id}`} className={idx === 0 ? styles.cardFeatured : styles.card}>
                      <img src={news.imageUrl || `https://picsum.photos/600/350?random=${news.id}`} alt={news.title} className={idx === 0 ? styles.cardFeaturedImg : styles.cardThumbImg} />
                      <div className={idx === 0 ? styles.cardFeaturedBody : styles.cardBody}>
                         <div className={styles.cardMeta}>
                            <span className={styles.cardBadge}>{news.category?.name}</span>
                            <span className={styles.cardLive}><span className={styles.liveDot} /> LIVE</span>
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
                <p className={styles.emptyStateTitle}>इस जिले के लिए फिलहाल कोई खबर उपलब्ध नहीं है।</p>
              </div>
            )}
          </main>

          <aside className={styles.sidebar}>
            <div className={styles.buzzBox}>
              <h3 className={styles.buzzTitle}>{displayDistrictName} की चर्चा</h3>
              <div className={styles.emptyState} style={{ padding: '10px' }}>जल्द आ रहा है...</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
