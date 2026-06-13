import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Disclaimer | The Desi Andaz Media Network',
  description: 'Read the official disclaimers for news accuracy, opinion pieces, external links, and advertisements on The Desi Andaz news portal.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/disclaimer',
  },
};

export default function DisclaimerPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Disclaimer</h1>
          <div className={styles.headerSubtitle}>Last Updated: June 13, 2026</div>
        </header>

        <main className={styles.contentSection}>
          <h2>1. News & Content Disclaimer</h2>
          <p>
            All information on The Desi Andaz (https://www.thedesiandaz.com) is published in good faith and for general informational purposes only. While we strive for accuracy and reliability, we do not make any warranties about the completeness, reliability, or absolute accuracy of this information. Any action you take upon the information you find on this website is strictly at your own risk.
          </p>

          <h2>2. Opinion Disclaimer</h2>
          <p>
            The views and opinions expressed in editorials, column pieces, or citizen journalism submissions on this platform are those of the individual writers and do not necessarily reflect the official policy or position of The Desi Andaz Media Network or its editorial desk.
          </p>

          <h2>3. External Links Disclaimer</h2>
          <p>
            From our website, you can visit other websites by following hyperlinks to external sites. While we strive to provide only quality links to useful and ethical websites, we have no control over the content and nature of these sites. These links do not imply a recommendation for all the content found on these sites.
          </p>

          <h2>4. Advertising & Sponsored Content Disclaimer</h2>
          <p>
            Advertisements appearing on this website do not constitute an endorsement, guarantee, or recommendation by The Desi Andaz Media Network. We are not liable for the claims made by commercial advertisers or sponsored article sponsors.
          </p>

          <div className={styles.badgeBox}>
            <strong>Editorial & Compliance Contact</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
