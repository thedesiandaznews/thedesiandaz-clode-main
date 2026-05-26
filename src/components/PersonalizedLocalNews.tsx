'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './personalized-local-news.module.css';

interface PersonalizedLocalNewsProps {
  initialNews: any[];
}

export default function PersonalizedLocalNews({ initialNews }: PersonalizedLocalNewsProps) {
  const [userCity, setUserCity] = useState<string | null>(null);
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);
  const [locationError, setLocationError] = useState('');

  // On mount, check if city is in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('user_local_city');
    if (saved) {
      setUserCity(saved);
    }
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLoc(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Use BigDataCloud's free reverse geocoding API for client-side
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
          const data = await res.json();
          
          let detectedCity = data.city || data.locality || data.principalSubdivision;
          
          if (detectedCity) {
            setUserCity(detectedCity);
            localStorage.setItem('user_local_city', detectedCity);
          } else {
            setLocationError('Could not determine your city name.');
          }
        } catch (err) {
          setLocationError('Failed to fetch city data.');
        } finally {
          setIsLoadingLoc(false);
        }
      },
      (error) => {
        setIsLoadingLoc(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Please allow location access in your browser settings.');
        } else {
          setLocationError('Unable to retrieve your location.');
        }
      }
    );
  };

  const clearLocation = () => {
    setUserCity(null);
    localStorage.removeItem('user_local_city');
    setLocationError('');
  };

  // Filter news based on detected city
  // We do a loose include match. For example, if city is "Ranchi", it checks if the article's district or title has "Ranchi".
  const displayNews = userCity
    ? initialNews.filter(n => {
        const c = userCity.toLowerCase();
        return (n?.district || '').toLowerCase().includes(c) || (n?.title || '').toLowerCase().includes(c);
      })
    : initialNews;

  // If we have a city but no matching news, fallback to general local news, but show a message
  const fallbackActive = userCity && displayNews.length === 0;
  const newsToRender = fallbackActive ? initialNews.slice(0, 3) : displayNews.slice(0, 3);

  return (
    <div className={styles.container}>
      
      {/* ── LOCATION CONTROLS ── */}
      <div className={styles.controlsWrap}>
        <div className={styles.currentCity}>
          <i className="fas fa-map-marker-alt" />
          {userCity ? (
            <span>आपका शहर: <span style={{ color: 'var(--primary)' }}>{userCity}</span></span>
          ) : (
            <span>झारखंड की ताज़ा खबरें</span>
          )}
        </div>

        {isLoadingLoc ? (
          <span className={styles.loadingText}><i className="fas fa-spinner fa-spin" /> Detecting...</span>
        ) : (
          <>
            {!userCity ? (
              <button onClick={detectLocation} className={styles.btnDetect} aria-label="Detect My City">
                <i className="fas fa-crosshairs" /> अपना शहर खोजें
              </button>
            ) : (
              <button onClick={clearLocation} className={styles.btnDetect} style={{ background: '#666' }} aria-label="Clear City">
                 <i className="fas fa-times" /> बदलें
              </button>
            )}
          </>
        )}
      </div>

      {locationError && (
        <div style={{ color: 'red', fontSize: '12px', marginBottom: '14px', fontWeight: 'bold' }}>
          {locationError}
        </div>
      )}

      {fallbackActive && (
        <div style={{ color: '#888', fontSize: '13px', marginBottom: '14px', fontStyle: 'italic' }}>
          इस समय {userCity} के लिए कोई विशेष खबर नहीं है। यहाँ राज्य की अन्य प्रमुख खबरें हैं:
        </div>
      )}

      {/* ── NEWS GRID ── */}
      <div className={styles.newsGrid}>
        {newsToRender.length > 0 ? newsToRender.map((n: any) => (
          <Link key={n.id} href={`/news/${n.slug || n.id}`} className={styles.newsCard}>
            <div className={styles.cardImgWrap}>
              <img src={n.imageUrl || `https://picsum.photos/400/250?random=${n.id}`} alt={n.title} className={styles.cardImg} loading="lazy" />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardMeta}>{n.district || n.category?.name || 'लोकल'}</div>
              <div className={styles.cardTitle}>{n.title}</div>
              <div className={styles.cardFooter}>
                {n.createdAt && !isNaN(new Date(n.createdAt).getTime()) ? new Date(n.createdAt).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }) : ''}
              </div>
            </div>
          </Link>
        )) : (
          <div className={styles.emptyState}>
              इस श्रेणी में अभी कोई खबर नहीं है।
          </div>
        )}
      </div>
    </div>
  );
}
