import styles from './local.module.css';
import LocalClient from './LocalClient';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jharkhand Local News | The Desi Andaz Media Network',
  description: 'Breaking regional news, local updates, municipal issues, and block-level stories from Pakur, Ranchi, and districts of Jharkhand.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/local',
  },
};

export default async function LocalPage() {
  const news = await getNewsArticles({ category: 'Jharkhand News', status: 'Published' });
  // Also include "Local News" category
  const moreNews = await getNewsArticles({ category: 'Local News', status: 'Published' });
  
  const allLocal = [...(news || []), ...(moreNews || [])].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <ResponsiveBanner categoryName="Local" position={1} />
        <LocalClient initialNews={allLocal} />
      </div>
    </div>
  );
}
