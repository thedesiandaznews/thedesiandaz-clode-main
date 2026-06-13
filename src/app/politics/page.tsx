import styles from './politics.module.css';
import PoliticsClient from './PoliticsClient';
import { getNewsArticles } from '@/actions/news';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politics News | The Desi Andaz Media Network',
  description: 'Impartial ground-level coverage of Jharkhand elections, state government policies, and national political affairs.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/politics',
  },
};

export default async function PoliticsPage() {
  const news = await getNewsArticles({ category: 'Politics', status: 'Published' });

  return (
    <div className={styles.page}>
      <PoliticsClient initialNews={news} />
    </div>
  );
}
