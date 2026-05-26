'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { getSiteSettings, updateSiteSettings } from '@/actions/settings';

interface ChannelItem {
  id: string;
  label: string;
  ytId: string;
  live: boolean;
}

interface ShowItem {
  name: string;
  time: string;
  live: boolean;
}

export default function LiveTVManagementPage() {
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Channels State
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [newChanLabel, setNewChanLabel] = useState('');
  const [newChanYtId, setNewChanYtId] = useState('');
  const [newChanLive, setNewChanLive] = useState(true);

  // Sponsor State
  const [sponsorLabel, setSponsorLabel] = useState('Premium Sponsor');
  const [sponsorTitle, setSponsorTitle] = useState('Elevate Your Brand');
  const [sponsorDesc, setSponsorDesc] = useState('Join our premium advertising circle and reach millions across India.');
  const [sponsorLink, setSponsorLink] = useState('#');
  const [sponsorImg, setSponsorImg] = useState<string | null>(null);

  // Shows State
  const [shows, setShows] = useState<ShowItem[]>([]);
  const [newShowName, setNewShowName] = useState('');
  const [newShowTime, setNewShowTime] = useState('');
  const [newShowLive, setNewShowLive] = useState(false);

  // Ticker State
  const [tickerText, setTickerText] = useState('');

  // Fetch settings from Database on mount
  useEffect(() => {
    getSiteSettings().then(settings => {
      // 1. Channels
      if (settings.liveTvChannels) {
        try {
          setChannels(JSON.parse(settings.liveTvChannels));
        } catch (e) {
          console.error("Error parsing liveTvChannels", e);
        }
      } else {
        // Default seed
        setChannels([
          { id: 'desiandaz', label: 'The Desi Andaz', ytId: 'IqpWXkK3N6Y', live: true },
          { id: 'lokniti',   label: 'Lok Niti',        ytId: 'q1ViF2OTjTs', live: true },
          { id: 'gramsamachar', label: 'Gram Samachar',  ytId: 'IqpWXkK3N6Y', live: false },
        ]);
      }

      // 2. Sponsor Ad
      setSponsorLabel(settings.liveTvSponsorLabel || 'Premium Sponsor');
      setSponsorTitle(settings.liveTvSponsorTitle || 'Elevate Your Brand');
      setSponsorDesc(settings.liveTvSponsorDesc || 'Join our premium advertising circle and reach millions across India.');
      setSponsorLink(settings.liveTvSponsorLink || '#');
      setSponsorImg(settings.liveTvSponsorImg || null);

      // 3. Shows / Program Schedule
      if (settings.liveTvShows) {
        try {
          setShows(JSON.parse(settings.liveTvShows));
        } catch (e) {
          console.error("Error parsing liveTvShows", e);
        }
      } else {
        setShows([
          { name: 'मुख्य समाचार',           time: 'अभी LIVE',  live: true  },
          { name: 'झारखंड की आवाज़',         time: '11:00 AM',  live: false },
          { name: 'देश-दुनिया की खबरें',      time: '12:30 PM',  live: false },
          { name: 'क्राइम रिपोर्ट',           time: '02:00 PM',  live: false },
          { name: 'व्यापार बुलेटिन',          time: '04:00 PM',  live: false },
        ]);
      }

      // 4. Breaking Ticker
      if (settings.liveTvTicker) {
        try {
          const parsedTicker = JSON.parse(settings.liveTvTicker);
          if (Array.isArray(parsedTicker)) {
            setTickerText(parsedTicker.join(', '));
          } else {
            setTickerText(settings.liveTvTicker);
          }
        } catch (e) {
          setTickerText(settings.liveTvTicker);
        }
      } else {
        setTickerText([
          'झारखंड में भारी बारिश का अलर्ट जारी',
          'सेंसेक्स 85,000 के पार — निवेशकों में उत्साह',
          'PM मोदी का कल झारखंड दौरा',
          'BCCI ने चैंपियंस ट्रॉफी के लिए टीम का ऐलान किया',
          'रांची एयरपोर्ट पर नई सुविधाएं शुरू',
        ].join(', '));
      }

      setLoading(false);
    });
  }, []);

  // Add Channel handler
  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanLabel || !newChanYtId) return;
    
    // Auto-generate id from slug
    const id = newChanLabel.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'chan-' + Date.now();
    const newChan: ChannelItem = {
      id,
      label: newChanLabel,
      ytId: newChanYtId,
      live: newChanLive
    };

    setChannels([...channels, newChan]);
    setNewChanLabel('');
    setNewChanYtId('');
    setNewChanLive(true);
  };

  // Delete Channel handler
  const handleDeleteChannel = (index: number) => {
    const updated = channels.filter((_, i) => i !== index);
    setChannels(updated);
  };

  // Add Show handler
  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowName || !newShowTime) return;

    const newShow: ShowItem = {
      name: newShowName,
      time: newShowTime,
      live: newShowLive
    };

    setShows([...shows, newShow]);
    setNewShowName('');
    setNewShowTime('');
    setNewShowLive(false);
  };

  // Delete Show handler
  const handleDeleteShow = (index: number) => {
    const updated = shows.filter((_, i) => i !== index);
    setShows(updated);
  };

  // Sponsor Image uploader
  const handleSponsorImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSponsorImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Submit handler
  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up ticker items
    const tickerItems = tickerText
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const settingsMap: Record<string, string> = {
      liveTvChannels: JSON.stringify(channels),
      liveTvSponsorLabel: sponsorLabel,
      liveTvSponsorTitle: sponsorTitle,
      liveTvSponsorDesc: sponsorDesc,
      liveTvSponsorLink: sponsorLink,
      liveTvShows: JSON.stringify(shows),
      liveTvTicker: JSON.stringify(tickerItems),
    };

    if (sponsorImg) {
      settingsMap.liveTvSponsorImg = sponsorImg;
    }

    const res = await updateSiteSettings(settingsMap);
    if (res.success) {
      setSuccessMsg('Live TV Management configurations saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Error updating settings: ' + res.error);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>📺 Live TV Channel & Content Management</h1>
      </div>

      {loading && <div style={{ padding: '20px', color: '#64748b' }}>Loading Live TV settings from database...</div>}

      {successMsg && (
        <div style={{
          background: '#ecfdf5',
          color: '#065f46',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500'
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '10px', fontSize: '18px' }}></i>
          {successMsg}
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSaveAllSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION 1: Channels management */}
          <div className={styles.card} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                <i className="fas fa-video"></i>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Active Live Video Channels</h2>
            </div>

            {/* List Table of Channels */}
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Channel Label</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>YouTube Video Link / ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Broadcasting Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No channels added yet. Add a channel below to get started.
                      </td>
                    </tr>
                  ) : (
                    channels.map((chan, idx) => (
                      <tr key={chan.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1e293b' }}>{chan.label}</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569' }}>{chan.ytId}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: chan.live ? '#fef2f2' : '#f1f5f9',
                            color: chan.live ? '#dc2626' : '#475569',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: chan.live ? '#dc2626' : '#64748b'
                            }} />
                            {chan.live ? 'LIVE' : 'SOON / NOT LIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteChannel(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                            title="Delete Channel"
                          >
                            <i className="fas fa-trash-alt"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Add Channel Inline Form */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginTop: 0, marginBottom: '12px' }}>➕ Add New Channel</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Channel Name / Label</label>
                  <input
                    type="text"
                    value={newChanLabel}
                    onChange={e => setNewChanLabel(e.target.value)}
                    placeholder="e.g. Desi Andaz Ranchi"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>YouTube URL or Embed ID</label>
                  <input
                    type="text"
                    value={newChanYtId}
                    onChange={e => setNewChanYtId(e.target.value)}
                    placeholder="e.g. https://youtu.be/IqpWXk... or IqpWXkK3N6Y"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '36px', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="newChanLive"
                    checked={newChanLive}
                    onChange={e => setNewChanLive(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="newChanLive" style={{ fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Broadcast Live indicator?</label>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddChannel}
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  >
                    Add Channel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID: SPONSOR ADS & TICKER/SHOWS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* SPONSOR CARD CONFIGURATION */}
            <div className={styles.card} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ background: '#ecfdf5', color: '#10b981', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                  <i className="fas fa-ad"></i>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Premium Sidebar Sponsor Ad</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Sponsor Section Label</label>
                  <input
                    type="text"
                    value={sponsorLabel}
                    onChange={e => setSponsorLabel(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#1e293b' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Sponsor Header Title</label>
                  <input
                    type="text"
                    value={sponsorTitle}
                    onChange={e => setSponsorTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#1e293b' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Sponsor Description / Slogan</label>
                  <textarea
                    rows={3}
                    value={sponsorDesc}
                    onChange={e => setSponsorDesc(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', color: '#1e293b' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Sponsor Action Link URL</label>
                  <input
                    type="text"
                    value={sponsorLink}
                    onChange={e => setSponsorLink(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#1e293b' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Sponsor Custom Banner Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {sponsorImg ? (
                      <div style={{ width: '100px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                        <img src={sponsorImg} alt="Sponsor Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '100px', height: '60px', borderRadius: '6px', background: '#f1f5f9', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0, fontSize: '11px' }}>
                        NO IMAGE
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSponsorImgUpload}
                      style={{ fontSize: '12px', color: '#475569' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BREAKING TICKER & SHOWS COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* TICKER CARD */}
              <div className={styles.card} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ background: '#fff7ed', color: '#ea580c', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                    <i className="fas fa-bolt"></i>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Breaking News Ticker</h2>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Ticker Messages (Separate with commas)</label>
                  <textarea
                    rows={4}
                    value={tickerText}
                    onChange={e => setTickerText(e.target.value)}
                    placeholder="e.g. Breaking News 1, Breaking News 2, breaking news 3"
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', color: '#1e293b', lineHeight: '1.5' }}
                    required
                  />
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>These messages will slide across the screen continuously on the Live TV broadcast HUD.</p>
                </div>
              </div>

              {/* PROGRAM SCHEDULE / SHOWS CARD */}
              <div className={styles.card} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ background: '#faf5ff', color: '#8b5cf6', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Program Schedule (Shows)</h2>
                </div>

                {/* Show Items Table */}
                <div style={{ overflowY: 'auto', maxHeight: '180px', marginBottom: '16px', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '8px 12px', fontWeight: '600' }}>Show Title</th>
                        <th style={{ padding: '8px 12px', fontWeight: '600' }}>Timing</th>
                        <th style={{ padding: '8px 12px', fontWeight: '600' }}>Live?</th>
                        <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shows.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                            No shows configured.
                          </td>
                        </tr>
                      ) : (
                        shows.map((show, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '500', color: '#1e293b' }}>{show.name}</td>
                            <td style={{ padding: '8px 12px', color: '#475569' }}>{show.time}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: show.live ? '#ef4444' : '#94a3b8'
                              }} />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteShow(idx)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                              >
                                <i className="fas fa-times-circle"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Show Quick Add */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <input
                        type="text"
                        value={newShowName}
                        onChange={e => setNewShowName(e.target.value)}
                        placeholder="Show Name (e.g. क्राइम रिपोर्ट)"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newShowTime}
                        onChange={e => setNewShowTime(e.target.value)}
                        placeholder="Time (e.g. 02:00 PM)"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        id="newShowLive"
                        checked={newShowLive}
                        onChange={e => setNewShowLive(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor="newShowLive" style={{ fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Is Currently Live?</label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddShow}
                      style={{
                        background: '#8b5cf6',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Add Show
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* SAVE BUTTON BUTTON */}
          <button
            type="submit"
            className={styles.btnPrimary}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: '#dc2626',
              borderColor: '#dc2626',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.2s',
              gap: '10px',
              boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
            }}
          >
            <i className="fas fa-save" style={{ fontSize: '18px' }}></i> Save All Live TV Settings & Sync
          </button>

        </form>
      )}
    </div>
  );
}
