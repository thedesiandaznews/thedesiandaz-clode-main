import styles from './latest.module.css';
import LatestClient from './LatestClient';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';

export default async function LatestNewsPage() {
  const news = await getNewsArticles({ status: 'Published' });

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 20px 0', width: '100%' }}>
        <ResponsiveBanner categoryName="Latest" position={1} />
      </div>
      <LatestClient initialNews={news} />
    </div>
  );
}
