'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { useRouter } from 'next/navigation';
import { getSiteSettings, updateSiteSettings } from '@/actions/settings';

export default function SettingsPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [siteName, setSiteName] = useState('The Desi Andaz');
  const [siteIcon, setSiteIcon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Featured Media states
  const [featuredVideoTitle, setFeaturedVideoTitle] = useState('ताज़ा वीडियो बुलेटिन');
  const [featuredVideoUrl, setFeaturedVideoUrl] = useState('');
  const [featuredVideoThumb, setFeaturedVideoThumb] = useState<string | null>(null);
  
  const [featuredPodcastTitle, setFeaturedPodcastTitle] = useState('विशेष पॉडकास्ट एपिसोड');
  const [featuredPodcastUrl, setFeaturedPodcastUrl] = useState('');
  const [featuredPodcastThumb, setFeaturedPodcastThumb] = useState<string | null>(null);

  useEffect(() => {
    // Load existing settings from DB
    getSiteSettings().then(settings => {
      setAdminId(settings.adminId || 'admin');
      setAdminPassword(settings.adminPassword || 'admin123');
      setSiteName(settings.siteName || 'The Desi Andaz');
      setSiteIcon(settings.siteIcon || null);

      setFeaturedVideoTitle(settings.featuredVideoTitle || 'ताज़ा वीडियो बुलेटिन');
      setFeaturedVideoUrl(settings.featuredVideoUrl || '');
      setFeaturedVideoThumb(settings.featuredVideoThumb || null);
      
      setFeaturedPodcastTitle(settings.featuredPodcastTitle || 'विशेष पॉडकास्ट एपिसोड');
      setFeaturedPodcastUrl(settings.featuredPodcastUrl || '');
      setFeaturedPodcastThumb(settings.featuredPodcastThumb || null);

      setLoading(false);
    });
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSiteSettings({ adminId, adminPassword });
    setSuccessMsg('Admin credentials updated successfully! You will be logged out to apply changes.');
    setTimeout(() => {
      localStorage.removeItem('isAdminLoggedIn');
      router.push('/admin/login');
    }, 2500);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const settingsToUpdate: Record<string, string> = { siteName };
    if (siteIcon) {
      settingsToUpdate.siteIcon = siteIcon;
    }
    await updateSiteSettings(settingsToUpdate);
    localStorage.setItem('customSiteName', siteName);
    if (siteIcon) localStorage.setItem('customSiteIcon', siteIcon);
    setSuccessMsg('Site preferences updated in Database successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const settingsToUpdate: Record<string, string> = {
      featuredVideoTitle,
      featuredVideoUrl,
      featuredPodcastTitle,
      featuredPodcastUrl
    };
    if (featuredVideoThumb) settingsToUpdate.featuredVideoThumb = featuredVideoThumb;
    if (featuredPodcastThumb) settingsToUpdate.featuredPodcastThumb = featuredPodcastThumb;
    
    await updateSiteSettings(settingsToUpdate);
    setSuccessMsg('Featured Video and Podcast settings updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSiteIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>System Settings</h1>
      </div>
      {loading && <div style={{ padding: '20px' }}>Loading settings from Database...</div>}
      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '10px' }}></i>
          {successMsg}
        </div>
      )}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Admin Credentials Form */}
          <div className={styles.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <i className="fas fa-user-shield"></i>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Admin Credentials</h2>
            </div>
            <form onSubmit={handleSaveCredentials}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>Admin ID / Username</label>
                <input type="text" value={adminId} onChange={e => setAdminId(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>New Password</label>
                <input type="text" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }} required />
              </div>
              <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
                Update Credentials
              </button>
            </form>
          </div>
          {/* Site Preferences Form */}
          <div className={styles.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ background: '#ecfdf5', color: '#10b981', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <i className="fas fa-globe"></i>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Site Preferences</h2>
            </div>
            <form onSubmit={handleSavePreferences}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>Website Name</label>
                <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }} required />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>This will be reflected across dynamic parts of the UI.</p>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>Site Logo / Icon</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {siteIcon ? (
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                      <img src={siteIcon} alt="Site Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: '#f1f5f9', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleIconUpload} style={{ fontSize: '13px', color: '#475569' }} />
                </div>
              </div>
              <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}>
                Save Preferences
              </button>
            </form>
          </div>

          {/* Featured Media (Video & Podcast) Form */}
          <div className={styles.card} style={{ padding: '24px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ background: '#fff7ed', color: '#ea580c', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <i className="fas fa-play-circle"></i>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Featured Media (Video & Podcast)</h2>
            </div>
            
            <form onSubmit={handleSaveMedia}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                
                {/* COLUMN 1: Video News settings */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ea580c', marginBottom: '16px' }}>⚡ Featured Video News</h3>
                  
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Video Title</label>
                    <input type="text" value={featuredVideoTitle} onChange={e => setFeaturedVideoTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1e293b' }} required />
                  </div>
                  
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>YouTube Video URL or Embed ID</label>
                    <input type="text" value={featuredVideoUrl} onChange={e => setFeaturedVideoUrl(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1e293b' }} placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ" required />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Video Custom Thumbnail</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {featuredVideoThumb ? (
                        <div style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                          <img src={featuredVideoThumb} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '60px', height: '40px', borderRadius: '4px', background: '#e2e8f0', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0, fontSize: '11px' }}>
                          NO IMG
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFeaturedVideoThumb(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} style={{ fontSize: '12px', color: '#475569' }} />
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Podcast settings */}
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '16px' }}>🎙️ Featured Podcast</h3>
                  
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Podcast Title</label>
                    <input type="text" value={featuredPodcastTitle} onChange={e => setFeaturedPodcastTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1e293b' }} required />
                  </div>
                  
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>YouTube Video/Podcast URL or Embed ID</label>
                    <input type="text" value={featuredPodcastUrl} onChange={e => setFeaturedPodcastUrl(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', color: '#1e293b' }} placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ" required />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#475569' }}>Podcast Custom Thumbnail</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {featuredPodcastThumb ? (
                        <div style={{ width: '60px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                          <img src={featuredPodcastThumb} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '60px', height: '40px', borderRadius: '4px', background: '#e2e8f0', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0, fontSize: '11px' }}>
                          NO IMG
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFeaturedPodcastThumb(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} style={{ fontSize: '12px', color: '#475569' }} />
                    </div>
                  </div>
                </div>

              </div>

              <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', background: '#ea580c', borderColor: '#ea580c' }}>
                Save Media Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
