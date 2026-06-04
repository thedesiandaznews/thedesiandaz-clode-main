import Link from 'next/link';
import styles from './footer.module.css';

export default function Footer() {
  const quickLinks = [
    { href: '/',        label: 'Home'       },
    { href: 'https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d', label: 'Certificate' },

    { href: '/livetv',  label: 'Live TV'    },
    { href: '/epaper',  label: 'E-Paper'    },
    { href: '/anonymous', label: 'Anonymous' },
    { href: '/politics', label: 'Politics'  },
  ];

  const companyLinks = [
    { href: '/about',   label: 'About Us'        },
    { href: '/contact', label: 'Contact Us'       },
    { href: '/advertise', label: 'Advertise with Us' },
    { href: '/affiliates', label: 'Affiliate Program' },
    { href: '/reporter/login', label: 'Reporter Portal' },
    { href: '/reporter-verification', label: 'Verify Reporter' },
    { href: '#',        label: 'Privacy Policy'   },
    { href: '#',        label: 'Terms of Service' },
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
              Registration Number: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>JHBIL/26/A3245</span>
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

          {/* Quick Links */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Quick Links</h4>
            <div className={styles.links}>
              {quickLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} className={styles.link}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Company</h4>
            <div className={styles.links}>
              {companyLinks.map(l => (
                <Link key={l.href + l.label} href={l.href} className={styles.link}>{l.label}</Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className={styles.bottomBar}>
        © {new Date().getFullYear()} The Desi Andaz Media Network. All rights reserved.
      </div>
    </footer>
  );
}
