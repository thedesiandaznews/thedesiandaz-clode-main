'use client';

import { useState } from 'react';
import Link from 'next/link';

// Detailed plan specifications and deliverables
const PLAN_DATA = [
  {
    id: 'launch_2month',
    name: '2 Months Complete Visibility (Launch Offer)',
    badge: 'LIMITED TIME OFFER!',
    color: '#CC2200',
    glow: 'rgba(204, 34, 0, 0.2)',
    description: 'Power-packed digital + print visibility to boost your brand where it matters most! 2 months of consistent exposure. MAXIMUM LOCAL IMPACT!',
    deliverables: [
      '📰 Print: 1 Medium Display Ad per week (8x5 cm) in Paper.',
      '💻 Website: 1 Premium Sidebar Banner Ad feed directly on main Homepage (24/7 high-traffic).',
      '📱 Social Media: 2 Premium Static Image Posts per week + Brand Logo watermarked on 5 Viral Reels.',
      '📺 YouTube News: 1 L-Shape Graphical Banner Ad (15 Days).',
      '📺 Live News: 1 Daily Scrolling Ticker (30 Days).'
    ],
    pricing: {
      week: { base: 0, gst: 0, total: 0 },
      month: { base: 0, gst: 0, total: 0 },
      '2month': { base: 10000, gst: 1800, total: 11800 },
      '3month': { base: 0, gst: 0, total: 0 },
      '6month': { base: 0, gst: 0, total: 0 },
      '12month': { base: 0, gst: 0, total: 0 }
    }
  },
  {
    id: 'launch_6month',
    name: '6 Months Complete Visibility (Launch Offer)',
    badge: 'LIMITED SLOTS AVAILABLE!',
    color: '#FF6B00',
    glow: 'rgba(255, 107, 0, 0.2)',
    description: 'Perfect for established local brands wanting long-term dominant regional authority. 6 months of consistent exposure.',
    deliverables: [
      '📰 Print: 1 Medium Display Ad per week (8x5 cm) in Paper.',
      '💻 Website: 1 Premium Sidebar Banner Ad feed directly on main Homepage (24/7 high-traffic).',
      '📱 Social Media: 2 Premium Static Image Posts per week + Brand Logo watermarked on 5 Viral Reels.',
      '📺 YouTube News: 1 L-Shape Graphical Banner Ad (15 Days).',
      '📺 Live News (YouTube & Website): 1 Daily Scrolling Ticker (30 Days).'
    ],
    pricing: {
      week: { base: 0, gst: 0, total: 0 },
      month: { base: 0, gst: 0, total: 0 },
      '2month': { base: 0, gst: 0, total: 0 },
      '3month': { base: 0, gst: 0, total: 0 },
      '6month': { base: 25000, gst: 4500, total: 29500 },
      '12month': { base: 0, gst: 0, total: 0 }
    }
  }
];

export default function PricingPage() {
  const [duration, setDuration] = useState<'week' | 'month' | '2month' | '3month' | '6month' | '12month'>('2month');

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
        </header>

        {/* Dynamic Pricing Cards Grid */}
        <section className="pricing-grid" style={{ marginTop: '24px' }}>
          {PLAN_DATA.map(plan => {
            const activeDur = Object.keys(plan.pricing).find(key => (plan.pricing as any)[key].base > 0) || '2month';
            const priceInfo = (plan.pricing as any)[activeDur];
            const isDhamaka = plan.id === 'launch_2month';

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
