'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './epaper.module.css';

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

export default function EpaperViewer({ activePaper, archives }: { activePaper: any, archives: any[] }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const pages = activePaper?.pages ? JSON.parse(activePaper.pages).filter((p: any) => typeof p === 'string' && p.trim() !== '') : [];
  const selectedDate = activePaper ? new Date(activePaper.date).toISOString().split('T')[0] : '';

  const handleDownload = () => {
    if (!activePaper?.pdfUrl) {
      alert('PDF currently unavailable for this date.');
      return;
    }
    const viewUrl = activePaper.pdfUrl.startsWith('data:')
      ? `/api/epaper/pdf?id=${activePaper.id}`
      : activePaper.pdfUrl;
    window.open(viewUrl, '_blank');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
    alert('Link copied to clipboard!');
  };

  const handleDateChange = (date: string) => {
    router.push(`/epaper?date=${date}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── BREADCRUMB + TITLE ── */}
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>होम</Link> » ई-पेपर
        </nav>
        <h1 className={styles.pageTitle}>📰 द देसी अंदाज़: ई-पेपर</h1>

        {/* ── TOOLBAR ── */}
        <div className={styles.toolbar}>
          <div>
            <div className={styles.dateLabel}>📅 तारीख चुनें</div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.toolbarActions}>
            <button 
              className={styles.btnDownload} 
              onClick={handleDownload}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', flex: '1', justifyContent: 'center' }}
            >
              <i className="fas fa-file-pdf" style={{ fontSize: '1.2em' }} /> 
              <span className="m-hide">{activePaper ? new Date(activePaper.date).toLocaleDateString('hi-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }) : 'आज'} का ई-पेपर </span>
              डाउनलोड करें
            </button>
            <button className={styles.btnShare} onClick={handleShare} style={{ flex: '1', justifyContent: 'center' }}>
              <i className="fas fa-share-alt" /> साझा करें
            </button>
          </div>
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className={styles.layout}>
          {activePaper?.pdfUrl ? (
            <main className={styles.viewer}>
              {/* Desktop Interactive PDF Embed */}
              <div className={styles.pdfEmbedContainer}>
                <div style={{ background: 'var(--white)', padding: '14px 20px', borderRadius: '12px 12px 0 0', border: '1px solid var(--border)', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', width: '100%' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-file-pdf" style={{ color: '#ef4444' }} /> {activePaper.title || 'दैनिक ई-पेपर अंक'} ({new Date(activePaper.date).toLocaleDateString('hi-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })})
                  </span>
                  <a 
                    href={activePaper.pdfUrl.startsWith('data:') ? `/api/epaper/pdf?id=${activePaper.id}` : activePaper.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fas fa-external-link-alt" /> फुल स्क्रीन में खोलें
                  </a>
                </div>
                <div style={{ height: 'calc(100vh - 250px)', minHeight: '500px', borderRadius: '0 0 16px 16px', overflow: 'hidden', border: '1px solid var(--border)', background: '#525659', boxShadow: 'var(--shadow-md)', width: '100%' }}>
                  <iframe
                    src={`${activePaper.pdfUrl.startsWith('data:') ? `/api/epaper/pdf?id=${activePaper.id}` : activePaper.pdfUrl}#toolbar=1&navpanes=0`}
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                    title="Digital E-Paper PDF Viewer"
                  />
                </div>
              </div>

              {/* Mobile Premium Action Card (Graceful Fallback) */}
              <div className={styles.pdfMobileCard}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '8px' }}>
                  <i className="fas fa-file-pdf" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-deva)' }}>
                    {activePaper.title || 'दैनिक ई-पेपर अंक'}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '6px', fontWeight: 700 }}>
                    تारीख: {new Date(activePaper.date).toLocaleDateString('hi-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '5px 12px', borderRadius: '6px', display: 'inline-block', fontWeight: 700, letterSpacing: '0.5px' }}>
                    FORMAT: HIGH QUALITY PDF DOCUMENT
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '280px', marginTop: '10px' }}>
                  <a 
                    href={activePaper.pdfUrl.startsWith('data:') ? `/api/epaper/pdf?id=${activePaper.id}` : activePaper.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'block', background: 'var(--primary)', color: '#fff', textAlign: 'center', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', transition: 'var(--transition)', boxShadow: '0 4px 10px rgba(204,34,0,0.2)' }}
                  >
                    📖 ऑनलाइन पढ़ें (Read Online)
                  </a>
                  <button 
                    onClick={handleDownload}
                    style={{ width: '100%', background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'var(--transition)' }}
                  >
                    📥 पीडीएफ डाउनलोड (Download PDF)
                  </button>
                </div>
              </div>
            </main>
          ) : (
            <main className={styles.viewer}>
              <div className={styles.emptyState}>
                <h3>इस तारीख के लिए कोई ई-पेपर उपलब्ध नहीं है।</h3>
                <p>कृपया कोई अन्य तारीख चुनें या आर्काइव देखें।</p>
              </div>
            </main>
          )}

          {/* ── SIDEBAR ── */}
          <aside className={styles.sidebar}>
            <div className={styles.archiveBox}>
              <div className={styles.archiveBoxTitle}>पुराने अंक (Archives)</div>
              {archives.map((arc) => (
                <div
                  key={arc.id}
                  className={styles.archiveItem}
                  onClick={() => handleDateChange(new Date(arc.date).toISOString().split('T')[0])}
                >
                  <div className={styles.archiveThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
                    <i className="fas fa-file-pdf" style={{ fontSize: '18px', color: '#ef4444' }} />
                  </div>
                  <div>
                    <div className={styles.archiveItemDate}>
                      {new Date(arc.date).toLocaleDateString('hi-IN', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className={styles.archiveItemSub}>दैनिक ई-पेपर (PDF)</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
