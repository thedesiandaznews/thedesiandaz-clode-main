'use client';

import { useState } from 'react';
import styles from './contact.module.css';

// ── Data ─────────────────────────────────────────────────────────────────────

const infoCards = [
  { icon: 'fas fa-map-marker-alt', label: 'Headquarters', value: 'Pakur, Jharkhand — 816107' },
  { icon: 'fas fa-phone',          label: 'Direct Line',   value: '+91 8409659560' },
  { icon: 'fas fa-envelope',       label: 'General',       value: 'info@thedesiandaz.com' },
  { icon: 'fas fa-clock',          label: 'Working Hours', value: 'Mon–Sat, 9AM–7PM' },
];

const contactDetails = [
  { icon: 'fas fa-map-marker-alt',    label: 'Headquarters', value: 'Pakur, Jharkhand — 816107' },
  { icon: 'fas fa-phone',             label: 'Direct Line',   value: '+91 8409659560' },
  { icon: 'fas fa-envelope-open-text', label: 'General',      value: 'info@thedesiandaz.com' },
];

const deptEmails = [
  { label: 'News Desk',      email: 'news@thedesiandaz.com' },
  { label: 'Ads & Media',   email: 'ads@thedesiandaz.com' },
  { label: 'Certificate Inquiry', email: 'business@thedesiandaz.com' },
  { label: 'Legal & Rights', email: 'legal@thedesiandaz.com' },
];

const inquiryOptions = [
  'Select Reason',
  'Editorial Submission (समाचार सबमिशन)',
  'Advertising & Media Kit (विज्ञापन)',
  'Certificate Verification (प्रमाणपत्र)',
  'Legal & Rights (कानूनी)',
  'General Query (सामान्य)',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContactClient() {
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1400);
  };

  return (
    <article className={styles.page}>

      {/* ── Cinematic bg glows ── */}
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.inner}>

        {/* ── HERO HEADER ── */}
        <div className={styles.heroHeader}>
          <div className={styles.heroBadge}>
            <i className="fas fa-satellite-dish" />
            संपर्क करें
          </div>
          <h1 className={styles.heroTitle}>
            हमसे <span>बात करें</span>
          </h1>
          <div className={styles.heroDivider} />
          <p className={styles.heroSubtitle}>
            खबर हो, विज्ञापन हो या कोई सुझाव — हम हमेशा आपकी बात सुनने के लिए तैयार हैं।
          </p>
        </div>

        {/* ── INFO STRIP ── */}
        <div className={styles.infoStrip}>
          {infoCards.map((card, i) => (
            <div key={i} className={styles.infoCard} id={`info-card-${i}`}>
              <div className={styles.infoCardIcon}>
                <i className={card.icon} />
              </div>
              <div className={styles.infoCardContent}>
                <div className={styles.infoCardLabel}>{card.label}</div>
                <div className={styles.infoCardValue}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN LAYOUT: FORM + SIDEBAR ── */}
        <div className={styles.layout}>

          {/* ── CONTACT FORM CARD ── */}
          <div className={styles.formCard}>
            <h2 className={styles.formHeading}>हमें संदेश भेजें</h2>
            <div className={styles.formDivider} />

            {sent ? (
              <div className={styles.successMsg}>
                <i className="fas fa-check-circle" style={{ fontSize: 20 }} />
                संदेश भेज दिया गया! हम जल्द ही आपसे संपर्क करेंगे।
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit} noValidate>

                {/* Name + Email row */}
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="contact-name">Full Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="आपका पूरा नाम"
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="contact-email">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="email@example.com"
                      className={styles.input}
                      required
                    />
                  </div>
                </div>

                {/* Phone + Inquiry row */}
                <div className={styles.formRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="contact-phone">Phone (Optional)</label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel} htmlFor="contact-inquiry">Nature of Inquiry</label>
                    <select
                      id="contact-inquiry"
                      className={styles.input}
                      style={{ cursor: 'pointer' }}
                      defaultValue=""
                    >
                      {inquiryOptions.map((opt, i) => (
                        <option key={i} value={i === 0 ? '' : opt} style={{ background: '#1a1a1a' }}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel} htmlFor="contact-message">Your Message</label>
                  <textarea
                    id="contact-message"
                    placeholder="अपना संदेश यहाँ लिखें..."
                    className={`${styles.input} ${styles.textarea}`}
                    required
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={sending}
                  id="contact-submit-btn"
                >
                  {sending ? (
                    <>भेज रहे हैं... <i className="fas fa-spinner fa-spin" /></>
                  ) : (
                    <>संदेश भेजें <i className="fas fa-paper-plane" /></>
                  )}
                </button>

              </form>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className={styles.sidebar}>

            {/* Command Center card */}
            <div className={styles.commandCard}>
              <div className={styles.commandTitle}>Command Center</div>
              <div className={styles.contactInfoList}>
                {contactDetails.map((item, i) => (
                  <div key={i} className={styles.contactInfoItem}>
                    <div className={styles.iconBox}>
                      <i className={item.icon} />
                    </div>
                    <div className={styles.contactInfoItemContent}>
                      <div className={styles.contactInfoItemLabel}>{item.label}</div>
                      <div className={styles.contactInfoItemValue}>
                        {item.label === 'Direct Line' ? (
                          <a href={`tel:${item.value.replace(/\s/g, '')}`}>{item.value}</a>
                        ) : item.label === 'General' ? (
                          <a href={`mailto:${item.value}`}>{item.value}</a>
                        ) : (
                          item.value
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dept emails grid */}
              <div className={styles.deptGrid}>
                {deptEmails.map((dept, i) => (
                  <div key={i} className={styles.deptItem} id={`dept-${i}`}>
                    <div className={styles.deptItemLabel}>{dept.label}</div>
                    <div className={styles.deptItemEmail}>{dept.email}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/918409659560"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappCta}
              id="whatsapp-cta"
            >
              <div className={styles.whatsappIcon}>
                <i className="fab fa-whatsapp" style={{ color: '#fff', fontSize: 20 }} />
              </div>
              <div className={styles.whatsappCtaText}>
                <div className={styles.whatsappCtaTitle}>WhatsApp पर संपर्क करें</div>
                <div className={styles.whatsappCtaDesc}>तुरंत जवाब पाएं — सुबह 9 से शाम 7</div>
              </div>
              <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', opacity: 0.4, fontSize: 12 }} />
            </a>

            {/* Social pulse */}
            <div className={styles.socialCard}>
              <div className={styles.socialCardTitle}>Follow the Pulse</div>
              <div className={styles.socialPills}>
                <a href="#" className={`${styles.socialPill} ${styles.fb}`} id="contact-fb" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="#" className={`${styles.socialPill} ${styles.tw}`} id="contact-tw" aria-label="Twitter / X">
                  <i className="fab fa-x-twitter" />
                </a>
                <a href="#" className={`${styles.socialPill} ${styles.yt}`} id="contact-yt" aria-label="YouTube">
                  <i className="fab fa-youtube" />
                </a>
                <a href="#" className={`${styles.socialPill} ${styles.ig}`} id="contact-ig" aria-label="Instagram">
                  <i className="fab fa-instagram" />
                </a>
              </div>
            </div>

          </aside>
        </div>

      </div>
    </article>
  );
}
