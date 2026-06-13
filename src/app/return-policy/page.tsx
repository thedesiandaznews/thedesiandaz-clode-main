import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Return Policy | The Desi Andaz Media Network',
  description: 'Read the return policy statement for The Desi Andaz Media Network news portal.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/return-policy',
  },
};

export default function ReturnPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Return Policy</h1>
          <div className={styles.headerSubtitle}>Product Return Statement</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz operates exclusively as a digital news media platform and provider of advertising and promotional services.
          </p>

          <h2>1. Physical Products</h2>
          <p>
            No physical goods, products, or merchandise are sold, shipped, or delivered through this website (https://www.thedesiandaz.com).
          </p>

          <h2>2. Return Eligibility</h2>
          <p>
            Since we do not deal in physical merchandise, a return policy is **not applicable** to this website or our media network services.
          </p>

          <div className={styles.badgeBox}>
            <strong>Corporate & Public Relations Office</strong><br />
            The Desi Andaz Media Network<br />
            Near Everett Mission School Dhanush Puja, Gokulpur, Pakur, Jharkhand 816107
          </div>
        </main>
      </div>
    </div>
  );
}
