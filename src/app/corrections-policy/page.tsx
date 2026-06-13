import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Corrections Policy | The Desi Andaz Media Network',
  description: 'Understand the review processes, update procedures, and error-reporting channels at The Desi Andaz news portal.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/corrections-policy',
  },
};

export default function CorrectionsPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Corrections Policy</h1>
          <div className={styles.headerSubtitle}>Error Correction Procedures</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network is committed to accuracy. When factual errors or typographical mistakes occur in our news coverage, we take immediate responsibility to correct them in a clear and transparent manner.
          </p>

          <h2>1. Error Reporting</h2>
          <p>
            We encourage our readers, sources, and the public to notify us of any inaccuracies in our stories. If you spot a factual error, please email our legal and editorial desk at legal@thedesiandaz.com with the subject line &quot;Correction Request&quot;, including the story URL and details of the error.
          </p>

          <h2>2. Review Process</h2>
          <p>
            Upon receiving an error report, our editors will review the request by checking primary sources, verifying facts, and consulting the original writer. If an error is confirmed, we will issue a correction immediately.
          </p>

          <h2>3. Update Procedure & Transparency</h2>
          <p>
            For minor corrections (like typos or spelling errors), we update the text directly without a disclaimer. For major factual corrections, we place a prominent note at the bottom of the article page explaining:
            <br />
            - The date and time of the update.
            <br />
            - The specific incorrect information that was replaced.
            <br />
            - The correct facts.
          </p>

          <div className={styles.badgeBox}>
            <strong>Corrections & Legal Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
