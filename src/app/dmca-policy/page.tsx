import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'DMCA Policy | The Desi Andaz Media Network',
  description: 'Submit copyright complaints, takedown notifications, and counter-notices in accordance with DMCA guidelines.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/dmca-policy',
  },
};

export default function DmcaPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>DMCA Policy</h1>
          <div className={styles.headerSubtitle}>Copyright Infringement Notifications</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network respects intellectual property rights and expects our users and contributors to do the same. In accordance with the Digital Millennium Copyright Act (&quot;DMCA&quot;) and Indian copyright laws, we respond promptly to notices of alleged infringement.
          </p>

          <h2>1. Copyright Takedown Notice</h2>
          <p>
            If you are a copyright owner and believe that any content published on our website infringes your copyrights, you may submit a written notification containing:
            <br />
            - A physical or electronic signature of the copyright owner or authorized representative.
            <br />
            - Identification of the copyrighted work claimed to have been infringed.
            <br />
            - Identification of the material that is claimed to be infringing and its exact URL link.
            <br />
            - Your contact information (address, telephone number, and email).
            <br />
            - A statement that you have a good faith belief that use of the material is not authorized.
            <br />
            - A statement that the information in the notification is accurate under penalty of perjury.
          </p>

          <h2>2. Submitting Takedown Requests</h2>
          <p>
            Please send completed notices to our designated agent at:
            <br />
            <strong>Email: legal@thedesiandaz.com</strong>
          </p>

          <h2>3. Counter Notice Procedure</h2>
          <p>
            If you believe your content was removed in error or by misidentification, you may submit a counter-notice containing your contact details, identification of the removed content, and a statement under perjury requesting its restoration.
          </p>

          <div className={styles.badgeBox}>
            <strong>Designated Legal Agent</strong><br />
            The Desi Andaz Media Network<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
