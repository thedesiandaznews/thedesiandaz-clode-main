import { Metadata } from 'next';
import { getPageContent } from '@/actions/pages';
import BlockRenderer from '@/components/BlockRenderer';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageContent('contact');
  return {
    title: data?.seoTitle || 'Contact Us | The Desi Andaz',
    description: data?.seoDesc || 'Get in touch with The Desi Andaz team for queries, submissions, and advertising.',
    keywords: data?.seoKeys?.split(',') || ['contact', 'desi andaz', 'email'],
    alternates: {
      canonical: 'https://www.thedesiandaz.com/contact',
    },
    openGraph: {
      images: data?.seoImage ? [{ url: data.seoImage }] : undefined,
    },
  };
}

export default async function ContactPage() {
  const data = await getPageContent('contact');
  const content = data?.content || {};

  if (content.editorMode === 'drag-and-drop') {
    return (
      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', width: '100%' }}>
        <BlockRenderer blocks={content.blocks || []} />
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '20px' }}>
        <ResponsiveBanner categoryName="Contact" position={1} />
      </div>
      <ContactClient />
    </>
  );
}
