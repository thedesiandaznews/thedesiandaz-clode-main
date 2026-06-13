import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Editorial Policy | The Desi Andaz Media Network',
  description: 'Understand the editorial guidelines, journalistic commitments, source validation, and independence of The Desi Andaz news desk.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/editorial-policy',
  },
};

export default function EditorialPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Editorial Policy</h1>
          <div className={styles.headerSubtitle}>Standards of Indian Journalism</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz operates under strict guidelines to maintain the trust of our readers. Our editorial policy is built on core principles of accuracy, transparency, accountability, and independence.
          </p>

          <h2>1. Accuracy & Fact-Checking</h2>
          <p>
            We are dedicated to reporting facts correctly. Editors and reporters must cross-verify all key claims, figures, and statements prior to publication. News articles must clearly distinguish between factual reporting and opinions.
          </p>

          <h2>2. Source Verification & Protection</h2>
          <p>
            Reporters should identify sources by name and title whenever possible. When anonymous sources are required to protect their safety or livelihood, we verify the source&apos;s credibility through independent means. We maintain absolute confidentiality regarding anonymous sources.
          </p>

          <h2>3. Editorial Independence</h2>
          <p>
            Our news desk operates independently of all advertisers, corporate sponsors, political organizations, or government offices. Advertisers and sponsors have no influence over our editorial coverage or news selections.
          </p>

          <h2>4. Transparency & Corrections</h2>
          <p>
            When errors occur, we admit them promptly and correct them transparently. Corrected articles will carry a note explaining the change. Grievances regarding any story can be submitted directly to our editorial team at news@thedesiandaz.com.
          </p>

          <div className={styles.badgeBox}>
            <strong>Editorial Desk Contact</strong><br />
            The Desi Andaz Media Network<br />
            Email: news@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
