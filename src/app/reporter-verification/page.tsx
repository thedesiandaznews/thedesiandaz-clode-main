'use client';

import React, { useState } from 'react';
import styles from './verification.module.css';
import { verifyReporterByCode } from '@/actions/reporter';

export default function ReporterVerificationPage() {
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporter, setReporter] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setLoading(true);
    setError(null);
    setReporter(null);
    setSearched(true);

    try {
      const res = await verifyReporterByCode(searchCode.trim());
      if (res.success && res.reporter) {
        setReporter(res.reporter);
      } else {
        setError(res.message || 'No reporter found with this ID.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={styles.page}>
      {/* Background glow shadow effects */}
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.inner}>
        
        {/* HERO HEADER */}
        <div className={styles.heroHeader}>
          <div className={styles.heroBadge}>
            <i className="fas fa-id-card" />
            सत्यापन केंद्र • Verification Desk
          </div>
          <h1 className={styles.heroTitle}>
            पत्रकार <span>सत्यापन</span>
          </h1>
          <div className={styles.heroDivider} />
          <p className={styles.heroSubtitle}>
            Verify the authenticity of Desi Andaz network reporters by entering the official Reporter ID printed on their ID cards.
            <br />
            आईडी कार्ड पर छपे आधिकारिक रिपोर्टर आईडी नंबर को दर्ज करके रिपोर्टर की सत्यता की जांच करें।
          </p>
        </div>

        {/* VERIFICATION SEARCH CARD */}
        <div className={styles.verificationCard}>
          <form onSubmit={handleVerify} className={styles.form}>
            <label htmlFor="reporter-id-input" className={styles.formLabel}>
              Enter Official Reporter ID (जैसे: TDA/26/05/0001)
            </label>
            <div className={styles.searchBar}>
              <input
                id="reporter-id-input"
                type="text"
                placeholder="TDA/YY/MM/XXXX"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className={styles.input}
                required
                disabled={loading}
              />
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading || !searchCode.trim()}
              >
                {loading ? (
                  <>Verifying... <i className="fas fa-spinner fa-spin" /></>
                ) : (
                  <>Verify ID <i className="fas fa-shield-alt" /></>
                )}
              </button>
            </div>
          </form>

          {/* VERIFICATION RESULTS SYSTEM */}
          {searched && !loading && (
            <div className={styles.resultContainer}>
              {error && (
                <div className={`${styles.statusBanner} ${styles.bannerDanger}`}>
                  <i className="fas fa-times-circle" style={{ fontSize: '20px' }} />
                  <div>
                    <span style={{ display: 'block', fontWeight: 800 }}>ID Verification Failed • सत्यापन विफल</span>
                    <span style={{ fontSize: '13px', opacity: 0.9 }}>{error} • विवरण दर्ज करते समय आईडी फॉर्मेट की जांच कर लें।</span>
                  </div>
                </div>
              )}

              {reporter && (
                <>
                  {reporter.status === 'Approved' && (
                    <div className={`${styles.statusBanner} ${styles.bannerSuccess}`}>
                      <i className="fas fa-check-circle" style={{ fontSize: '20px' }} />
                      <div>
                        <span style={{ display: 'block', fontWeight: 800 }}>✅ ACTIVE VERIFIED REPORTER • सक्रिय सत्यापित पत्रकार</span>
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>This reporter is an officially certified member of Desi Andaz News Network.</span>
                      </div>
                    </div>
                  )}

                  {reporter.status === 'Suspended' && (
                    <div className={`${styles.statusBanner} ${styles.bannerDanger}`}>
                      <i className="fas fa-ban" style={{ fontSize: '20px' }} />
                      <div>
                        <span style={{ display: 'block', fontWeight: 800 }}>🚫 SUSPENDED REPORTER • निलंबित रिपोर्टर</span>
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>This reporter account is currently suspended/blocked by the editorial board.</span>
                      </div>
                    </div>
                  )}

                  {reporter.status !== 'Approved' && reporter.status !== 'Suspended' && (
                    <div className={`${styles.statusBanner} ${styles.bannerWarning}`}>
                      <i className="fas fa-exclamation-triangle" style={{ fontSize: '20px' }} />
                      <div>
                        <span style={{ display: 'block', fontWeight: 800 }}>⚠️ INACTIVE REPORTER • निष्क्रिय रिपोर्टर</span>
                        <span style={{ fontSize: '13px', opacity: 0.9 }}>This reporter KYC credentials are inactive, rejected, or under review.</span>
                      </div>
                    </div>
                  )}

                  {/* Profile Dossier details */}
                  <div className={styles.profileCard}>
                    <div className={styles.avatarWrapper}>
                      <img
                        src={reporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231f2937"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                        alt={reporter.fullName}
                        className={styles.avatar}
                      />
                    </div>
                    <div className={styles.details}>
                      <h2 className={styles.name}>{reporter.fullName}</h2>
                      <span className={styles.code}>{reporter.reporterCode}</span>
                      
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Network Status / स्थिति</span>
                          <span className={styles.infoValue} style={{ color: reporter.status === 'Approved' ? '#10b981' : reporter.status === 'Suspended' ? '#ef4444' : '#f59e0b' }}>
                            {reporter.status === 'Approved' ? 'Active' : reporter.status === 'Suspended' ? 'Suspended' : 'Inactive'}
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Location / स्थान</span>
                          <span className={styles.infoValue}>{reporter.district}, {reporter.state}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Network Joining / तिथि</span>
                          <span className={styles.infoValue}>{new Date(reporter.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>Authorization / अधिकार</span>
                          <span className={styles.infoValue}>{reporter.status === 'Approved' ? 'Authorized News Correspondent' : 'Unauthorized / Blocked'}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.watermark}>TDA</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
