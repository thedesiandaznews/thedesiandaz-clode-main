'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './livetv.module.css';

// ── Data types ───────────────────────────────────────────────────────────────

interface ChannelItem {
  id: string;
  label: string;
  ytId: string;
  live: boolean;
}

interface SponsorItem {
  label: string;
  title: string;
  desc: string;
  link: string;
  img: string | null;
}

interface ShowItem {
  name: string;
  time: string;
  live: boolean;
}

interface LiveTVClientProps {
  initialChannels: ChannelItem[] | null;
  initialSponsor: SponsorItem;
  initialShows: ShowItem[] | null;
  initialTicker: string[] | null;
}

const statusItems = [
  { key: 'प्रसारण गुणवत्ता', val: 'HD (1080p)' },
  { key: 'स्ट्रीम बिटरेट',  val: '4.5 Mbps' },
  { key: 'दर्शक ऑनलाइन',   val: '1,28,345' },
  { key: 'अपटाइम',          val: '14h 32m' },
];

// ── Component ─────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function LiveTVClient({
  initialChannels,
  initialSponsor,
  initialShows,
  initialTicker
}: LiveTVClientProps) {
  const [isMuted,       setIsMuted]       = useState(true);
  const [playerReady,   setPlayerReady]   = useState(false);
  const [activeChannel, setActiveChannel] = useState(0);
  const playerRef = useRef<any>(null);

  // Fallbacks for data
  const channels = initialChannels && initialChannels.length > 0 ? initialChannels : [
    { id: 'desiandaz', label: 'The Desi Andaz', ytId: 'IqpWXkK3N6Y', live: true },
    { id: 'lokniti',   label: 'Lok Niti',        ytId: 'q1ViF2OTjTs', live: true },
    { id: 'gramsamachar', label: 'Gram Samachar',  ytId: 'IqpWXkK3N6Y', live: false },
  ];

  const shows = initialShows && initialShows.length > 0 ? initialShows : [
    { name: 'मुख्य समाचार',           time: 'अभी LIVE',  live: true  },
    { name: 'झारखंड की आवाज़',         time: '11:00 AM',  live: false },
    { name: 'देश-दुनिया की खबरें',      time: '12:30 PM',  live: false },
    { name: 'क्राइम रिपोर्ट',           time: '02:00 PM',  live: false },
    { name: 'व्यापार बुलेटिन',          time: '04:00 PM',  live: false },
  ];

  const tickerItems = initialTicker && initialTicker.length > 0 ? initialTicker : [
    'झारखंड में भारी बारिश का अलर्ट जारी',
    'सेंसेक्स 85,000 के पार — निवेशकों में उत्साह',
    'PM मोदी का कल झारखंड दौरा',
    'BCCI ने चैंपियंस ट्रॉफी के लिए टीम का ऐलान किया',
    'रांची एयरपोर्ट पर नई सुविधाएं शुरू',
  ];

  const sponsor = initialSponsor || {
    label: 'Premium Sponsor',
    title: 'Elevate Your Brand',
    desc: 'Join our premium advertising circle and reach millions across India.',
    link: '#',
    img: null
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player('livePlayer', {
        events: { onReady: () => setPlayerReady(true) },
      });
    };

    window.onYouTubeIframeAPIReady = initPlayer;
    if (window.YT?.Player) initPlayer();
  }, []);

  const toggleMute = () => {
    if (playerRef.current && playerReady) {
      isMuted ? playerRef.current.unMute() : playerRef.current.mute();
      setIsMuted(m => !m);
    }
  };

  // Resilient YouTube Video ID parser
  const getEmbedId = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/watch')) {
      try {
        const parts = url.split('?');
        if (parts[1]) {
          const urlParams = new URLSearchParams(parts[1]);
          videoId = urlParams.get('v') || '';
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      videoId = url;
    }
    return videoId;
  };

  // Safe boundary check for active channel
  const activeIndex = activeChannel < channels.length ? activeChannel : 0;
  const activeYtId = getEmbedId(channels[activeIndex]?.ytId || '');

  return (
    <article className={styles.page}>

      {/* ── Cinematic bg glows ── */}
      <div className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.inner}>

        {/* ── LIVE STATUS BAR ── */}
        <div className={styles.liveBar}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveLabel}>Live</span>
          </div>
          <span className={styles.liveChannelName}>{channels[activeIndex]?.label}</span>
          <span className={styles.liveViewers}>
            <i className="fas fa-eye" />
            1,28,345 दर्शक
          </span>
        </div>

        {/* ── CHANNEL TABS ── */}
        <div className={styles.channelTabs} role="tablist" aria-label="Live channels">
          {channels.map((ch, i) => (
            <button
              key={ch.id || i}
              role="tab"
              id={`channel-tab-${ch.id}`}
              className={`${styles.channelTab} ${activeIndex === i ? styles.active : ''}`}
              onClick={() => setActiveChannel(i)}
            >
              <span className={styles.channelTabDot} />
              {ch.label}
            </button>
          ))}
        </div>

        {/* ── MAIN LAYOUT ── */}
        <div className={styles.layout}>

          {/* ── PLAYER COLUMN ── */}
          <div className={styles.playerColumn}>

            {/* Player card */}
            <div className={styles.playerCard}>

              {/* Video stage */}
              <div className={styles.videoStage}>
                <iframe
                  id="livePlayer"
                  src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1&mute=1&controls=0&modestbranding=1&enablejsapi=1&rel=0&iv_load_policy=3&showinfo=0`}
                  allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                  allowFullScreen
                  title="Live TV Player"
                  className={styles.videoIframe}
                />

                {/* Custom audio toggle */}
                <button
                  className={styles.audioToggle}
                  onClick={toggleMute}
                  id="audio-toggle-btn"
                  aria-label={isMuted ? 'Unmute broadcast' : 'Mute broadcast'}
                >
                  <span className={`${styles.audioDot} ${isMuted ? styles.audioDotMuted : styles.audioDotLive}`} />
                  {isMuted ? 'UNMUTE' : 'LIVE ON'}
                  <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                </button>
              </div>

              {/* Broadcast HUD */}
              <div className={styles.broadcastHud}>
                <div className={styles.hudTop}>
                  <div>
                    <div className={styles.broadcastTitle}>{channels[activeIndex]?.label || 'The Desi Andaz News'}</div>
                    <div className={styles.broadcastDesc}>
                      भारत का सबसे विश्वसनीय हिंदी समाचार नेटवर्क। 24x7 निरंतर जानकारी और निष्पक्ष विश्लेषण।
                    </div>
                  </div>
                  <div className={styles.hudActions}>
                    <button className={`${styles.btnHud} ${styles.btnHudPrimary}`} id="subscribe-yt-btn">
                      <i className="fab fa-youtube" /> Subscribe
                    </button>
                    <button className={`${styles.btnHud} ${styles.btnHudGhost}`} id="share-live-btn">
                      <i className="fas fa-share-alt" /> Share
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className={styles.hudMetrics}>
                  {[
                    { val: '1.2M+', label: 'Subscribers' },
                    { val: '24/7',  label: 'Live Hours'  },
                    { val: '18+',   label: 'States'       },
                  ].map(m => (
                    <div key={m.label} className={styles.hudMetric}>
                      <div className={styles.hudMetricValue}>{m.val}</div>
                      <div className={styles.hudMetricLabel}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── LIVE TICKER ── */}
            <div className={styles.ticker}>
              <div className={styles.tickerBadge}>⚡ Breaking</div>
              <div className={styles.tickerTrack}>
                <div className={styles.tickerInner}>
                  {tickerItems.join('   •   ')}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {tickerItems.join('   •   ')}
                </div>
              </div>
            </div>

            {/* ── UPCOMING SHOWS ── */}
            <div className={styles.showsSection}>
              <div className={styles.showsSectionTitle}>📺 आज का कार्यक्रम</div>
              <div className={styles.showsList}>
                {shows.map((show, i) => (
                  <div key={i} className={styles.showItem} id={`show-item-${i}`}>
                    <div className={styles.showThumb}>
                      <img
                        src={`https://picsum.photos/100/70?random=${511 + i}`}
                        alt={show.name}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.showInfo}>
                      <div className={styles.showName}>{show.name}</div>
                      <div className={styles.showTime}>{show.time}</div>
                    </div>
                    {show.live ? (
                      <span className={styles.showLivePill}>LIVE</span>
                    ) : (
                      <span className={styles.showSoonPill}>SOON</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── SIDEBAR COLUMN ── */}
          <aside className={styles.sidebarColumn}>

            {/* Sponsor / Ad Card */}
            <a 
              href={sponsor.link || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.sponsorCard}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className={styles.sponsorHeader}>
                <span className={styles.sponsorLabel}>{sponsor.label}</span>
                <span className={styles.sponsorGoldDot} />
              </div>
              <div className={styles.sponsorImgWrap}>
                <img src={sponsor.img || "https://picsum.photos/600/400?random=11"} alt="Sponsor Banner" />
              </div>
              <div className={styles.sponsorText}>
                <div className={styles.sponsorTitle}>{sponsor.title}</div>
                <div className={styles.sponsorDesc}>
                  {sponsor.desc}
                </div>
                <button className={styles.btnSponsor} id="sponsor-inquire-btn" style={{ pointerEvents: 'none' }}>
                  Learn More
                </button>
              </div>
            </a>

            {/* Broadcast Status Card */}
            <div className={styles.statusCard}>
              <div className={styles.statusCardTitle}>Broadcast Status</div>
              {statusItems.map(s => (
                <div key={s.key} className={styles.statusRow}>
                  <span className={styles.statusKey}>{s.key}</span>
                  <span className={styles.statusVal}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Social Share */}
            <div className={styles.socialCard}>
              <div className={styles.socialCardTitle}>शेयर करें</div>
              <div className={styles.socialBtns}>
                <a href="#" className={`${styles.socialBtn} ${styles.fb}`} id="social-fb" aria-label="Facebook">
                  <i className="fab fa-facebook-f" />
                </a>
                <a href="#" className={`${styles.socialBtn} ${styles.yt}`} id="social-yt" aria-label="YouTube">
                  <i className="fab fa-youtube" />
                </a>
                <a href="#" className={`${styles.socialBtn} ${styles.wa}`} id="social-wa" aria-label="WhatsApp">
                  <i className="fab fa-whatsapp" />
                </a>
                <a href="#" className={`${styles.socialBtn} ${styles.tg}`} id="social-tg" aria-label="Telegram">
                  <i className="fab fa-telegram-plane" />
                </a>
              </div>
            </div>

          </aside>
        </div>

      </div>
    </article>
  );
}
