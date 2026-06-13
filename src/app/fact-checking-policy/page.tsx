import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Fact Checking Policy | The Desi Andaz Media Network',
  description: 'Learn about the verification standards, source validations, and visual verification processes used by The Desi Andaz news desk.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/fact-checking-policy',
  },
};

export default function FactCheckingPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Fact Checking Policy</h1>
          <div className={styles.headerSubtitle}>Truth Verification Protocols</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            In an era of rapid information sharing, The Desi Andaz is committed to providing factual, verified, and reliable news updates. We follow rigorous fact-checking protocols to counter misinformation.
          </p>

          <h2>1. Verification Standards</h2>
          <p>
            Every claim, key statistic, and quotes from public figures must be backed by verifiable evidence. We cross-examine reports with public government records, press statements, and audio/video recordings. Information from individual sources is double-sourced through independent references.
          </p>

          <h2>2. Source Validation</h2>
          <p>
            We prioritize primary sources (such as direct eyewitness accounts, official reports, court filings, and academic data). Secondary sources are analyzed carefully for bias and context. Unverified rumors or social media claims are never presented as news.
          </p>

          <h2>3. Image & Video Verification</h2>
          <p>
            Before publishing images or videos (especially those submitted by citizen contributors or sourced from social networks), our desk conducts reverse image searches, metadata analysis, and location check verifications to prevent the spread of doctored content, deepfakes, or out-of-context media.
          </p>

          <h2>4. Correction Standards</h2>
          <p>
            If a fact-check is found to contain errors after review, we correct it immediately and notify our readers transparently by adding a correction disclaimer to the story page.
          </p>

          <div className={styles.badgeBox}>
            <strong>Fact-Check Verification Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
