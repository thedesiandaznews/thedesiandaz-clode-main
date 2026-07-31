import Link from 'next/link';
import styles from './news.module.css';
import { getArticleById, getNewsArticles } from '@/actions/news';
import { notFound } from 'next/navigation';
import ViewCounter from '@/components/ViewCounter';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id);
  const article = await getArticleById(id);
  if (!article) return {};

  let title = article.seoTitle || article.title;
  if (!title.includes('The Desi Andaz Media Network')) {
    title = `${title} | The Desi Andaz Media Network`;
  }

  const contentClean = article.content ? article.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
  let description = article.seoDesc || contentClean;
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  } else if (description.length < 140) {
    description = (description + ' Read complete news updates, regional coverage, and political analysis on The Desi Andaz Media Network.').substring(0, 155).trim();
  }

  const keywords = article.seoKeys || `${article.category?.name || 'News'}, ${article.state}, ${article.district}, the desi andaz`;
  const canonicalUrl = `https://www.thedesiandaz.com/news/${article.slug || article.id}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'The Desi Andaz Media Network',
      images: article.imageUrl ? [{ url: article.imageUrl }] : [{ url: 'https://www.thedesiandaz.com/logo.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : ['https://www.thedesiandaz.com/logo.png'],
    }
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = decodeURIComponent(resolvedParams.id);
  console.log("NewsDetailPage dynamic id:", id);
  const article = await getArticleById(id);
  console.log("NewsDetailPage article found:", article ? article.title : "NULL");

  if (!article) {
    console.log("NewsDetailPage: article is NULL, calling notFound()");
    notFound();
  }

  const latestNews = await getNewsArticles({ status: 'Published', limit: 20 });
  const relatedNews = latestNews
    .filter(n => n.id !== article.id && n.categoryId === article.categoryId)
    .slice(0, 6);
    
  const latestNewsItems = latestNews
    .filter(n => n.id !== article.id)
    .slice(0, 4);

  const trendingNews = [...latestNews]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .filter(n => n.id !== article.id)
    .slice(0, 4);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const localFilter = (n: any) => n.id !== article.id && (n.state === article.state || n.district === article.district);
  const primaryLocal = latestNews.filter(localFilter);
  const otherLocal = latestNews.filter(n => n.id !== article.id && !localFilter(n) && n.state);
  const localNews = [...primaryLocal, ...otherLocal].slice(0, 6);

  const articleUrl = `https://www.thedesiandaz.com/news/${article.slug || article.id}`;
  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    "headline": article.title,
    "description": article.seoDesc || article.content.replace(/<[^>]*>/g, '').substring(0, 160).trim(),
    "image": article.imageUrl ? [article.imageUrl] : ["https://www.thedesiandaz.com/logo.png"],
    "datePublished": new Date(article.createdAt).toISOString(),
    "dateModified": new Date(article.updatedAt).toISOString(),
    "author": {
      "@type": "Person",
      "name": article.reporter || "संवाददाता"
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "The Desi Andaz Media Network",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.thedesiandaz.com/logo.png"
      }
    }
  };

  const imageObjectSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "url": article.imageUrl || "https://www.thedesiandaz.com/logo.png",
    "caption": article.title,
    "description": article.seoDesc || article.title
  };

  const catName = article.category?.name || '';
  const catLower = catName.toLowerCase();
  let catUrl = 'https://www.thedesiandaz.com/latest';
  if (catLower === 'breaking news') catUrl = 'https://www.thedesiandaz.com/breaking-news';
  else if (catLower === 'crime') catUrl = 'https://www.thedesiandaz.com/crime';
  else if (catLower === 'politics') catUrl = 'https://www.thedesiandaz.com/politics';
  else if (catLower === 'sports') catUrl = 'https://www.thedesiandaz.com/sports';
  else if (catLower === 'education') catUrl = 'https://www.thedesiandaz.com/education';
  else if (catLower === 'business' || catLower === 'business & finance') catUrl = 'https://www.thedesiandaz.com/business';
  else if (catLower === 'entertainment') catUrl = 'https://www.thedesiandaz.com/entertainment';
  else if (catName) catUrl = `https://www.thedesiandaz.com/latest?category=${encodeURIComponent(catName)}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thedesiandaz.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": article.category?.name || "News",
        "item": catUrl
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": articleUrl
      }
    ]
  };

  return (
    <article className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ViewCounter id={article.id} />
      <div className={styles.inner}>
        
        {/* ── TOP AD PLACEMENT (Position 1) ── */}
        <div className={styles.adPlacementTop}>
          <ResponsiveBanner categoryName="News" position={1} />
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className={styles.layout}>

          {/* ── ARTICLE MAIN COLUMN ── */}
          <main className={styles.articleMain}>

            {/* Article Header */}
            <div className={styles.articleHeader}>
              <div className={styles.articleMetaTop}>
                <span className={styles.breakingBadge}>{article.category?.name || 'News'}</span>
                <span className={styles.articleTime}>
                  <i className="far fa-clock" /> {new Date(article.createdAt).toLocaleDateString()}
                </span>
                <span className={styles.articleViews}>
                  <i className="far fa-eye" /> {article.views} Views
                </span>
              </div>

              <h1 className={styles.articleTitle}>{article.title}</h1>

              {/* Author + Share */}
              <div className={styles.authorBar}>
                <div className={styles.authorInfo}>
                  <img
                    src={article.reporterRel?.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                    alt="संवाददाता"
                    className={styles.authorAvatar}
                  />
                  <div>
                    <div className={styles.authorName}>
                      संवाददाता: <span className={styles.authorHighlight}>{article.reporter}</span>
                      {article.reporterRel?.reporterCode && (
                        <span className={styles.reporterBadge}>
                          ✓ Verified ({article.reporterRel.reporterCode})
                        </span>
                      )}
                    </div>
                    <div className={styles.authorDate}>{article.state}, {article.district}</div>
                  </div>
                </div>

                <div className={styles.shareGroup}>
                  <button className={`${styles.shareBtn} ${styles.fb}`} id="share-fb" title="Share on Facebook">
                    <i className="fab fa-facebook-f" />
                  </button>
                  <button className={`${styles.shareBtn} ${styles.tw}`} id="share-tw" title="Share on X">
                    <i className="fab fa-x-twitter" />
                  </button>
                  <button className={`${styles.shareBtn} ${styles.wa}`} id="share-wa" title="Share on WhatsApp">
                    <i className="fab fa-whatsapp" />
                  </button>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className={styles.articleBody}>

              {/* Hero Image */}
              <div className={styles.heroImgWrapper}>
                <img
                  src={article.imageUrl || `https://picsum.photos/1200/600?random=${article.id}`}
                  alt={article.title}
                  className={styles.articleHeroImg}
                />
              </div>

              {/* Content */}
              <div 
                className={styles.articlePara} 
                dangerouslySetInnerHTML={{ __html: article.content }}
              />



              {/* Tags */}
              <div className={styles.tagsRow}>
                <span className={styles.tagsLabel}>Tags:</span>
                {Array.from(new Set([article.category?.name, article.state, article.district, 'Breaking News'].filter(Boolean))).map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </main>

          {/* ── SIDEBAR ── */}
          <aside className={styles.sidebar}>
            
            {/* ── SIDEBAR AD PLACEMENT (Position 3) ── */}
            <div className={styles.adPlacementSidebar}>
              <ResponsiveBanner categoryName="News" position={3} />
            </div>

            {/* Latest News Box */}
            <div className={styles.headlinesBox}>
              <h3 className={styles.headlinesTitle}>
                <i className="fas fa-bolt" style={{ color: 'var(--primary)' }} />
                ⚡ ताज़ा खबरें
              </h3>
              {latestNewsItems.length > 0 ? latestNewsItems.map(h => (
                <Link key={h.id} href={`/news/${h.slug || h.id}`} className={styles.headlinesItem} id={`sidebar-news-${h.id}`}>
                  <div className={styles.headlinesItemTitle}>{h.title}</div>
                  <div className={styles.headlinesItemTime}>
                    <i className="far fa-clock" /> {new Date(h.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>कोई ताज़ा खबर उपलब्ध नहीं है</div>
              )}
            </div>

            {/* Trending News Box */}
            <div className={styles.headlinesBox} style={{ marginTop: '20px' }}>
              <h3 className={styles.headlinesTitle}>
                <i className="fas fa-fire" style={{ color: '#f97316' }} />
                📈 ट्रेंडिंग खबरें
              </h3>
              {trendingNews.length > 0 ? trendingNews.map(t => (
                <Link key={t.id} href={`/news/${t.slug || t.id}`} className={styles.headlinesItem} id={`sidebar-trending-${t.id}`}>
                  <div className={styles.headlinesItemTitle}>{t.title}</div>
                  <div className={styles.headlinesItemTime}>
                    <i className="far fa-eye" /> {t.views || 0} Views
                  </div>
                </Link>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>कोई ट्रेंडिंग खबर उपलब्ध नहीं है</div>
              )}
            </div>

          </aside>
        </div>

        {/* ── RELATED NEWS (full width, below layout) ── */}
        {relatedNews.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>🔥 संबंधित खबरें</h2>
            <div className={styles.relatedGrid}>
              {relatedNews.map(news => (
                <Link key={news.id} href={`/news/${news.slug || news.id}`} className={styles.relatedCard} id={`related-${news.id}`}>
                  <div className={styles.relatedImgWrapper}>
                    <img
                      src={news.imageUrl || `https://picsum.photos/400/250?random=${news.id}`}
                      alt={news.title}
                      className={styles.relatedImg}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.relatedBody}>
                    <div className={styles.relatedCat}>{news.category?.name}</div>
                    <h4 className={styles.relatedHeadline}>{news.title}</h4>
                    <div className={styles.relatedTime}>
                      <i className="far fa-clock" /> {new Date(news.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── BOTTOM AD PLACEMENT (Position 4) ── */}
        <div className={styles.adPlacementBottom}>
          <ResponsiveBanner categoryName="News" position={4} />
        </div>

        {/* ── LOCAL NEWS GRID (full width, below ad) ── */}
        {localNews.length > 0 && (
          <div className={styles.relatedSection}>
            <h2 className={styles.relatedTitle}>
              <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary)', marginRight: '8px' }} />
              स्थानीय खबरें (आपके क्षेत्र की खबरें)
            </h2>
            <div className={styles.relatedGrid}>
              {localNews.map(news => (
                <Link key={news.id} href={`/news/${news.slug || news.id}`} className={styles.relatedCard} id={`local-${news.id}`}>
                  <div className={styles.relatedImgWrapper}>
                    <img
                      src={news.imageUrl || `https://picsum.photos/400/250?random=${news.id}`}
                      alt={news.title}
                      className={styles.relatedImg}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.relatedBody}>
                    <div className={styles.relatedCat} style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <i className="fas fa-location-arrow" style={{ fontSize: '10px' }} />
                      {news.state} {news.district ? `• ${news.district}` : ''}
                    </div>
                    <h4 className={styles.relatedHeadline}>{news.title}</h4>
                    <div className={styles.relatedTime}>
                      <i className="far fa-clock" /> {new Date(news.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </article>
  );
}
