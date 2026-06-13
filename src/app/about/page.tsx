import styles from './about.module.css';
import { Metadata } from 'next';
import { getPageContent } from '@/actions/pages';
import BlockRenderer from '@/components/BlockRenderer';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const data = await getPageContent('about');
  return {
    title: data?.seoTitle || 'About Us | The Desi Andaz Media Network',
    description: data?.seoDesc || 'Read the manifesto, mission, and vision of The Desi Andaz Media Network, an independent voice in Indian journalism.',
    keywords: data?.seoKeys?.split(',') || ['news', 'hindi news', 'india'],
    alternates: {
      canonical: 'https://www.thedesiandaz.com/about',
    },
    openGraph: {
      images: data?.seoImage ? [{ url: data.seoImage }] : undefined,
    },
  };
}

export default async function AboutPage() {
  const data = await getPageContent('about');
  const content = data?.content || {};

  // If the editor chose Elementor Drag & Drop Builder
  if (content.editorMode === 'drag-and-drop') {
    return (
      <article className={styles.page} style={{ padding: '40px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', width: '100%' }}>
          <BlockRenderer blocks={content.blocks || []} />
        </div>
      </article>
    );
  }

  // Fallback: visual forms render layout dynamically
  return (
    <article className={styles.page}>
      
      {/* 1. MASTHEAD */}
      <header className={styles.headerSection}>
        <h1 className={styles.headerTitle}>{content.heading || 'The Desi Andaz'}</h1>
        <div className={styles.headerSubtitle}>{content.subheading || 'Official Information & Editorial Stance'}</div>
      </header>

      {/* 2. EDITORIAL ARTICLE */}
      <section className={styles.articleSection}>
        <span className={styles.dropcap}>T</span>
        <p>
          {content.paragraph1 || 'The Desi Andaz Media Network is a modern Indian Print & Digital Media Network, established with the core objective of strengthening responsible, impartial, and ground-level journalism.'}
        </p>
        <p>
          {content.paragraph2 || 'हम सिर्फ खबरें प्रकाशित करने वाला प्लेटफॉर्म नहीं हैं — बल्कि समाज की वास्तविक आवाज़ को लोगों तक पहुँचाने वाला एक उभरता हुआ मीडिया नेटवर्क हैं। The Desi Andaz पारंपरिक प्रिंट पत्रकारिता की विश्वसनीयता और आधुनिक डिजिटल मीडिया की गति को एक साथ लेकर आगे बढ़ रहा है।'}
        </p>

        <div className={styles.articleImageWrap}>
          <img 
            src={content.aboutImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'} 
            alt="The Desi Andaz Journalism" 
            className={styles.articleImage}
          />
          <div className={styles.imageCaption}>
            Journalism at The Desi Andaz: Committed to finding the truth at the ground level.
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN EDITORIAL (MISSION & VISION) */}
      <section className={styles.twoColumnSection}>
        <div className={styles.column}>
          <h3>Our Mission</h3>
          <p>{content.mission || 'विश्वसनीय, पारदर्शी और प्रभावशाली पत्रकारिता के माध्यम से समाज की वास्तविक आवाज़ को लोगों तक पहुँचाना और एक ऐसा मंच तैयार करना जहाँ हर नागरिक की बात सुनी जा सके।'}</p>
        </div>
        <div className={styles.column}>
          <h3>Our Vision</h3>
          <p>{content.vision || 'भारत का एक आधुनिक, विश्वसनीय और प्रभावशाली Print & Digital Media Network बनना जो अपनी निष्पक्षता, सत्यवादिता और उच्च पत्रकारिता मानकों के लिए पहचाना जाए।'}</p>
        </div>
      </section>

      {/* 4. EDITOR'S DESK (FOUNDER DETAIL) */}
      <section className={styles.editorSection}>
        <div className={styles.editorHeader}>
          <h2>From the Editor's Desk</h2>
        </div>
        <div className={styles.editorContent}>
          <img src={content.founderImage || '/founder.png'} alt={content.founderName || 'Sonu Kumar Saha'} className={styles.editorPortrait} />
          <div className={styles.editorBio}>
            <div className={styles.editorName}>{content.founderName || 'Sonu Kumar Saha'}</div>
            <div className={styles.editorTitle}>{content.founderTitle || 'Founder & Editor-in-Chief'}</div>
            <p>
              {content.founderBio1 || 'Sonu Kumar Saha एक युवा मीडिया उद्यमी और पत्रकार हैं, जिन्होंने The Desi Andaz Media Network की शुरुआत की है ताकि छोटे शहरों और ग्रामीण क्षेत्रों की आवाज़ को एक मजबूत मंच मिल सके।'}
            </p>
            {content.founderBio2 && (
              <p>
                {content.founderBio2}
              </p>
            )}
            <div className={styles.editorQuote}>
              &ldquo;{content.founderQuote || 'पत्रकारिता समाज की वह आवाज़ होनी चाहिए जो दबी हुई है, और हमारा लक्ष्य उसी आवाज़ को बिना किसी भय के एक मंच देना है।'}&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* 5. MANIFESTO */}
      <section className={styles.manifestoSection}>
        <div className={styles.manifestoInner}>
          <h2>Our Manifesto</h2>
          <ul className={styles.manifestoList}>
            <li className={styles.manifestoItem}>
              <span className={styles.manifestoNumber}>01</span>
              <span className={styles.manifestoText}>{content.manifestoItem1 || 'Registered & Recognized Media Network'}</span>
            </li>
            <li className={styles.manifestoItem}>
              <span className={styles.manifestoNumber}>02</span>
              <span className={styles.manifestoText}>{content.manifestoItem2 || 'Commitment to Responsible Journalism'}</span>
            </li>
            <li className={styles.manifestoItem}>
              <span className={styles.manifestoNumber}>03</span>
              <span className={styles.manifestoText}>{content.manifestoItem3 || 'Unbiased Ground-Level Reporting'}</span>
            </li>
            <li className={styles.manifestoItem}>
              <span className={styles.manifestoNumber}>04</span>
              <span className={styles.manifestoText}>{content.manifestoItem4 || 'Transparent Editorial Practices'}</span>
            </li>
            <li className={styles.manifestoItem}>
              <span className={styles.manifestoNumber}>05</span>
              <span className={styles.manifestoText}>{content.manifestoItem5 || 'Serving the Public Interest First'}</span>
            </li>
          </ul>
        </div>
      </section>

    </article>
  );
}
