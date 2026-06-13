import { Metadata } from 'next';
import styles from '@/app/legal.module.css';

export const metadata: Metadata = {
  title: 'Editorial Team | The Desi Andaz Media Network',
  description: 'Meet the editorial team, reporters, correspondents, and managing directors behind The Desi Andaz news media network.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/editorial-team',
  },
};

export default function EditorialTeamPage() {
  const teamMembers = [
    {
      name: 'Sonu Kumar Saha',
      role: 'Founder & Managing Director',
      bio: 'Sonu Kumar Saha is a visionary media entrepreneur and journalist dedicated to bringing ground-level transparency and accountability to regional journalism across Santhal Pargana and Jharkhand.',
    },
    {
      name: 'Sonu Kumar Saha',
      role: 'Editor-in-Chief',
      bio: 'Directs the editorial desk, news validation processes, fact-checking reviews, and final publications at The Desi Andaz. Committed to fair, non-partisan public interest journalism.',
    },
    {
      name: 'Regional Correspondents Desk',
      role: 'State & Local Reporters',
      bio: 'A network of verified, local correspondents reporting live from Pakur, Ranchi, Dumka, Sahibganj, Deoghar, and blocks of Jharkhand to capture the real voice of the citizens.',
    },
    {
      name: 'Digital & Media Desk',
      role: 'Video & Design Team',
      bio: 'Manages visual assets, broadcast news graphics, scrolling video tickers, and digital newspaper publications for our print and social media feeds.',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Editorial Team</h1>
          <div className={styles.headerSubtitle}>The Faces Behind The Desi Andaz</div>
        </header>

        <main className={styles.contentSection}>
          <p>
            The Desi Andaz Media Network is supported by an active, independent team of editorial writers, local correspondents, and technical coordinators working from our Jharkhand headquarters to deliver authentic news.
          </p>

          <div className={styles.teamGrid}>
            {teamMembers.map((member, idx) => (
              <div key={idx} className={styles.profileCard}>
                <div className={styles.profileRole}>{member.role}</div>
                <h3 className={styles.profileName}>{member.name}</h3>
                <p className={styles.profileBio}>{member.bio}</p>
              </div>
            ))}
          </div>

          <div className={styles.badgeBox}>
            <strong>Corporate & Editorial HQ</strong><br />
            The Desi Andaz Media Network<br />
            Near Everett Mission School Dhanush Puja, Gokulpur, Pakur, Jharkhand 816107<br />
            Email: news@thedesiandaz.com | Phone: +91 8409659560
          </div>
        </main>
      </div>
    </div>
  );
}
