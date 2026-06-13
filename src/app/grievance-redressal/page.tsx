import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Grievance Redressal | The Desi Andaz Media Network',
  description: 'Submit formal grievances or content complaints under the Information Technology Rules 2021 to our Grievance Redressal Officer.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/grievance-redressal',
  },
};

export default function GrievanceRedressalPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Grievance Redressal</h1>
          <div className={styles.headerSubtitle}>IT Rules 2021 Compliance</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, The Desi Andaz Media Network has established a Grievance Redressal mechanism to address complaints regarding our digital news content.
          </p>

          <h2>1. Complaint Submission</h2>
          <p>
            Any person who has a grievance regarding the news content published on our website can file a formal complaint. The complaint must include:
            <br />
            - Full name, email address, and mobile number of the complainant.
            <br />
            - The exact URL of the news article or video bulletin in question.
            <br />
            - Specific details of the grievance (factual error, defamation, copyright issue, ECI guidelines breach, etc.).
          </p>

          <h2>2. How to Submit</h2>
          <p>
            Grievance complaints must be submitted in writing via email to our Grievance Officer:
            <br />
            <strong>Email: legal@thedesiandaz.com</strong>
          </p>

          <h2>3. Review Process & Timeline</h2>
          <p>
            - <strong>Acknowledgment:</strong> We will acknowledge receipt of your complaint within **24 hours** of submission.
            <br />
            - <strong>Resolution:</strong> The Grievance Officer will review the complaint in accordance with journalistic codes and IT Rules 2021, resolving it within **15 days** from receipt.
          </p>

          <h2>4. Escalation Procedure</h2>
          <p>
            If you are not satisfied with the resolution provided by our Grievance Officer, you may appeal the decision to the independent self-regulatory bodies of digital news publishers registered with the Ministry of Information & Broadcasting, Government of India.
          </p>

          <div className={styles.badgeBox}>
            <strong>Grievance Redressal Officer</strong><br />
            The Desi Andaz Media Network<br />
            Address: Near Everett Mission School Dhanush Puja, Gokulpur, Pakur, Jharkhand 816107<br />
            Email: legal@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
