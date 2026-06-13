import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'News Transparency | The Desi Andaz Media Network',
  description: 'Read about the ownership, funding sources, and editorial independence principles of The Desi Andaz news media network.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/news-transparency',
  },
};

export default function NewsTransparencyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>News Transparency</h1>
          <div className={styles.headerSubtitle}>Ownership & Funding Disclosure</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz is committed to transparency. We believe our readers have the right to know who publishes the news they read and how our media operations are funded.
          </p>

          <h2>1. Publication Details</h2>
          <p>
            - <strong>Publication Name:</strong> The Desi Andaz
            <br />
            - <strong>Publisher:</strong> The Desi Andaz Media Network
            <br />
            - <strong>Founder & Managing Director:</strong> Sonu Kumar Saha
            <br />
            - <strong>RNI Registration Number:</strong> JHBIL/26/A3245
          </p>

          <h2>2. Ownership & Organization</h2>
          <p>
            The Desi Andaz is owned and operated under the corporate structure of **The Desi Andaz Media Network**, led by Founder Sonu Kumar Saha. The network operates print editions and a digital media network in Jharkhand, India.
          </p>

          <h2>3. Editorial Independence</h2>
          <p>
            Our journalists write independently of financial backers, commercial advertisers, and political interests. Our editorial decisions are guided strictly by journalistic ethics, public interest, and ground-level facts.
          </p>

          <h2>4. Funding Transparency</h2>
          <p>
            Our operations are funded primarily through:
            <br />
            - Geotargeted local directory advertisements and B2B media placements.
            <br />
            - Corporate branding campaigns.
            <br />
            - Physical newspaper printing subscription sales.
            <br />
            We do not receive foreign government funding, nor are we supported by political action committees.
          </p>

          <div className={styles.badgeBox}>
            <strong>Corporate & Public Relations Office</strong><br />
            The Desi Andaz Media Network<br />
            Near Everett Mission School Dhanush Puja, Gokulpur, Pakur, Jharkhand 816107<br />
            RNI Registration Number: JHBIL/26/A3245
          </div>
        </main>
      </div>
    </div>
  );
}
