import styles from './latest.module.css';
import LatestClient from './LatestClient';
import { getNewsArticles } from '@/actions/news';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import { Suspense } from 'react';
import { Metadata } from 'next';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  const title = category 
    ? `${category} News | The Desi Andaz Media Network`
    : 'Latest News | The Desi Andaz Media Network';
  const description = category
    ? `Read all the latest updates, breaking news, and in-depth articles related to ${category} on The Desi Andaz.`
    : 'Get the latest breaking news, politics analysis, regional updates, and ground-level stories from Jharkhand and across India.';
  
  const canonicalUrl = category
    ? `https://www.thedesiandaz.com/latest?category=${encodeURIComponent(category as string)}`
    : 'https://www.thedesiandaz.com/latest';

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

export default async function LatestNewsPage() {
  const news = await getNewsArticles({ status: 'Published' });

  return (
    <div className={styles.page}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 20px 0', width: '100%' }}>
        <ResponsiveBanner categoryName="Latest" position={1} />
      </div>
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          लोड हो रहा है...
        </div>
      }>
        <LatestClient initialNews={news} />
      </Suspense>
    </div>
  );
}
