'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './auth.module.css';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loading,  setLoading]  = useState<string | null>(null);

  const handleSocialLogin = (platform: string) => {
    setLoading(platform);
    setTimeout(() => {
      setLoading(null);
      alert(`${platform} Login — coming soon in production!`);
    }, 1400);
  };

  const headings: Record<AuthMode, string> = {
    login:  'आपका स्वागत है',
    signup: 'खाता बनाएँ',
    forgot: 'पासवर्ड रीसेट',
  };

  const subheadings: Record<AuthMode, string> = {
    login:  'अपनी जानकारी दर्ज करें',
    signup: 'न्यूज़ वर्ल्ड में शामिल हों',
    forgot: 'अपना ईमेल दर्ज करें, हम लिंक भेजेंगे',
  };

  const submitLabels: Record<AuthMode, string> = {
    login:  'लॉगिन करें',
    signup: 'रजिस्टर करें',
    forgot: 'रीसेट लिंक भेजें',
  };

  // Toggle indicator position
  const indicatorLeft = authMode === 'login' ? '5px' : 'calc(50%)';

  return (
    <div className={styles.page}>

      {/* ── Cinematic BG ── */}
      <img
        src="https://picsum.photos/1920/1080?random=555"
        alt=""
        aria-hidden="true"
        className={styles.bgImg}
      />
      <div className={styles.bgOverlay} aria-hidden="true" />

      {/* ── Auth Card ── */}
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logoWrap}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoText}>
              <span className={styles.logoRed}>THE DESI</span>
              <span className={styles.logoWhite}> ANDAZ</span>
            </div>
          </Link>
          <div className={styles.logoSub}>आपका अपना न्यूज़ पोर्टल</div>
        </div>

        {/* Toggle — only for login/signup */}
        {authMode !== 'forgot' && (
          <div className={styles.toggle} role="tablist">
            <div
              className={styles.toggleIndicator}
              style={{ left: indicatorLeft }}
              aria-hidden="true"
            />
            <button
              role="tab"
              id="auth-tab-login"
              className={`${styles.toggleBtn} ${authMode === 'login' ? styles.toggleBtnActive : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              role="tab"
              id="auth-tab-signup"
              className={`${styles.toggleBtn} ${authMode === 'signup' ? styles.toggleBtnActive : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form area */}
        <div className={styles.formSection}>
          <h1 className={styles.formHeading}>{headings[authMode]}</h1>
          <p className={styles.formSubheading}>{subheadings[authMode]}</p>

          <form className={styles.form} onSubmit={e => e.preventDefault()} noValidate>

            {/* Name — signup only */}
            {authMode === 'signup' && (
              <div className={styles.inputWrap}>
                <i className={`fas fa-user ${styles.inputIcon}`} />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="पूरा नाम"
                  className={styles.input}
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div className={styles.inputWrap}>
              <i className={`fas fa-envelope ${styles.inputIcon}`} />
              <input
                id="auth-email"
                type="email"
                placeholder="ईमेल"
                className={styles.input}
                autoComplete="email"
              />
            </div>

            {/* Password — login & signup only */}
            {authMode !== 'forgot' && (
              <div className={styles.inputWrap}>
                <i className={`fas fa-lock ${styles.inputIcon}`} />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="पासवर्ड"
                  className={styles.input}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            )}

            {/* Remember me + Forgot */}
            {authMode === 'login' && (
              <div className={styles.rememberRow}>
                <label className={styles.rememberLabel} htmlFor="auth-remember">
                  <input
                    id="auth-remember"
                    type="checkbox"
                    className={styles.rememberCheck}
                  />
                  मुझे याद रखें
                </label>
                <button
                  type="button"
                  className={styles.forgotBtn}
                  id="auth-forgot-btn"
                  onClick={() => setAuthMode('forgot')}
                >
                  पासवर्ड भूल गए?
                </button>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className={styles.btnSubmit} id="auth-submit-btn">
              {submitLabels[authMode]}
            </button>

            {/* Back to login */}
            {authMode === 'forgot' && (
              <button
                type="button"
                className={styles.backBtn}
                id="auth-back-btn"
                onClick={() => setAuthMode('login')}
              >
                ← वापस लॉगिन पर जाएँ
              </button>
            )}
          </form>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>अन्य तरीके</span>
          <div className={styles.dividerLine} />
        </div>

        {/* Social buttons */}
        <div className={styles.socialBtns}>
          {[
            { name: 'Google',   icon: 'fab fa-google'     },
            { name: 'Facebook', icon: 'fab fa-facebook-f' },
            { name: 'Apple',    icon: 'fab fa-apple'      },
          ].map(s => (
            <button
              key={s.name}
              id={`social-${s.name.toLowerCase()}`}
              className={styles.socialBtn}
              onClick={() => handleSocialLogin(s.name)}
              aria-label={`${s.name} से लॉगिन`}
            >
              {loading === s.name
                ? <i className="fas fa-spinner fa-spin" />
                : <i className={s.icon} />
              }
            </button>
          ))}
        </div>

      </div>

      {/* Footer links */}
      <div className={styles.footerLinks}>
        © 2026 The Desi Andaz —{' '}
        <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
        {' '}|{' '}
        <Link href="/terms" className={styles.footerLink}>Terms</Link>
      </div>

    </div>
  );
}
