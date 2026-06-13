import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Community Guidelines | The Desi Andaz Media Network',
  description: 'Understand the guidelines for comments, discussions, respectful communications, and spam exclusions on The Desi Andaz news portal.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/community-guidelines',
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Community Guidelines</h1>
          <div className={styles.headerSubtitle}>Rules for Public Discussions</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz encourages constructive discussions and citizen participation. We value the opinions of our readers. To maintain a safe and respectful environment, all users must follow these Community Guidelines.
          </p>

          <h2>1. Respectful Communication</h2>
          <p>
            Be polite and respectful. Abusive remarks, personal attacks, harassment, or threats directed at authors, subjects of news, or other commenters will not be tolerated.
          </p>

          <h2>2. Zero Tolerance for Hate Speech</h2>
          <p>
            We ban comments that promote violence, discrimination, or hatred based on race, religion, ethnicity, gender, caste, nationality, sexual orientation, or physical disability.
          </p>

          <h2>3. Anti-Spam & Self-Promotion</h2>
          <p>
            Do not use comment sections or citizen reports to publish spam, advertisements, affiliate links, or repetitive messages. Comments containing promotional materials will be removed.
          </p>

          <h2>4. No Illegal Content</h2>
          <p>
            Users must not share materials that violate intellectual property rights, promote illegal activities, contain explicit images, or compromise another individual&apos;s privacy.
          </p>

          <h2>5. Moderation Policy</h2>
          <p>
            Our team reserves the right to edit, delete, or suspend commenting privileges for any user who violates these rules. If you see comments that breach these guidelines, please report them to news@thedesiandaz.com.
          </p>

          <div className={styles.badgeBox}>
            <strong>Community Relations</strong><br />
            The Desi Andaz Media Network<br />
            Email: news@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
