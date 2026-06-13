import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Ethics Policy | The Desi Andaz Media Network',
  description: 'Understand the ethics and standards guidelines regarding truth, integrity, neutrality, and conflict of interest policies at The Desi Andaz.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/ethics-policy',
  },
};

export default function EthicsPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Ethics Policy</h1>
          <div className={styles.headerSubtitle}>Code of Conduct & Integrity</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network is committed to public interest journalism. We adhere to the highest ethical standards of truth, neutrality, and integrity in our news gathering.
          </p>

          <h2>1. Truth & Fairness</h2>
          <p>
            We strive to present news reports with fairness, balancing perspectives and verifying all allegations. We do not distort or falsify information to suit any agenda.
          </p>

          <h2>2. Integrity & Independence</h2>
          <p>
            Reporters and editors must not accept bribes, gifts, or favors that could compromise the neutrality of their reporting. &quot;Paid news&quot; is strictly prohibited on our network.
          </p>

          <h2>3. Neutrality & Non-Partisanship</h2>
          <p>
            The Desi Andaz remains politically neutral and non-partisan. We report facts without taking sides, ensuring that diverse perspectives are represented.
          </p>

          <h2>4. Conflict of Interest Policy</h2>
          <p>
            Editorial members must avoid conflicts of interest, whether personal, financial, or political. If a writer has a personal connection or financial interest in a topic they are covering, they must disclose it to the Editor-in-Chief, or the story must be reassigned.
          </p>

          <div className={styles.badgeBox}>
            <strong>Editorial Integrity Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
