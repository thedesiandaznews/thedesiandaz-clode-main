import Link from 'next/link';
import styles from './footer.module.css';

export default function Footer() {
  const editorialLinks = [
    { href: '/editorial-policy',      label: 'Editorial Policy' },
    { href: '/fact-checking-policy',  label: 'Fact Checking' },
    { href: '/corrections-policy',    label: 'Corrections Policy' },
    { href: '/ethics-policy',         label: 'Ethics Policy' },
    { href: '/news-transparency',      label: 'News Transparency' },
    { href: '/grievance-redressal',   label: 'Grievance Redressal' },
    { href: '/editorial-team',        label: 'Editorial Team' },
  ];

  const legalLinks = [
    { href: '/privacy',               label: 'Privacy Policy' },
    { href: '/terms',                 label: 'Terms & Conditions' },
    { href: '/disclaimer',            label: 'Disclaimer' },
    { href: '/cookie-policy',         label: 'Cookie Policy' },
    { href: '/advertising-policy',     label: 'Advertising Policy' },
    { href: '/copyright-policy',      label: 'Copyright Policy' },
    { href: '/dmca-policy',           label: 'DMCA Policy' },
    { href: '/community-guidelines',  label: 'Community Guidelines' },
    { href: '/refund-policy',         label: 'Refund Policy' },
    { href: '/return-policy',         label: 'Return Policy' },
  ];

  const companyLinks = [
    { href: '/about',                 label: 'About Us' },
    { href: '/contact',               label: 'Contact Us' },
    { href: '/advertise',             label: 'Advertise with Us' },
    { href: '/affiliates',             label: 'Affiliate Program' },
    { href: '/correspondent',          label: 'Correspondent Page' },
    { href: '/correspondent-verification', label: 'Correspondent Verify Page' },
    { href: '/livetv',                label: 'Live TV' },
    { href: '/epaper',                label: 'E-Paper' },
    { href: '/sitemap.xml',           label: 'Sitemap' },
    { href: 'https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d', label: 'PRGI Certificate' },
  ];

  const socials = [
    { href: 'https://facebook.com/thedesiandaznews', icon: 'fab fa-facebook-f', label: 'Facebook'  },
    { href: 'https://twitter.com/thedesiandaznews',  icon: 'fab fa-x-twitter',  label: 'Twitter/X' },
    { href: 'https://youtube.com/@thedesiandaznews', icon: 'fab fa-youtube',    label: 'YouTube'   },
    { href: 'https://instagram.com/thedesiandaznews', icon: 'fab fa-instagram',  label: 'Instagram' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>

          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.brandName}>
              The Desi Andaz Media Network
            </div>
            <p className={styles.brandDesc} style={{ color: '#888', fontSize: '12px', marginTop: '-6px', marginBottom: '14px' }}>
              RNI Registration Number: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>JHBIL/26/A3245</span>
            </p>
            <p className={styles.brandDesc} style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
              देसी नज़रिया, सच्ची खबर।
            </p>
            <p className={styles.brandDesc} style={{ marginBottom: '18px' }}>
              भारत का सबसे तेज़ी से उभरता हुआ स्वतंत्र मीडिया नेटवर्क।
            </p>
            <div className={styles.socials}>
              {socials.map(s => (
                <a key={s.label} href={s.href} className={styles.socialIcon} aria-label={s.label}>
                  <i className={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Editorial */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Editorial & Transparency</h4>
            <div className={styles.links}>
              {editorialLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} className={styles.link}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Legal & Policies</h4>
            <div className={styles.links}>
              {legalLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} className={styles.link}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Column 4: Company */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Company & Portals</h4>
            <div className={styles.links}>
              {companyLinks.map(l => (
                l.href.startsWith('http') ? (
                  <a key={l.href + l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{l.label}</a>
                ) : (
                  <Link key={l.href + l.label} href={l.href} className={styles.link}>{l.label}</Link>
                )
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className={styles.bottomBar}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#888' }}>
          © {new Date().getFullYear()} The Desi Andaz Media Network
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          RNI Registration Number: JHBIL/26/A3245 | All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
