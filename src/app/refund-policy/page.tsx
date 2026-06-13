import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Refund Policy | The Desi Andaz Media Network',
  description: 'Read the refund policy details regarding advertising services, sponsored content, and promotional campaigns on The Desi Andaz.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Refund Policy</h1>
          <div className={styles.headerSubtitle}>Terms for Commercial Services</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            This Refund Policy outlines the terms and conditions regarding cancellations and refunds for advertising services, sponsored campaigns, and promotional placements purchased from The Desi Andaz Media Network.
          </p>

          <h2>1. Advertising Services</h2>
          <p>
            - <strong>Pre-Launch Cancellations:</strong> Advertisers who cancel their campaign contracts before the creatives go live on our website, newspaper, or video feeds are eligible for a **full refund**, minus a 10% administrative and design fee.
            <br />
            - <strong>Post-Launch:</strong> Once an advertisement banner, scrolling ticker, or print ad campaign has gone live, no refunds will be issued for the active billing cycle.
          </p>

          <h2>2. Sponsored Content</h2>
          <p>
            If a sponsored article or promotional release is rejected by our editorial board due to a violation of our editorial guidelines (e.g. promoting illegal products, containing defamatory claims, etc.), a **full refund** will be issued to the client. If the article is published and later removed due to a legal complaint or ECI guidelines violation, no refund will be issued.
          </p>

          <h2>3. Refund Processing</h2>
          <p>
            Approved refunds will be processed within **7 to 10 working days** back to the original payment method (bank transfer, UPI, or credit card).
          </p>

          <div className={styles.badgeBox}>
            <strong>Billing & Ads Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: business@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
