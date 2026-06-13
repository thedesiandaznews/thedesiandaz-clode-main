import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Advertising Policy | The Desi Andaz Media Network',
  description: 'Understand the sponsored content guidelines, political advertisement rules, and ad review standards at The Desi Andaz news desk.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/advertising-policy',
  },
};

export default function AdvertisingPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Advertising Policy</h1>
          <div className={styles.headerSubtitle}>Advertising Guidelines & Standards</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network accepts advertising and sponsored campaigns on our print editions, digital portals, and video news feeds to support our independent journalism. To maintain the trust of our readers, we enforce strict separation between commercial interests and editorial coverage.
          </p>

          <h2>1. Editorial Independence</h2>
          <p>
            Advertisers and sponsors have absolutely no influence over our editorial decisions, selection of news, or reporting. The Desi Andaz maintains complete editorial independence. The presentation of advertising on our website does not imply endorsement of the advertised products, services, or political candidates.
          </p>

          <h2>2. Sponsored Content Labeling</h2>
          <p>
            All sponsored articles, advertiser-funded columns, or promotional content published on our website must be clearly and transparently marked as &quot;Sponsored Content&quot;, &quot;Paid Promotion&quot;, or &quot;Advertisement&quot;. This ensures readers can easily distinguish between news reporting and paid content.
          </p>

          <h2>3. Political Advertising</h2>
          <p>
            We accept political advertisements in compliance with the guidelines set by the Election Commission of India (ECI). All political advertisements must be clearly labeled with the sponsor&apos;s details. We reserve the right to reject ads that promote hate speech, communal disharmony, or violate national security.
          </p>

          <h2>4. Advertisement Review Standards</h2>
          <p>
            All advertisements undergo internal review before publication. We do not accept ads that contain deceptive claims, promote illegal products, contain sexually explicit materials, or depict violence.
          </p>

          <div className={styles.badgeBox}>
            <strong>Advertising & Sponsorship Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: ads@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
