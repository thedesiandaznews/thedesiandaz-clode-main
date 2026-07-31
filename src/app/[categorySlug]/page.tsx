import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { stripHtml } from '@/lib/utils';
import { Metadata } from 'next';
import { stateDistricts } from '@/lib/localization';
import styles from '@/app/state/state.module.css';

interface SlugConfig {
  type: 'state' | 'district' | 'category';
  value: string;
  display: string;
  englishDisplay: string;
}

const slugMap: Record<string, SlugConfig> = {
  'jharkhand-news': { type: 'state', value: 'Jharkhand', display: 'झारखंड', englishDisplay: 'Jharkhand' },
  'ranchi-news': { type: 'district', value: 'Ranchi', display: 'रांची', englishDisplay: 'Ranchi' },
  'dhanbad-news': { type: 'district', value: 'Dhanbad', display: 'धनबाद', englishDisplay: 'Dhanbad' },
  'bokaro-news': { type: 'district', value: 'Bokaro', display: 'बोकारो', englishDisplay: 'Bokaro' },
  'jamshedpur-news': { type: 'district', value: 'East Singhbhum', display: 'जमशेदपुर', englishDisplay: 'Jamshedpur' },
  'west-singhbhum-news': { type: 'district', value: 'West Singhbhum', display: 'पश्चिमी सिंहभूम', englishDisplay: 'West Singhbhum' },
  'saraikela-kharsawan-news': { type: 'district', value: 'Seraikela-Kharsawan', display: 'सरायकेला खरसावां', englishDisplay: 'Saraikela Kharsawan' },
  'hazaribagh-news': { type: 'district', value: 'Hazaribag', display: 'हजारीबाग', englishDisplay: 'Hazaribagh' },
  'ramgarh-news': { type: 'district', value: 'Ramgarh', display: 'रामगढ़', englishDisplay: 'Ramgarh' },
  'chatra-news': { type: 'district', value: 'Chatra', display: 'चतरा', englishDisplay: 'Chatra' },
  'koderma-news': { type: 'district', value: 'Koderma', display: 'कोडरमा', englishDisplay: 'Koderma' },
  'giridih-news': { type: 'district', value: 'Giridih', display: 'गिरिडीह', englishDisplay: 'Giridih' },
  'palamu-news': { type: 'district', value: 'Palamu', display: 'पलामू', englishDisplay: 'Palamu' },
  'garhwa-news': { type: 'district', value: 'Garhwa', display: 'गढ़वा', englishDisplay: 'Garhwa' },
  'latehar-news': { type: 'district', value: 'Latehar', display: 'लातेहार', englishDisplay: 'Latehar' },
  'gumla-news': { type: 'district', value: 'Gumla', display: 'गुमला', englishDisplay: 'Gumla' },
  'lohardaga-news': { type: 'district', value: 'Lohardaga', display: 'लोहरदगा', englishDisplay: 'Lohardaga' },
  'simdega-news': { type: 'district', value: 'Simdega', display: 'सिमडेगा', englishDisplay: 'Simdega' },
  'khunti-news': { type: 'district', value: 'Khunti', display: 'खूंटी', englishDisplay: 'Khunti' },
  'pakur-news': { type: 'district', value: 'Pakur', display: 'पाकुड़', englishDisplay: 'Pakur' },
  'dumka-news': { type: 'district', value: 'Dumka', display: 'दुमका', englishDisplay: 'Dumka' },
  'deoghar-news': { type: 'district', value: 'Deoghar', display: 'देवघर', englishDisplay: 'Deoghar' },
  'godda-news': { type: 'district', value: 'Godda', display: 'गोड्डा', englishDisplay: 'Godda' },
  'sahibganj-news': { type: 'district', value: 'Sahibganj', display: 'साहिबगंज', englishDisplay: 'Sahibganj' },
  'jamtara-news': { type: 'district', value: 'Jamtara', display: 'जामतड़ा', englishDisplay: 'Jamtara' },
  'breaking-news': { type: 'category', value: 'Breaking News', display: 'ब्रेकिंग न्यूज़', englishDisplay: 'Breaking News' },
  'crime': { type: 'category', value: 'Crime', display: 'क्राइम', englishDisplay: 'Crime' },
  'sports': { type: 'category', value: 'Sports', display: 'खेल', englishDisplay: 'Sports' },
  'education': { type: 'category', value: 'Education', display: 'शिक्षा', englishDisplay: 'Education' },
  'business': { type: 'category', value: 'Business & Finance', display: 'बिजनेस व व्यापार', englishDisplay: 'Business' },
  'entertainment': { type: 'category', value: 'Entertainment', display: 'मनोरंजन', englishDisplay: 'Entertainment' }
};

export async function generateStaticParams() {
  return Object.keys(slugMap).map((slug) => ({
    categorySlug: slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const entry = slugMap[categorySlug];
  if (!entry) return {};

  const title = `${entry.englishDisplay} News | Latest Breaking News & updates | The Desi Andaz`;
  const description = `Get the latest updates, breaking news, politics analysis, regional coverage, and stories from ${entry.englishDisplay} (${entry.display}) on The Desi Andaz Media Network.`;
  const canonicalUrl = `https://www.thedesiandaz.com/${categorySlug}`;

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
      type: 'website',
      siteName: 'The Desi Andaz Media Network',
      images: [{ url: 'https://www.thedesiandaz.com/logo.png' }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.thedesiandaz.com/logo.png']
    }
  };
}

export default async function CategorySlugPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const entry = slugMap[categorySlug];

  if (!entry) {
    notFound();
  }

  // Fetch news articles based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let newsItems: any[] = [];
  if (entry.type === 'state') {
    newsItems = await getNewsArticles({ state: entry.value, status: 'Published', limit: 100 });
  } else if (entry.type === 'district') {
    newsItems = await getNewsArticles({ district: entry.value, status: 'Published', limit: 100 });
  } else if (entry.type === 'category') {
    newsItems = await getNewsArticles({ category: entry.value, status: 'Published', limit: 100 });
  }

  const jharkhandDistricts = stateDistricts['Jharkhand'] || [];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <ResponsiveBanner categoryName="State" position={1} />
        
        {/* Masthead Identity */}
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerOverlay} />
          <div className={styles.heroBannerContent}>
            <nav className={styles.breadcrumb}>
              <Link href="/" className={styles.breadcrumbLink}>होम</Link>
              <span className={styles.breadcrumbSep}>›</span>
              {entry.type === 'district' && (
                <>
                  <Link href="/jharkhand-news" className={styles.breadcrumbLink}>झारखंड</Link>
                  <span className={styles.breadcrumbSep}>›</span>
                </>
              )}
              <span>{entry.display}</span>
            </nav>
            <h1 className={styles.heroPageTitle}>
              <i className="fas fa-map-marker-alt" /> {entry.display} समाचार
            </h1>
          </div>
        </div>

        {/* Live badge row */}
        <div className={styles.pageHeaderRow}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} /> LIVE Updates
          </div>
        </div>

        {/* Main Content Feed */}
        <div className={styles.layout}>
          <main className={styles.feed}>
            {newsItems.length > 0 ? (
              <div className={styles.newsList}>
                {newsItems.map((news, idx) => (
                  <Link 
                    key={news.id} 
                    href={`/news/${news.slug || news.id}`} 
                    className={idx === 0 ? styles.cardFeatured : styles.card}
                  >
                    <div className={idx === 0 ? undefined : styles.cardThumb}>
                      <img 
                        src={news.imageUrl || `https://picsum.photos/600/350?random=${news.id}`} 
                        alt={news.title} 
                        className={idx === 0 ? styles.cardFeaturedImg : undefined}
                        loading="lazy"
                      />
                    </div>
                    <div className={idx === 0 ? styles.cardFeaturedBody : styles.cardBody}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardBadge}>{news.category?.name || 'News'}</span>
                        <span className={styles.cardDistrict}>📍 {news.district || 'लोकल'}</span>
                      </div>
                      <h2 className={styles.cardTitle}>{news.title}</h2>
                      <p className={styles.cardDesc}>
                        {news.seoDesc || stripHtml(news.content || '').slice(0, 150)}...
                      </p>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardTime}>
                          <i className="far fa-clock" /> {new Date(news.createdAt).toLocaleDateString('hi-IN')}
                        </span>
                        <span className={styles.cardReadMore}>पढ़ें →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>📭</span>
                <p className={styles.emptyStateTitle}>फिलहाल इस श्रेणी के लिए कोई खबर उपलब्ध नहीं है।</p>
              </div>
            )}
          </main>

          {/* Sidebar widget */}
          <aside className={styles.sidebar}>
            <div className={styles.buzzBox}>
              <h3 className={styles.buzzTitle}>{entry.display} की हलचल</h3>
              <div className={styles.emptyState} style={{ padding: '20px 10px', fontSize: '13px' }}>
                ताज़ा तरीन बुलेटिन जल्द अपडेट होगा...
              </div>
            </div>
            
            {entry.type !== 'category' && jharkhandDistricts.length > 0 && (
              <div className={styles.quickLinksBox}>
                <div className={styles.quickLinksTitle}>झारखंड के जिले चुनें</div>
                <div className={styles.quickLinksList}>
                  {jharkhandDistricts.map((d) => {
                    const slug = `${d.toLowerCase().replace(/ /g, '-')}-news`;
                    return (
                      <Link 
                        key={d} 
                        href={`/${slug}`} 
                        className={styles.quickLink}
                      >
                        {d}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
