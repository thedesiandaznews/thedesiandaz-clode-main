'use client';

import { useState } from 'react';
import Link from 'next/link';

// Detailed plan specifications and deliverables
const PLAN_DATA = [
  {
    id: 'local_startup',
    name: 'Local Start-Up Combo',
    badge: 'Local Targeting',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.2)',
    description: 'Ideal for small shops, local institutes, and new start-ups looking to capture regional customers dynamically.',
    deliverables: [
      '📰 Print: 1 Small Display Ad per week (4x5 cm) inside the Newspaper.',
      '💻 Website: 1 Fixed Sidebar Banner Ad on category pages (24/7 with Local Filters).',
      '📱 Social Media: 2 Premium Static Image Posts per week on Facebook & Instagram.',
      '📺 YouTube News: 1 Scrolling Text Ticker below the breaking news bar for 15 Days/Month.'
    ],
    pricing: {
      week: { base: 5000, gst: 900, total: 5900 },
      month: { base: 10000, gst: 1800, total: 11800 },
      '3month': { base: 26000, gst: 4680, total: 30680 },
      '6month': { base: 48000, gst: 8640, total: 56640 },
      '12month': { base: 85000, gst: 15300, total: 100300 }
    }
  },
  {
    id: 'market_leader',
    name: 'Market Leader Combo',
    badge: 'Branding Core',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.2)',
    description: 'Perfect for mid-level showrooms, private hospitals, and regional brands looking for consistent daily market penetration.',
    deliverables: [
      '📰 Print: 1 Medium Display Ad per week (8x5 cm) in Paper.',
      '💻 Website: 1 Premium Sidebar Banner Ad fixed directly on the main Homepage (24/7 high-traffic).',
      '📱 Social Media: 2 Static Image Posts per week + Brand Logo watermarked on 5 Viral Reels.',
      '📺 YouTube News: 1 L-Shape Graphical Banner Ad (15 Days) + 1 Daily Scrolling Ticker (30 Days).'
    ],
    pricing: {
      week: { base: 9000, gst: 1620, total: 10620 },
      month: { base: 20000, gst: 3600, total: 23600 },
      '3month': { base: 52000, gst: 9360, total: 61360 },
      '6month': { base: 95000, gst: 17100, total: 112100 },
      '12month': { base: 170000, gst: 30600, total: 200600 }
    }
  },
  {
    id: 'dhamaka_visibility',
    name: 'Dhamaka Visibility Combo',
    badge: 'Most Popular',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.25)',
    description: 'Our most popular plan! Ideal for brands wanting complete dominance, maximum local reach, and immediate market impact.',
    deliverables: [
      '📰 Print: 1 Large Display Ad per week + 1 Dedicated Event/Photo Feature page in Paper.',
      '💻 Website: 1 Mega Top Header Banner Ad (The highest-viewed billboard slot on the entire site).',
      '📱 Social Media: 3 Static Image Posts per week + Permanent "Powered By [Logo]" on ALL reels.',
      '📺 YouTube News: 1 Permanent Daily L-Shape Graphical Banner + 1 Continuous Daily Scrolling Ticker.'
    ],
    pricing: {
      week: { base: 16000, gst: 2880, total: 18880 },
      month: { base: 35000, gst: 6300, total: 41300 },
      '3month': { base: 90000, gst: 16200, total: 106200 },
      '6month': { base: 165000, gst: 29700, total: 194700 },
      '12month': { base: 300000, gst: 54000, total: 354000 }
    }
  },
  {
    id: 'festival_special',
    name: 'Festival & Season Combo',
    badge: 'Sales Booster',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.2)',
    description: 'Designed specifically to drive massive immediate sales during peak festive seasons like Durga Puja, Diwali, or Weddings.',
    deliverables: [
      '📰 Print: 1 Large Premium Color Ad on our Dedicated Special Festival Page.',
      '💻 Website: 1 Full Website Skin / Watermark Background Ad Takeover wrapper.',
      '📱 Social Media: Your Logo integrated onto 10 Special Festival Greeting Posts & 5 Reels.',
      '📺 YouTube News: 1 Featured L-Shape Banner Ad + 1 Scrolling Ticker on all Festival updates.'
    ],
    pricing: {
      week: { base: 12000, gst: 2160, total: 14160 },
      month: { base: 25000, gst: 4500, total: 29500 },
      '3month': { base: 65000, gst: 11700, total: 76700 },
      '6month': { base: 120000, gst: 21600, total: 141600 },
      '12month': { base: 210000, gst: 37800, total: 247800 }
    }
  },
  {
    id: 'kingmaker_corporate',
    name: 'Kingmaker Corporate Combo',
    badge: 'Ultimate Power',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.2)',
    description: 'The ultimate partnership plan for elite builders, universities, or corporate brands wanting complete takeover.',
    deliverables: [
      '📰 Print: 1 Weekly Half-Page Premium Color Ad in the Newspaper Main Edition (4 Ads/Month).',
      '💻 Website: 1 Mega Homepage Banner + Fixed Banner Ads on 100% of Inside Article Pages.',
      '📱 Social Media: 5 Static Image Posts per week + Logo pinned as "Main Sponsor" on Cover Banners.',
      '📺 YouTube News: Permanent Daily L-Shape Banner & Ticker + Logo on Channel Art + 1 Exclusive Interview.'
    ],
    pricing: {
      week: { base: 28000, gst: 5040, total: 33040 },
      month: { base: 65000, gst: 11700, total: 76700 },
      '3month': { base: 175000, gst: 31500, total: 206500 },
      '6month': { base: 320000, gst: 57600, total: 377600 },
      '12month': { base: 580000, gst: 104400, total: 684400 }
    }
  }
];

export default function PricingPage() {
  const [duration, setDuration] = useState<'week' | 'month' | '3month' | '6month' | '12month'>('month');

  return (
    <div style={{ background: '#03050c', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', sans-serif", paddingBottom: '80px', overflowX: 'hidden' }}>
      
      {/* Scope Keyframe Animations & Class Utilities */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes headerGlow {
          0% { border-color: rgba(239, 68, 68, 0.1); }
          50% { border-color: rgba(239, 68, 68, 0.4); }
          100% { border-color: rgba(239, 68, 68, 0.1); }
        }
        @keyframes bgFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.45; }
          100% { transform: translateY(0px) scale(1); opacity: 0.25; }
        }
        .glow-background {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .indigo-sphere {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          width: 50vw;
          height: 50vw;
          top: -10%;
          left: -10%;
          animation: bgFloat 10s ease-in-out infinite;
        }
        .rose-sphere {
          background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%);
          width: 50vw;
          height: 50vw;
          bottom: -10%;
          right: -10%;
          animation: bgFloat 12s ease-in-out infinite alternate;
        }
        .glass-panel {
          background: rgba(13, 18, 36, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
          border-radius: 24px;
        }
        .plan-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .plan-card:hover {
          transform: translateY(-8px);
          border-color: var(--hover-color) !important;
          box-shadow: 0 12px 30px var(--hover-glow) !important;
        }
        .active-tab {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1100px) {
          .pricing-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 760px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* Floating Animated Backdrop Glow Spheres */}
      <div className="glow-background indigo-sphere" />
      <div className="glow-background rose-sphere" />

      {/* Font imports */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        
        {/* Page Header */}
        <header style={{ textAlign: 'center', paddingTop: '60px', paddingBottom: '40px' }}>
          
          {/* Trust highlighting badge */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)', 
            color: '#f59e0b', 
            padding: '10px 24px', 
            borderRadius: '30px', 
            fontSize: '13px', 
            fontWeight: 800, 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            marginBottom: '24px',
            letterSpacing: '0.5px'
          }}>
            👑 Santhal Pargana's First Registered & Most Trusted Media Network
          </div>

          <h1 style={{ 
            fontSize: 'clamp(28px, 6vw, 48px)', 
            fontWeight: 950, 
            lineHeight: 1.15,
            letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #ffffff 30%, #cbd5e1 70%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 16px 0'
          }}>
            Smart Targeted Advertising <br />
            <span style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Transparent B2B Pricing Plans
            </span>
          </h1>

          <p style={{ fontSize: '16.5px', color: '#94a3b8', maxWidth: '650px', margin: '0 auto 36px auto', lineHeight: '1.6' }}>
            Choose a plan that fits your business goals. Grow your local offline store sales using our hyper-targeted print, web portal, and viral YouTube news placements!
          </p>

          {/* Interactive Duration Switcher */}
          <div className="glass-panel" style={{ 
            display: 'inline-flex',
            padding: '6px',
            gap: '4px',
            borderRadius: '30px',
            background: 'rgba(13, 18, 36, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            {[
              { id: 'week', label: '1 Week Trial' },
              { id: 'month', label: '1 Month Base' },
              { id: '3month', label: '3 Months Plan' },
              { id: '6month', label: '6 Months Plan' },
              { id: '12month', label: '12 Months Plan' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDuration(tab.id as any)}
                className={duration === tab.id ? 'active-tab' : ''}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '10px 20px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        {/* Dynamic Pricing Cards Grid */}
        <section className="pricing-grid" style={{ marginTop: '24px' }}>
          {PLAN_DATA.map(plan => {
            const priceInfo = plan.pricing[duration];
            const isDhamaka = plan.id === 'dhamaka_visibility';

            return (
              <div 
                key={plan.id}
                className="plan-card glass-panel"
                style={{
                  padding: '36px 28px',
                  border: isDhamaka ? `1.5px solid ${plan.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  '--hover-color': plan.color,
                  '--hover-glow': plan.glow
                } as any}
              >
                {/* Visual Glow Layer for popular card */}
                {isDhamaka && (
                  <div style={{
                    position: 'absolute',
                    top: 0, right: 0,
                    background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '6px 20px',
                    borderRadius: '0 0 0 16px',
                    boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
                  }}>
                    RECOMMENDED
                  </div>
                )}

                {/* Plan Header */}
                <div>
                  <span style={{
                    background: `${plan.color}15`,
                    color: plan.color,
                    border: `1.5px solid ${plan.color}25`,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'inline-block',
                    marginBottom: '16px'
                  }}>
                    {plan.badge}
                  </span>
                  
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: 900, 
                    color: '#ffffff', 
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.3px'
                  }}>
                    {plan.name}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#94a3b8', 
                    margin: 0, 
                    lineHeight: '1.5',
                    minHeight: '45px'
                  }}>
                    {plan.description}
                  </p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: 0 }} />

                {/* Pricing Block */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>₹</span>
                    <span style={{ fontSize: '42px', fontWeight: 950, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '-1.5px' }}>
                      {priceInfo.total.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>
                      / total
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: '11.5px', 
                    color: '#64748b', 
                    marginTop: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    fontFamily: 'monospace'
                  }}>
                    <span>Base amount: ₹{priceInfo.base.toLocaleString('en-IN')}</span>
                    <span>GST (18%): +₹{priceInfo.gst.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: 0 }} />

                {/* Deliverables Checklist */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h5 style={{ fontSize: '12.5px', fontWeight: 850, color: '#f1f5f9', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    What's Included:
                  </h5>
                  {plan.deliverables.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: plan.color, fontSize: '14px', flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.45' }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Call Button */}
                <Link
                  href="/advertise"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: isDhamaka ? `linear-gradient(135deg, ${plan.color} 0%, #b91c1c 100%)` : 'rgba(255, 255, 255, 0.04)',
                    color: '#ffffff',
                    border: isDhamaka ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.25s',
                    boxShadow: isDhamaka ? '0 4px 15px rgba(239, 68, 68, 0.25)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDhamaka) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    } else {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDhamaka) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    } else {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.25)';
                    }
                  }}
                >
                  ⚡ Book Smart Slot Today
                </Link>
              </div>
            );
          })}
        </section>

        {/* Footer Support Info panel */}
        <footer className="glass-panel" style={{ 
          marginTop: '48px', 
          padding: '24px 32px', 
          border: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            📞 Need Custom Placements or Corporate Partnerships?
          </h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
            We offer custom packages, full watermark skin takeovers, and premium event photography features. <br />
            Reach out directly to our Managing Director: <strong>Sonu Kumar Saha</strong> (Call/WhatsApp: <strong>+91-6203868383</strong>, <strong>+91-8409659560</strong>) or email <strong>ads@thedesiandaz.com</strong>.
          </p>
        </footer>

      </div>
    </div>
  );
}
