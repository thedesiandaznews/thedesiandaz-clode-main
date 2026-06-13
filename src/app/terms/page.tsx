import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Terms & Conditions | The Desi Andaz Media Network',
  description: 'Review the Terms & Conditions governing the use of The Desi Andaz news portal, content distribution, and user rights.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/terms',
  },
};

export default function TermsConditionsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Terms & Conditions</h1>
          <div className={styles.headerSubtitle}>Effective Date: June 13, 2026</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            Welcome to The Desi Andaz news portal. By accessing, browsing, or using this website, you agree to comply with and be bound by the following Terms and Conditions of use.
          </p>

          <h2>1. Use of the Site</h2>
          <p>
            You agree to use this site for lawful purposes only. You are prohibited from posting or transmitting any unlawful, threatening, abusive, defamatory, obscene, or indecent content, or committing actions that violate third-party rights.
          </p>

          <h2>2. Intellectual Property & Copyright</h2>
          <p>
            All content published on this website, including articles, opinions, graphics, logos, layouts, and videos, is the intellectual property of The Desi Andaz Media Network and is protected by copyright laws. No part of this site may be reproduced, syndicated, or scraped without prior written consent.
          </p>

          <h2>3. Third-Party Links</h2>
          <p>
            The Desi Andaz may contain links to external third-party websites for your convenience. We do not endorse, inspect, or hold any liability for the content, privacy policies, or actions of these external platforms.
          </p>

          <h2>4. Limitation of Liability</h2>
          <p>
            All information on this site is provided on an &quot;as is&quot; and &quot;as available&quot; basis. The Desi Andaz Media Network does not guarantee that the services will be uninterrupted or error-free. We disclaim all warranties, express or implied, regarding the accuracy or reliability of any content.
          </p>

          <div className={styles.badgeBox}>
            <strong>Publication Information</strong><br />
            The Desi Andaz Media Network<br />
            RNI Registration Number: JHBIL/26/A3245
          </div>
        </main>
      </div>
    </div>
  );
}
