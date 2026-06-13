'use client';

import styles from './podcast.module.css';

// ── Data ─────────────────────────────────────────────────────────────────────

const categories = ['सभी', 'राजनीति', 'समाज', 'व्यापार', 'क्राइम', 'खेल', 'मनोरंजन'];

const episodes = [
  {
    id: 46,
    title: 'देसी उद्यमी: धनबाद के युवा ने कैसे खड़ी की अपनी स्टार्टअप कंपनी?',
    desc: 'विस्तृत साक्षात्कार जिसमें हम जानेंगे संघर्षों और उपलब्धियों के बारे में।',
    img: 'https://picsum.photos/400/225?random=366',
    duration: '38:14',
    age: '1 सप्ताह',
  },
  {
    id: 45,
    title: 'UP चुनाव: यादव परिवार की राजनीति और जनता की उम्मीदें',
    desc: 'वरिष्ठ पत्रकारों के साथ गहन विश्लेषण और ज़मीनी रिपोर्ट।',
    img: 'https://picsum.photos/400/225?random=367',
    duration: '52:07',
    age: '2 सप्ताह',
  },
  {
    id: 44,
    title: 'किसान आंदोलन: खेतों से संसद तक की यात्रा',
    desc: 'MSP से लेकर कर्ज माफी तक — किसानों की बात उनकी ज़बान से।',
    img: 'https://picsum.photos/400/225?random=368',
    duration: '44:55',
    age: '3 सप्ताह',
  },
  {
    id: 43,
    title: 'झारखंड का संगीत: पारंपरिक धुनों का डिजिटल सफर',
    desc: 'लोक कलाकारों ने बताया कैसे YouTube ने बदली उनकी ज़िंदगी।',
    img: 'https://picsum.photos/400/225?random=369',
    duration: '29:43',
    age: '1 माह',
  },
];

const popularPodcasts = [
  { title: 'झारखंड का संगीत और संस्कृति की झलक', ep: 'EP 01', img: 'https://picsum.photos/100/100?random=351' },
  { title: 'राजनीति: सत्ता और जनता के बीच का फ़र्क', ep: 'EP 02', img: 'https://picsum.photos/100/100?random=352' },
  { title: 'बेरोज़गारी: युवाओं का दर्द, सरकार का वादा', ep: 'EP 03', img: 'https://picsum.photos/100/100?random=353' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PodcastPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* ── TOP AD ── */}
        <div className={styles.adTop}>
          <img src="https://picsum.photos/1200/250?random=311" alt="Ad" />
        </div>

        {/* ── STUDIO HERO ── */}
        <section className={styles.hero}>
          {/* blurry bg */}
          <img
            src="https://picsum.photos/1200/600?random=312"
            className={styles.heroBg}
            alt=""
            aria-hidden="true"
          />
          <div className={styles.heroOverlay} />

          <div className={styles.heroContent}>
            {/* Cover Art */}
            <div className={styles.heroCover}>
              <img src="https://picsum.photos/400/400?random=313" alt="Featured Episode Cover" />
            </div>

            {/* Info */}
            <div className={styles.heroInfo}>
              <div className={styles.heroNowPlaying}>
                <div className={styles.waveformWrap}>
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className={styles.waveBar} />
                  ))}
                </div>
                <span className={styles.nowPlayingLabel}>Now Playing — Latest Episode</span>
              </div>

              <h1 className={styles.heroTitle}>
                झारखंड की राजनीति: चुनावी बिगुल और जमीनी हकीकत का विश्लेषण
              </h1>

              <p className={styles.heroExcerpt}>
                इस हफ्ते हम बात करेंगे प्रदेश के बदलते राजनीतिक माहौल और जनता की प्रमुख समस्याओं के बारे में।
              </p>

              <div className={styles.heroActions}>
                <button className={styles.btnPlay} id="hero-play-btn">
                  <i className="fas fa-play" />
                  अभी सुनें (Episode 47)
                </button>
                <span className={styles.heroDuration}>
                  <i className="far fa-clock" />
                  45:22 मिनट
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORY TAB FILTER ── */}
        <div className={styles.filterBar} role="tablist" aria-label="Podcast categories">
          {categories.map((cat, i) => (
            <button
              key={i}
              role="tab"
              id={`cat-tab-${i}`}
              className={`${styles.filterTab} ${i === 0 ? styles.active : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── MAIN LAYOUT: FEED + SIDEBAR ── */}
        <div className={styles.layout}>

          {/* ── EPISODE FEED ── */}
          <main className={styles.feed}>
            <div className={styles.feedHeader}>
              <h2 className={styles.feedTitle}>🎙️ पिछले एपिसोड्स</h2>
              <a href="#" className={styles.feedSeeAll}>सभी देखें →</a>
            </div>

            <div className={styles.episodeGrid}>
              {episodes.map(ep => (
                <article key={ep.id} className={styles.episodeCard} id={`episode-${ep.id}`}>
                  {/* Thumbnail */}
                  <div className={styles.episodeThumb}>
                    <img src={ep.img} alt={ep.title} />
                    <div className={styles.playOverlay}>
                      <i className="fas fa-play-circle" />
                    </div>
                    <span className={styles.durationBadge}>{ep.duration}</span>
                  </div>

                  {/* Body */}
                  <div className={styles.episodeBody}>
                    <div>
                      <div className={styles.episodeMeta}>
                        <span className={styles.episodeNum}>Episode {ep.id}</span>
                        <span className={styles.episodeAge}>{ep.age} पहले</span>
                      </div>
                      <h3 className={styles.episodeTitle}>{ep.title}</h3>
                      <p className={styles.episodeDesc}>{ep.desc}</p>
                    </div>

                    <div className={styles.episodeFooter}>
                      <button className={styles.btnSmallPlay} id={`play-ep-${ep.id}`}>
                        <i className="fas fa-play" /> सुनें
                      </button>
                      <button className={styles.btnSave} aria-label="Save episode">
                        <i className="far fa-bookmark" />
                      </button>
                      <button className={styles.btnSave} aria-label="Share episode">
                        <i className="fas fa-share-alt" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* ── SIDEBAR ── */}
          <aside className={styles.sidebar}>

            {/* Side Ad */}
            <div className={styles.adSide}>
              <img src="https://picsum.photos/350/500?random=315" alt="Advertisement" />
            </div>

            {/* Popular Box */}
            <div className={styles.popularBox}>
              <h3 className={styles.popularTitle}>लोकप्रिय पॉडकास्ट</h3>
              {popularPodcasts.map((pod, i) => (
                <div key={i} className={styles.popularItem} id={`popular-pod-${i}`}>
                  <div className={styles.popularThumb}>
                    <img src={pod.img} alt={pod.title} />
                  </div>
                  <div className={styles.popularItemInfo}>
                    <div className={styles.popularItemTitle}>{pod.title}</div>
                    <div className={styles.popularItemEp}>{pod.ep}</div>
                  </div>
                  <i className="fas fa-play-circle" style={{ color: 'var(--primary)', fontSize: '20px', flexShrink: 0 }} />
                </div>
              ))}
            </div>

            {/* Subscribe Banner */}
            <div className={styles.subscribeBanner}>
              <span className={styles.subscribeBannerIcon}>🎧</span>
              <div className={styles.subscribeBannerTitle}>Podcast Subscribe करें</div>
              <div className={styles.subscribeBannerDesc}>
                नए एपिसोड की सूचना सबसे पहले पाएं — Spotify, YouTube और Apple Podcast पर।
              </div>
              <button className={styles.subscribeBtn} id="subscribe-podcast-btn">
                अभी सब्सक्राइब करें
              </button>
            </div>

          </aside>
        </div>

        {/* ── BOTTOM AD ── */}
        <div className={styles.adBottom}>
          <img src="https://picsum.photos/1200/200?random=316" alt="Bottom Advertisement" />
        </div>

      </div>
    </div>
  );
}
