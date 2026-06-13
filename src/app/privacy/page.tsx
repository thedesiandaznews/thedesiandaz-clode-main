import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy | The Desi Andaz Media Network',
  description: 'Learn how The Desi Andaz Media Network collects, protects, and uses data in compliance with DPDP, GDPR, and AdSense protocols.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Privacy Policy</h1>
          <div className={styles.headerSubtitle}>Last Updated: June 13, 2026</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network (operating &quot;The Desi Andaz&quot;, available at https://www.thedesiandaz.com) respects your privacy and is committed to protecting the personal data of our readers, subscribers, and clients.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when subscribing to our newsletters, posting comments, submitting citizen news reports, or contacting us directly. This includes your name, email address, phone number, and location.
          </p>

          <h2>2. Use of Cookies & Tracking</h2>
          <p>
            Our website uses cookies to enhance user experience, track site traffic, and personalize advertisements. Cookies are small files stored on your device that help analyze web traffic. You can manage or disable cookies through your web browser preferences.
          </p>

          <h2>3. Google AdSense & Third-Party Advertising</h2>
          <p>
            We use Google AdSense and third-party advertising vendors to display relevant commercials to our readers. These vendors use cookies (such as the DoubleClick DART cookie) to serve ads based on users&apos; visits to this and other websites. You may opt-out of personalized advertising by visiting Google&apos;s Ads Settings.
          </p>

          <h2>4. Google Analytics</h2>
          <p>
            We use Google Analytics to monitor and analyze web traffic and user behavior. The data collected by Google Analytics helps us improve content delivery. This information is anonymized and does not include personally identifiable records.
          </p>

          <h2>5. Data Protection & User Rights</h2>
          <p>
            In compliance with the Digital Personal Data Protection (DPDP) Act of India, GDPR, and other global standards, you have the right to access, rectify, restrict processing, or request the deletion of your personal data. To exercise these rights, please contact our Grievance Officer at legal@thedesiandaz.com.
          </p>

          <div className={styles.badgeBox}>
            <strong>Grievance & Legal Desk</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
