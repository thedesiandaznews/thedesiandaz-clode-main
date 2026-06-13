'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CommunityLanding() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        
        .trust-card {
          transition: all 0.3s ease;
        }
        .trust-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1;
        }
        
        .process-step {
          transition: all 0.3s ease;
        }
        .process-step:hover .step-icon {
          transform: scale(1.15) rotate(5deg);
        }
        
        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .hero-btns { flex-direction: column !important; gap: 16px !important; }
          .hero-btns a { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; text-align: center; }
          
          .trust-metrics { margin-top: -30px !important; flex-direction: column !important; padding: 20px !important; }
          .trust-metrics > div { 
            flex: none !important; 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important;
            gap: 16px !important;
            text-align: left !important;
            padding: 20px 10px !important; 
            margin: 0 !important;
            border: none !important; 
            border-bottom: 1px dashed #cbd5e1 !important; 
          }
          .trust-metrics > div:last-child { border-bottom: none !important; }
          .trust-metrics > div > div:first-child { font-size: 36px !important; min-width: 80px !important; text-align: center; }
          .trust-metrics > div > div:last-child { margin-top: 0 !important; font-size: 13px !important; line-height: 1.3 !important; }
          
          .trust-card { padding: 24px 20px !important; }
          
          .process-container { padding-left: 32px !important; }
          .process-line { left: 4px !important; }
          .step-icon { 
            left: -28px !important; 
            width: 32px !important; 
            height: 32px !important; 
            font-size: 14px !important;
            top: 20px !important;
            border-width: 4px !important;
          }
          .process-step { padding: 24px 20px !important; margin-bottom: 30px !important; }
          
          .footer-btn { width: 100% !important; box-sizing: border-box !important; padding: 16px 20px !important; }
        }
      `}} />

      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 20px 80px 20px', textAlign: 'center', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)', zIndex: 0, animation: 'float 10s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 12s ease-in-out infinite reverse' }}></div>

        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className={mounted ? "animate-fade-in-up" : ""} style={{ display: 'inline-block', padding: '8px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '99px', color: '#2563eb', fontWeight: 'bold', fontSize: 'clamp(12px, 3vw, 14px)', marginBottom: '30px', letterSpacing: '1px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)' }}>
            <i className="fas fa-shield-check" style={{ marginRight: '8px' }}></i> INDIA'S MOST TRUSTED ANONYMOUS PLATFORM
          </div>
          
          <h1 className={mounted ? "animate-fade-in-up delay-100" : ""} style={{ fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: '900', lineHeight: '1.15', marginBottom: '24px', color: '#0f172a', letterSpacing: '-1px' }}>
            Raise Your Voice Without <br className="hidden md:block"/>Revealing Your Identity
          </h1>
          
          <p className={mounted ? "animate-fade-in-up delay-200" : ""} style={{ fontSize: 'clamp(16px, 4vw, 22px)', color: '#475569', marginBottom: '40px', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 40px auto' }}>
            Report local corruption, accidents, public issues, and emergencies safely. We protect your identity with advanced encryption while your voice reaches the newsroom.
          </p>

          <div className={`hero-btns ${mounted ? "animate-fade-in-up delay-300" : ""}`} style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', flexDirection: 'row' }}>
            <Link href="/anonymous/join" style={{ padding: '16px 36px', background: '#dc2626', color: '#fff', borderRadius: '12px', fontWeight: 'bold', fontSize: 'clamp(16px, 3vw, 18px)', textDecoration: 'none', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)', transition: 'all 0.2s', animation: 'pulseGlow 2s infinite', flex: '1 1 auto', maxWidth: '300px' }}>
              Start Reporting <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
            </Link>
            <Link href="/anonymous/login" style={{ padding: '16px 36px', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 'bold', fontSize: 'clamp(16px, 3vw, 18px)', textDecoration: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'all 0.2s', flex: '1 1 auto', maxWidth: '300px' }} onMouseOver={e => {e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'}} onMouseOut={e => {e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#cbd5e1'}}>
              Contributor Login
            </Link>
          </div>
        </div>
      </section>

      {/* Deep Trust Metrics */}
      <section style={{ padding: '60px 20px', background: '#f8fafc', position: 'relative', zIndex: 2 }}>
        <div className={`trust-metrics ${mounted ? "animate-fade-in-up delay-400" : ""}`} style={{ maxWidth: '1000px', margin: '-100px auto 0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center', background: '#fff', padding: '40px 20px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: '900', color: '#dc2626', lineHeight: 1 }}>100%</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Identity Protection</div>
          </div>
          <div style={{ flex: '1 1 200px', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }} className="desktop-border-x">
            <div style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: '900', color: '#2563eb', lineHeight: 1 }}>0</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Data Leaks</div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: '900', color: '#10b981', lineHeight: 1 }}>24/7</div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Editorial Review</div>
          </div>
        </div>
      </section>

      {/* How Your Identity Stays Safe (The Trust Framework) */}
      <section style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '14px' }}>Our Privacy Guarantee</div>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: '900', color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.5px' }}>How We Keep You Safe</h2>
            <p style={{ color: '#475569', fontSize: 'clamp(16px, 3vw, 18px)', maxWidth: '700px', margin: '0 auto' }}>You are a citizen, not a journalist. It is our responsibility to protect you when you expose the truth.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            
            {/* Trust Pillar 1 */}
            <div className="trust-card" style={{ background: '#f8fafc', padding: '40px 30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '28px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)' }}>
                <i className="fas fa-user-secret"></i>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Zero Public Identity</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>We do not ask for Aadhaar or PAN. Your real name and mobile number are heavily encrypted and hidden even from our own standard admins.</p>
            </div>

            {/* Trust Pillar 2 */}
            <div className="trust-card" style={{ background: '#f8fafc', padding: '40px 30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '64px', height: '64px', background: '#fef2f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: '28px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1)' }}>
                <i className="fas fa-fingerprint"></i>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Unique Contributor ID</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>Instead of your name, we assign you a secure Contributor ID (e.g., TDA/NEWS/JH/001). This tracks your reports internally without tracking *you*.</p>
            </div>

            {/* Trust Pillar 3 */}
            <div className="trust-card" style={{ background: '#f8fafc', padding: '40px 30px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '64px', height: '64px', background: '#ecfdf5', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '28px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
                <i className="fas fa-user-shield"></i>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#0f172a' }}>Anonymous Publishing</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>When our newsroom verifies and publishes your report to millions, the author is strictly listed as "Anonymous Community Contributor".</p>
            </div>

          </div>
        </div>
      </section>

      {/* The Step-by-Step Process */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: '900', color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.5px' }}>What Happens After You Submit?</h2>
            <p style={{ color: '#475569', fontSize: 'clamp(16px, 3vw, 18px)', maxWidth: '600px', margin: '0 auto' }}>Total transparency into our editorial process.</p>
          </div>

          <div className="process-container" style={{ position: 'relative', paddingLeft: 'clamp(30px, 8vw, 60px)', maxWidth: '700px', margin: '0 auto' }}>
            
            {/* Vertical Line */}
            <div className="process-line" style={{ position: 'absolute', left: '0', top: '20px', bottom: '20px', width: '4px', background: '#e2e8f0', borderRadius: '4px' }}></div>

            <div className="process-step" style={{ position: 'relative', marginBottom: '50px', background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
              <div className="step-icon" style={{ position: 'absolute', left: 'calc(clamp(30px, 8vw, 60px) * -1 - 24px)', top: '10px', width: '52px', height: '52px', background: '#2563eb', borderRadius: '50%', border: '6px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px', transition: 'all 0.3s ease' }}>1</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Secure Upload to Newsroom</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0, fontSize: '15px' }}>Your photos, videos, and text are sent directly to our secure editorial inbox. No one outside the newsroom can access them.</p>
            </div>

            <div className="process-step" style={{ position: 'relative', marginBottom: '50px', background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
              <div className="step-icon" style={{ position: 'absolute', left: 'calc(clamp(30px, 8vw, 60px) * -1 - 24px)', top: '10px', width: '52px', height: '52px', background: '#f59e0b', borderRadius: '50%', border: '6px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px', transition: 'all 0.3s ease' }}>2</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Fact-Checking & Verification</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0, fontSize: '15px' }}>Our senior editors verify the incident using local contacts and metadata. We ensure the complaint is genuine before taking action.</p>
            </div>

            <div className="process-step" style={{ position: 'relative', background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
              <div className="step-icon" style={{ position: 'absolute', left: 'calc(clamp(30px, 8vw, 60px) * -1 - 24px)', top: '10px', width: '52px', height: '52px', background: '#10b981', borderRadius: '50%', border: '6px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '20px', transition: 'all 0.3s ease' }}>3</div>
              <h3 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>Action & Impact</h3>
              <p style={{ color: '#475569', lineHeight: '1.6', margin: 0, fontSize: '15px' }}>Once verified, the report is published as Breaking News on our platform, reaching local authorities, administration, and millions of readers.</p>
            </div>

          </div>
        </div>
      </section>

      {/* What can you report */}
      <section style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', color: '#0f172a', marginBottom: '40px' }}>We Are The Voice Against...</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {['Corruption', 'Government Negligence', 'Electricity/Water Issues', 'Illegal Activities', 'Accidents', 'Public Complaints', 'Crime Alerts', 'Local Incidents', 'Emergency Situations'].map((issue, i) => (
              <span key={i} style={{ padding: '12px 24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '99px', color: '#334155', fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: '600', transition: 'all 0.2s', cursor: 'default' }} onMouseOver={e => {e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.color = '#2563eb'}} onMouseOut={e => {e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'}}>
                {issue}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '100px 20px', textAlign: 'center', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
        {/* Modern glowing orbs instead of checkerboard */}
        <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(220, 38, 38, 0.2) 0%, rgba(15, 23, 42, 0) 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 10s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, rgba(15, 23, 42, 0) 70%)', filter: 'blur(60px)', zIndex: 0, animation: 'float 12s ease-in-out infinite reverse' }}></div>
        
        {/* Subtle grid pattern overlay */}
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0', opacity: '0.05', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', zIndex: 1 }}></div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', padding: '60px 30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderRadius: '50%', color: '#fff', fontSize: '28px', marginBottom: '24px', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)' }}>
            <i className="fas fa-shield-alt"></i>
          </div>
          
          <h2 style={{ fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: '900', color: '#ffffff', marginBottom: '20px', letterSpacing: '-1px' }}>Your Safety is <span style={{ color: '#ef4444' }}>Our Priority</span></h2>
          <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#94a3b8', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px auto' }}>India’s first safest public reporting network. Expose the truth and help your community without risking your privacy.</p>
          
          <Link href="/anonymous/join" className="footer-btn" style={{ padding: '18px 48px', background: 'linear-gradient(90deg, #dc2626, #ef4444)', color: '#ffffff', borderRadius: '14px', fontWeight: '900', fontSize: 'clamp(16px, 4vw, 18px)', textDecoration: 'none', display: 'inline-block', boxShadow: '0 15px 30px -5px rgba(220, 38, 38, 0.4)', transition: 'transform 0.3s, box-shadow 0.3s', border: '1px solid rgba(255,255,255,0.1)' }} onMouseOver={e => {e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(220, 38, 38, 0.5)'}} onMouseOut={e => {e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(220, 38, 38, 0.4)'}}>
            Get Your Anonymous ID <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </Link>
        </div>
      </section>
    </div>
  );
}
