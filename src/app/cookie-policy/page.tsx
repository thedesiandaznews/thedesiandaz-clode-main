import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Cookie Policy | The Desi Andaz Media Network',
  description: 'Learn about cookie usage, analytics cookies, advertising cookies, and how to manage cookie consents at The Desi Andaz.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/cookie-policy',
  },
};

export default function CookiePolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Cookie Policy</h1>
          <div className={styles.headerSubtitle}>How We Use Cookies</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            This Cookie Policy explains how The Desi Andaz Media Network uses cookies and similar technologies to recognize you when you visit our website at https://www.thedesiandaz.com.
          </p>

          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small data files placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>
            We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as &quot;essential&quot; or &quot;strictly necessary&quot; cookies. Other cookies enable us to track and target the interests of our users to enhance their experience.
          </p>

          <h2>3. Analytics & Performance Cookies</h2>
          <p>
            These cookies collect information that is used either in aggregate form to help us understand how our website is being used, or how effective our marketing campaigns are, or to help us customize our website for you. We use Google Analytics for this purpose.
          </p>

          <h2>4. Advertising Cookies</h2>
          <p>
            These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests. We use Google AdSense to serve ads.
          </p>

          <h2>5. Managing Cookies</h2>
          <p>
            You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website, though your access to some functionality and areas of our website may be restricted.
          </p>

          <div className={styles.badgeBox}>
            <strong>Privacy & Data Protection Contact</strong><br />
            The Desi Andaz Media Network<br />
            Email: info@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
