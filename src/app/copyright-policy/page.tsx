import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Copyright Policy | The Desi Andaz Media Network',
  description: 'Understand the ownership rights, content usage restrictions, and permission requests details for The Desi Andaz content.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/copyright-policy',
  },
};

export default function CopyrightPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Copyright Policy</h1>
          <div className={styles.headerSubtitle}>Intellectual Property Ownership</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            All materials published on The Desi Andaz website, printed editions, and broadcast feeds, including text, photographs, layouts, logos, videos, and graphics, are the intellectual property of **The Desi Andaz Media Network** and are protected by Indian and international copyright laws.
          </p>

          <h2>1. Ownership of Content</h2>
          <p>
            The Desi Andaz Media Network holds full proprietary copyrights for all original reporting, columns, multimedia items, and designs. Material submitted by verified reporters and citizen contributors is licensed to the network for publication.
          </p>

          <h2>2. Content Usage Restrictions</h2>
          <p>
            You are prohibited from:
            <br />
            - Copying, republishing, or redistributing articles or media from this website without prior written permission.
            <br />
            - Using automated scraping tools, crawlers, or scripts to extract content or database assets for commercial feed reproduction or AI training models.
            <br />
            - Displaying our content in frames or using hotlinking tools to embed our images or videos on external websites.
          </p>

          <h2>3. Permission Requests</h2>
          <p>
            If you wish to license, syndicate, or request permission to reproduce any articles or photographs from our website, please submit a written query to our legal desk at legal@thedesiandaz.com.
          </p>

          <div className={styles.badgeBox}>
            <strong>Legal & Copyright Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
