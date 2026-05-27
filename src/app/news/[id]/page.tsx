import Link from 'next/link';
import styles from './news.module.css';
import { getArticleById, getNewsArticles } from '@/actions/news';
import { notFound } from 'next/navigation';
import ViewCounter from '@/components/ViewCounter';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return {};

  const title = article.seoTitle || `${article.title} | The Desi Andaz`;
  const contentClean = article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 160).trim() : '';
  const description = article.seoDesc || contentClean || 'The Desi Andaz Hindi News Portal';
  const keywords = article.seoKeys || `${article.category?.name || 'News'}, ${article.state}, ${article.district}, the desi andaz`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: article.imageUrl ? [{ url: article.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.imageUrl ? [article.imageUrl] : [],
    }
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log("NewsDetailPage dynamic id:", id);
  const article = await getArticleById(id);
  console.log("NewsDetailPage article found:", article ? article.title : "NULL");

  if (!article) {
    console.log("NewsDetailPage: article is NULL, calling notFound()");
    notFound();
  }

  const latestNews = await getNewsArticles({ status: 'Published' });
  const relatedNews = latestNews
    .filter(n => n.id !== article.id && n.categoryId === article.categoryId)
    .slice(0, 6);
    
  const headlines = latestNews
    .filter(n => n.id !== article.id)
    .slice(0, 4);

  const localFilter = (n: any) => n.id !== article.id && (n.state === article.state || n.district === article.district);
  const primaryLocal = latestNews.filter(localFilter);
  const otherLocal = latestNews.filter(n => n.id !== article.id && !localFilter(n) && n.state);
  const localNews = [...primaryLocal, ...otherLocal].slice(0, 6);

  return (
    <article className={styles.page}>
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
                    alt="Reporter"
                    className={styles.authorAvatar}
                  />
                  <div>
                    <div className={styles.authorName}>
                      रिपोर्टर: <span className={styles.authorHighlight}>{article.reporter}</span>
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

            {/* Top headlines box */}
            <div className={styles.headlinesBox}>
              <h3 className={styles.headlinesTitle}>
                <i className="fas fa-bolt" style={{ color: 'var(--primary)' }} />
                आज की मुख्य खबरें
              </h3>
              {headlines.length > 0 ? headlines.map(h => (
                <Link key={h.id} href={`/news/${h.slug || h.id}`} className={styles.headlinesItem} id={`sidebar-news-${h.id}`}>
                  <div className={styles.headlinesItemTitle}>{h.title}</div>
                  <div className={styles.headlinesItemTime}>
                    <i className="far fa-clock" /> {new Date(h.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No other headlines available</div>
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
