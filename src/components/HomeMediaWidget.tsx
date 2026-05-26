'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../app/page.module.css';

interface HomeMediaWidgetProps {
  featuredVideoTitle: string;
  featuredVideoUrl: string;
  featuredVideoThumb: string | null;
  featuredPodcastTitle: string;
  featuredPodcastUrl: string;
  featuredPodcastThumb: string | null;
  defaultThumbnail: string;
}

export default function HomeMediaWidget({
  featuredVideoTitle,
  featuredVideoUrl,
  featuredVideoThumb,
  featuredPodcastTitle,
  featuredPodcastUrl,
  featuredPodcastThumb,
  defaultThumbnail
}: HomeMediaWidgetProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'podcast'>('video');
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTitle = activeTab === 'video' ? featuredVideoTitle : featuredPodcastTitle;
  const activeUrl = activeTab === 'video' ? featuredVideoUrl : featuredPodcastUrl;
  const activeThumb = activeTab === 'video' ? (featuredVideoThumb || defaultThumbnail) : (featuredPodcastThumb || defaultThumbnail);

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url + (url.includes('?') ? '&autoplay=1' : '?autoplay=1');
    
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
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const handleTabChange = (tab: 'video' | 'podcast') => {
    setActiveTab(tab);
    setIsPlaying(false); // Stop playing when switching tabs
  };

  const embedUrl = getEmbedUrl(activeUrl);

  return (
    <div className={styles.tabsWidget}>
      <div className={styles.tabHeaders}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'video' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('video')}
        >
          📹 वीडियो न्यूज़
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'podcast' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('podcast')}
        >
          🎙️ पॉडकास्ट
        </button>
      </div>
      <div className={styles.tabContent}>
        {isPlaying && embedUrl ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden' }}>
            <iframe 
              src={embedUrl}
              title={activeTitle}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
        ) : (
          <div 
            onClick={() => setIsPlaying(true)} 
            className={styles.liveTvThumbnailWrap}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <img 
              src={activeThumb} 
              alt={activeTitle} 
              className={styles.liveTvThumbnail} 
              loading="lazy"
            />
            <div className={styles.playButtonOverlay}>
              <i className="fas fa-play"></i>
            </div>
            {/* Title Overlay in thumbnail to look extremely professional */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
              padding: '24px 12px 10px',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-deva)',
              lineHeight: '1.3'
            }}>
              {activeTitle}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
