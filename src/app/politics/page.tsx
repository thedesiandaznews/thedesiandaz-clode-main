import styles from './politics.module.css';
import PoliticsClient from './PoliticsClient';
import { getNewsArticles } from '@/actions/news';

export default async function PoliticsPage() {
  const news = await getNewsArticles({ category: 'Politics', status: 'Published' });

  return (
    <div className={styles.page}>
      <PoliticsClient initialNews={news} />
    </div>
  );
}
