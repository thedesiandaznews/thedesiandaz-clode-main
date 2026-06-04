'use client';

import { useState, useEffect } from 'react';
import { trackReferralSale } from '@/actions/affiliate';

// Define packages info matching flyer data
const LAUNCH_PACKAGES = [
  {
    id: 'launch_2month',
    name: '2 Months Complete Visibility',
    badge: 'LIMITED TIME OFFER!',
    basePrice: 10000,
    gst: 1800,
    total: 11800,
    duration: '2month' as const,
    exposure: '2 MONTHS OF CONSISTENT EXPOSURE',
    subText: 'Power-packed digital + print visibility to boost your brand where it matters most!',
    highlight: 'MAXIMUM LOCAL IMPACT!',
    color: '#CC2200',
    accentColor: '#FF6B00',
    deliverables: [
      { type: 'Print', text: '1 Medium Display Ad/week (8x5 cm) in Paper', icon: 'fa-newspaper' },
      { type: 'Website', text: '1 Premium Sidebar Banner Ad feed directly on main Homepage (24/7 high-traffic)', icon: 'fa-globe' },
      { type: 'Social Media', text: '2 Static Image Posts/week + Brand Logo watermarked on 5 Viral Reels', icon: 'fa-share-nodes' },
      { type: 'YouTube News', text: '1 L-Shape Graphical Banner Ad (15 Days)', icon: 'fa-youtube' },
      { type: 'Live News', text: '1 Daily Scrolling Ticker (30 Days)', icon: 'fa-tv' }
    ]
  },
  {
    id: 'launch_6month',
    name: '6 Months Complete Visibility',
    badge: 'LIMITED SLOTS AVAILABLE!',
    basePrice: 25000,
    gst: 4500,
    total: 29500,
    duration: '6month' as const,
    exposure: '6 MONTHS OF CONSISTENT EXPOSURE',
    subText: 'Perfect for established local brands wanting long-term dominant regional authority.',
    highlight: 'MAXIMUM LOCAL IMPACT + PREMIUM BRAND POSITIONING!',
    color: '#FF6B00',
    accentColor: '#CC2200',
    deliverables: [
      { type: 'Print', text: '1 Medium Display Ad/week (8x5 cm) in Paper', icon: 'fa-newspaper' },
      { type: 'Website', text: '1 Premium Sidebar Banner Ad feed directly on main Homepage (24/7 high-traffic)', icon: 'fa-globe' },
      { type: 'Social Media', text: '2 Static Image Posts/week + Brand Logo watermarked on 5 Viral Reels', icon: 'fa-share-nodes' },
      { type: 'YouTube News', text: '1 L-Shape Graphical Banner Ad (15 Days)', icon: 'fa-youtube' },
      { type: 'Live News', text: '1 Daily Scrolling Ticker (30 Days)', icon: 'fa-tv' }
    ]
  }
];

const LAUNCH_PAYMENT_LINKS = {
  launch_2month: 'https://rzp.io/rzp/QTLq1Kev',
  launch_6month: 'https://rzp.io/rzp/SVWX8m6R'
};

export default function LaunchOfferPage() {
  const [selectedPkg, setSelectedPkg] = useState<typeof LAUNCH_PACKAGES[0] | null>(null);
  
  // Form Wizard states
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    targetCity: 'Pakur',
    tickerText: '',
    bannerText: ''
  });

  // UI Flow states
  const [checkoutStep, setCheckoutStep] = useState<'packages' | 'customize' | 'checkout' | 'success'>('packages');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Read cookies for affiliate tracking on load
  useEffect(() => {
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const ref = getCookie('tda_ref');
      if (ref) setReferralCode(ref);
    } catch (e) {
      console.error('Error parsing referral cookies:', e);
    }
  }, []);

  // Update dynamic defaults as brand name updates
  useEffect(() => {
    if (formData.businessName) {
      setFormData(prev => ({
        ...prev,
        tickerText: prev.tickerText || `💥 Special Launch! Visit ${prev.businessName} in ${prev.targetCity} today for exciting offers!`,
        bannerText: prev.bannerText || `${prev.businessName}: Premium Local Partner`
      }));
    }
  }, [formData.businessName, formData.targetCity]);

  const handleSelectPackage = (pkg: typeof LAUNCH_PACKAGES[0]) => {
    setSelectedPkg(pkg);
    setCheckoutStep('customize');
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLaunchCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.businessName || !formData.email || !formData.phone) {
      setErrorMessage('Please fill out all contact fields before proceeding.');
      return;
    }
    if (!formData.tickerText || !formData.bannerText) {
      setErrorMessage('Please enter your ad ticker and banner text configurations.');
      return;
    }
    setErrorMessage('');
    setCheckoutStep('checkout');
  };

  const saveClientToDatabase = (transactionId: string) => {
    try {
      const saved = localStorage.getItem('tda_advertiser_clients');
      let clientsList = [];
      if (saved) {
        clientsList = JSON.parse(saved);
      }

      const startStr = new Date().toISOString().split('T')[0];
      const start = new Date(startStr);
      
      if (selectedPkg?.duration === '2month') {
        start.setMonth(start.getMonth() + 2);
      } else if (selectedPkg?.duration === '6month') {
        start.setMonth(start.getMonth() + 6);
      }
      const endStr = start.toISOString().split('T')[0];

      const newClient = {
        id: String(clientsList.length + 100),
        name: formData.name,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        packageId: selectedPkg?.id || 'launch_2month',
        duration: selectedPkg?.duration || '2month',
        targetCity: formData.targetCity,
        paidAmount: selectedPkg?.total || 0,
        paymentStatus: 'Paid',
        razorpayId: transactionId,
        campaignStatus: 'Active',
        startDate: startStr,
        endDate: endStr,
        tickerText: formData.tickerText,
        bannerText: formData.bannerText
      };

      clientsList.push(newClient);
      localStorage.setItem('tda_advertiser_clients', JSON.stringify(clientsList));
    } catch (e) {
      console.error('Failed to save campaign registration details', e);
    }
  };

  const processSimulatedPayment = () => {
    if (!selectedPkg) return;
    setPaymentStatus('processing');

    const transactionId = 'pay_RPY_LIVE_' + Math.floor(10000000 + Math.random() * 90000000);

    setTimeout(() => {
      // Save campaign details
      saveClientToDatabase(transactionId);

      // Fire referral affiliate track hook if present
      if (referralCode) {
        try {
          const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return undefined;
          };
          const refSource = getCookie('tda_ref_source') || 'Direct';

          trackReferralSale(referralCode, {
            customerName: formData.name,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            packageName: selectedPkg.name,
            totalPaid: selectedPkg.total,
            transactionId: transactionId,
            referralSource: refSource
          }).then(res => {
            if (res.success) {
              console.log('Affiliate referral tracked successfully:', res);
            } else {
              console.warn('Affiliate referral failed:', res.message);
            }
          });
        } catch (err) {
          console.error('Affiliate hook failed during launch transaction', err);
        }
      }

      setPaymentStatus('success');
      setTimeout(() => {
        setCheckoutStep('success');
      }, 1000);
    }, 2200);
  };

  return (
    <div style={{ background: '#FAFBFD', color: '#1E293B', fontFamily: "'Poppins', 'Mukta', sans-serif", minHeight: '100vh', padding: '40px 16px' }}>
      
      {/* Inline styles for custom animations, glass effect, responsive layout, and interactive mockups */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tickerMove {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .ticker-text {
          display: inline-block;
          white-space: nowrap;
          padding-left: 100%;
          animation: tickerMove 20s linear infinite;
        }
        .package-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #E2E8F0;
        }
        .package-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 30px rgba(0, 0, 0, 0.08);
          border-color: #CBD5E1;
        }
        .form-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #FFFFFF;
        }
        .form-input:focus {
          border-color: #CC2200;
          box-shadow: 0 0 0 3px rgba(204, 34, 0, 0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #CC2200 0%, #E63E1C 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(204, 34, 0, 0.25);
        }
        .btn-secondary {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #E2E8F0;
        }
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: rgba(204, 34, 0, 0.08);
          color: #CC2200;
        }
        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        .payment-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .payment-modal {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: scaleUp 0.3s ease-out;
        }
        .mockup-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .responsive-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      ` }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ================= HEADER BRANDING BAR ================= */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(204, 34, 0, 0.06)', border: '1px solid rgba(204, 34, 0, 0.15)', padding: '6px 16px', borderRadius: '30px', marginBottom: '16px' }}>
            <span style={{ color: '#CC2200', fontWeight: 800, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              🔴 Santhal Pargana Pioneer Media Network
            </span>
          </div>
          
          <h1 style={{ fontSize: '38px', fontWeight: 900, color: '#0F172A', lineHeight: '1.2', letterSpacing: '-1px', margin: '0 0 12px 0' }}>
            Smart Local Targeting <span style={{ color: '#CC2200' }}>Launching Offers</span>
          </h1>
          <p style={{ color: '#64748B', maxWidth: '640px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6' }}>
            Maximize your brand reach with high-converting display placements. Place your business directly in front of regional buyers on our website homepage, news streams, local reels, and print editions.
          </p>

          {/* Hotline Contact bar */}
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '40px',
            padding: '8px 24px',
            marginTop: '20px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>📞 Need Assistance? Call or WhatsApp Sonu Kumar Saha:</span>
            <a href="tel:6203868383" style={{ color: '#CC2200', fontWeight: 800, textDecoration: 'none', fontSize: '15px' }}>+91-6203868383</a>
          </div>
        </div>

        {/* ================= STEPPER CONTROL ================= */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="step-indicator" style={{ background: checkoutStep === 'packages' ? '#CC2200' : '#E2E8F0', color: checkoutStep === 'packages' ? 'white' : '#64748B' }}>1</div>
            <span style={{ fontWeight: checkoutStep === 'packages' ? 'bold' : 'normal', color: checkoutStep === 'packages' ? '#0F172A' : '#64748B', fontSize: '13.5px' }}>Select Pack</span>
          </div>
          <div style={{ width: '40px', height: '1.5px', background: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="step-indicator" style={{ background: checkoutStep === 'customize' ? '#CC2200' : '#E2E8F0', color: checkoutStep === 'customize' ? 'white' : '#64748B' }}>2</div>
            <span style={{ fontWeight: checkoutStep === 'customize' ? 'bold' : 'normal', color: checkoutStep === 'customize' ? '#0F172A' : '#64748B', fontSize: '13.5px' }}>Customize Creatives</span>
          </div>
          <div style={{ width: '40px', height: '1.5px', background: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="step-indicator" style={{ background: checkoutStep === 'checkout' ? '#CC2200' : '#E2E8F0', color: checkoutStep === 'checkout' ? 'white' : '#64748B' }}>3</div>
            <span style={{ fontWeight: checkoutStep === 'checkout' ? 'bold' : 'normal', color: checkoutStep === 'checkout' ? '#0F172A' : '#64748B', fontSize: '13.5px' }}>Payment & Publish</span>
          </div>
        </div>

        {/* ================= STEP 1: PACKAGES CARDS ================= */}
        {checkoutStep === 'packages' && (
          <div className="responsive-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {LAUNCH_PACKAGES.map(pkg => (
              <div 
                key={pkg.id} 
                className="package-card" 
                style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Header ribbon badge */}
                <div style={{ background: pkg.color, color: 'white', padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>
                  {pkg.badge}
                </div>

                <div style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>{pkg.name}</h3>
                  <p style={{ color: '#64748B', fontSize: '13px', lineHeight: '1.5', minHeight: '40px', margin: '0 0 24px 0' }}>{pkg.subText}</p>
                  
                  {/* Pricing grid */}
                  <div style={{ background: '#FAFBFD', border: '1.5px solid #F1F5F9', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>EXCLUSIVELY DISCOUNTED PRICE</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                      <span style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A' }}>₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                      <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>+ GST 18%</span>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: '#E2E8F0', margin: '12px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569', fontWeight: 600 }}>
                      <span>Base: ₹{pkg.basePrice.toLocaleString('en-IN')}</span>
                      <span>GST (18%): ₹{pkg.gst.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#CC2200', fontWeight: 800, marginTop: '8px' }}>
                      <span>Net Payable:</span>
                      <span>₹{pkg.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Highlights exposure badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', background: `${pkg.color}0A`, padding: '12px 16px', borderRadius: '8px', borderLeft: `4px solid ${pkg.color}` }}>
                    <i className="fa-solid fa-bullseye" style={{ color: pkg.color, fontSize: '16px' }}></i>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: pkg.color, letterSpacing: '0.2px' }}>
                      {pkg.exposure}
                    </span>
                  </div>

                  {/* Deliverables List */}
                  <h4 style={{ fontSize: '12.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px 0' }}>
                    What's Included:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                    {pkg.deliverables.map((del, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ color: '#10B981', fontSize: '14px', marginTop: '3px' }}>
                          <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#334155' }}>{del.type}: </strong>
                          <span style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>{del.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Button trigger */}
                  <button 
                    onClick={() => handleSelectPackage(pkg)}
                    className="btn-primary"
                    style={{ width: '100%', background: `linear-gradient(135deg, ${pkg.color} 0%, ${pkg.accentColor} 100%)` }}
                  >
                    <span>Proceed Booking</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= STEP 2: CREATIVES CUSTOMIZER & FORM ================= */}
        {checkoutStep === 'customize' && selectedPkg && (
          <div className="responsive-grid" style={{ alignItems: 'flex-start' }}>
            
            {/* Booking Form Card */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
                Campaign Details Setup
              </h3>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 24px 0' }}>
                Fill out your advertiser profile and customize the scrolling ticker and sidebar banner advertisements below.
              </p>

              {errorMessage && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleLaunchCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Rep info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Representative Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Rahul Kumar" 
                      value={formData.name} 
                      onChange={handleFormChange} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Brand / Business Name</label>
                    <input 
                      type="text" 
                      name="businessName" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Kumar Automobile" 
                      value={formData.businessName} 
                      onChange={handleFormChange} 
                    />
                  </div>
                </div>

                {/* Contact detail */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Official Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      className="form-input" 
                      placeholder="e.g. owner@brand.com" 
                      value={formData.email} 
                      onChange={handleFormChange} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Mobile Number (WhatsApp Link)</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      className="form-input" 
                      placeholder="e.g. +91 9988776655" 
                      value={formData.phone} 
                      onChange={handleFormChange} 
                    />
                  </div>
                </div>

                {/* Target Geofence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Geofence Target City (Jharkhand Local Region)</label>
                  <input 
                    type="text" 
                    name="targetCity" 
                    required 
                    className="form-input" 
                    placeholder="e.g. Pakur, Dumka, Sahibganj, Deoghar" 
                    value={formData.targetCity} 
                    onChange={handleFormChange} 
                  />
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    * We selectively filter traffic to visitors browsing from this region.
                  </span>
                </div>

                {/* Creatives Banners */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
                    Customize Live Advertising Creatives
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Homepage Sidebar Banner Text Overlay</label>
                      <input 
                        type="text" 
                        name="bannerText" 
                        required 
                        maxLength={65} 
                        className="form-input" 
                        placeholder="e.g. Kumar Automobile: Pakur's Premier Bike Dealership" 
                        value={formData.bannerText} 
                        onChange={handleFormChange} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                        <span>Appears on our desktop & mobile categories homepage.</span>
                        <span>{formData.bannerText.length}/65 chars</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>YouTube & Live Scroll Ticker Text</label>
                      <textarea 
                        name="tickerText" 
                        required 
                        maxLength={140} 
                        rows={2} 
                        className="form-input" 
                        style={{ resize: 'none' }}
                        placeholder="e.g. 🏍️ Special Launch Offer! Get FREE insurance + helmet on booking any vehicle this weekend at Kumar Automobile Pakur! Book now." 
                        value={formData.tickerText} 
                        onChange={handleFormChange} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B' }}>
                        <span>Continuous marquee ticker displaying below breaking news streams.</span>
                        <span>{formData.tickerText.length}/140 chars</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setCheckoutStep('packages')} 
                    className="btn-secondary" 
                    style={{ flex: 1 }}
                  >
                    Back to Packages
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ flex: 2, background: `linear-gradient(135deg, ${selectedPkg.color} 0%, ${selectedPkg.accentColor} 100%)` }}
                  >
                    <span>Go to Payment Checkout</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

              </form>
            </div>

            {/* Campaign Preview Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Sidebar ad preview */}
              <div className="mockup-container">
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginLeft: '8px' }}>Mock Website Sidebar Advertisement (24/7 Homepage Slot)</span>
                </div>
                
                <div style={{ padding: '20px', background: '#FFFFFF', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '280px', border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '24px 16px', background: '#FAFBFD', textAlign: 'center', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', fontWeight: 800, background: '#CC2200', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>SPONSOR AD</span>
                    
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(204, 34, 0, 0.08)', color: '#CC2200', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px' }}>
                      📢
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
                      {formData.businessName || 'Your Brand Name'}
                    </h4>

                    <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                      {formData.bannerText || 'Example sidebar ad content is custom generated on load.'}
                    </p>

                    <div style={{ fontSize: '10.5px', color: '#828FA3', fontWeight: 700, borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                      📍 Geofence Region: <span style={{ color: '#CC2200' }}>{formData.targetCity || 'Pakur'} Only</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrolling ticker preview */}
              <div className="mockup-container">
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginLeft: '8px' }}>Mock YouTube & Live News scrolling ticker overlay</span>
                </div>

                <div style={{ padding: '0px', background: '#0F172A', position: 'relative', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                  
                  {/* Simulated video playback frame */}
                  <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', bottom: '48px', border: '1.5px dashed rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#828FA3', fontSize: '13px' }}>
                    📺 Simulated Video Bulletin Feed (Santhal Pargana)
                  </div>

                  {/* Ticker bottom bar */}
                  <div style={{ background: '#FF0000', height: '36px', width: '100%', position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', overflow: 'hidden', borderTop: '1.5px solid #CC2200' }}>
                    
                    {/* Header badge tag */}
                    <div style={{ background: '#0F172A', color: '#FFFF00', height: '100%', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '11px', fontWeight: 900, zIndex: 20, boxShadow: '6px 0 10px rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      BREAKING NEWS
                    </div>

                    {/* Moving message content */}
                    <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>
                      <div className="ticker-text">
                        {formData.tickerText || 'Your customized news broadcast text will continuously scroll here across regional update channels.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print layout representation flyer */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📰 Newspaper Print Placement:</span>
                  <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>Medium Display (8x5 cm)</span>
                </h4>
                <p style={{ color: '#475569', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
                  Includes 1 premium display ad printed per week inside our Santhal Pargana physical newspaper edition. Our graphic design studio compiles visual creatives using your registered brand elements and logo via direct WhatsApp confirmation.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ================= STEP 3: TRANSACTION SUCCESS ================= */}
        {checkoutStep === 'success' && selectedPkg && (
          <div style={{ maxWidth: '580px', margin: '40px auto', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#DEF7EC', color: '#03543F', fontSize: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              ✓
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#03543F', margin: '0 0 8px 0' }}>
              Campaign Successfully Placed!
            </h2>
            <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: '1.6', margin: '0 0 32px 0' }}>
              Thank you for partnering with **The Desi Andaz Media Network**! Your smart geotargeted local advertising campaign has been recorded and is now processing for publication.
            </p>

            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 16px 0', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                Booking Details Summary
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Brand Name:</span>
                  <strong style={{ color: '#0F172A' }}>{formData.businessName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Campaign Package:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedPkg.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Billing Cycle:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedPkg.duration.toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Target Region:</span>
                  <strong style={{ color: '#0F172A' }}>{formData.targetCity} Only</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '10px', color: '#CC2200' }}>
                  <span>Total Amount Paid:</span>
                  <strong>₹{selectedPkg.total.toLocaleString('en-IN')} (Incl. GST)</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a 
                href={`https://wa.me/916203868383?text=Hello%20Sonu%20Kumar%20Saha,%20I%20have%20just%20completed%20the%20ad%20campaign%20booking%20for%20${encodeURIComponent(formData.businessName)}%20on%20The%20Desi%20Andaz%20Media%20Network!%20Please%20verify%20my%20creatives.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ width: '100%', background: '#25D366' }}
              >
                <i className="fa-brands fa-whatsapp" style={{ fontSize: '18px' }}></i>
                <span>Send Creatives on WhatsApp</span>
              </a>

              <button 
                onClick={() => {
                  setFormData({
                    name: '',
                    businessName: '',
                    email: '',
                    phone: '',
                    targetCity: 'Pakur',
                    tickerText: '',
                    bannerText: ''
                  });
                  setSelectedPkg(null);
                  setCheckoutStep('packages');
                  setPaymentStatus('idle');
                }}
                className="btn-secondary"
                style={{ width: '100%' }}
              >
                Book Another Campaign
              </button>

              <a 
                href="/admin/advertiser"
                style={{
                  fontSize: '13px',
                  color: '#475569',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  marginTop: '8px'
                }}
              >
                Go to Advertiser Admin Control panel to verify registry
              </a>
            </div>

          </div>
        )}

      </div>

      {/* ================= SIMULATED PAYMENT DIALOG MODAL ================= */}
      {checkoutStep === 'checkout' && selectedPkg && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal">
            
            {/* Modal Header */}
            <div style={{ background: '#0F172A', color: 'white', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#CC2200', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>LIVE</span>
                <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.2px' }}>Razorpay Secure Checkout</span>
              </div>
              <button 
                onClick={() => setCheckoutStep('customize')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            {paymentStatus === 'idle' && (
              <div style={{ padding: '24px' }}>
                <div style={{ background: '#FAFBFD', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>CAMPAIGN ORDER</span>
                    <strong style={{ color: '#0F172A' }}>{selectedPkg.name}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748B', fontSize: '11px', display: 'block' }}>TOTAL (INCL. GST)</span>
                    <strong style={{ color: '#CC2200' }}>₹{selectedPkg.total.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Razorpay Checkout Iframe */}
                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '2.5px solid #CC2200', boxShadow: '0 8px 24px rgba(204, 34, 0, 0.08)', marginBottom: '16px' }}>
                  <iframe 
                    src={LAUNCH_PAYMENT_LINKS[selectedPkg.id as keyof typeof LAUNCH_PAYMENT_LINKS]}
                    style={{ 
                      width: '100%', 
                      height: '480px', 
                      border: 'none',
                      display: 'block'
                    }}
                    title="Razorpay Secure Portal"
                  />
                </div>

                {/* Complete Button & New Window Fallback */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={processSimulatedPayment}
                    className="btn-primary"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', height: '48px' }}
                  >
                    <i className="fa-solid fa-circle-check" style={{ fontSize: '14px' }}></i>
                    <span>Complete Booking & Sync Campaign (After Payment)</span>
                  </button>
                  
                  <a 
                    href={LAUNCH_PAYMENT_LINKS[selectedPkg.id as keyof typeof LAUNCH_PAYMENT_LINKS]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      textAlign: 'center', 
                      fontSize: '12px', 
                      color: '#475569', 
                      textDecoration: 'underline' 
                    }}
                  >
                    Can't complete payment in frame? Click here to open checkout in a new window
                  </a>
                </div>
              </div>
            )}

            {/* Payment processing loader state */}
            {paymentStatus === 'processing' && (
              <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ border: '4px solid #E2E8F0', borderTop: '4px solid #CC2200', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0' }}>
                  Verifying Transaction Credentials...
                </h3>
                <p style={{ color: '#64748B', fontSize: '12.5px', margin: 0 }}>
                  Contacting Razorpay secure network node. Please do not close or refresh this tab.
                </p>
                
                {/* Embedded spin keyframe style */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                ` }} />
              </div>
            )}

            {/* Payment completed simulation */}
            {paymentStatus === 'success' && (
              <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#D1FAE5', color: '#059669', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#059669', margin: '0 0 8px 0' }}>
                  Payment Transferred Securely!
                </h3>
                <p style={{ color: '#64748B', fontSize: '12.5px', margin: 0 }}>
                  Redirecting back to Campaign Onboarding summary...
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
