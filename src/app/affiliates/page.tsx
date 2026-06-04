'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { registerAffiliatePartner, loginAffiliatePartner } from '@/actions/affiliate';

type ViewMode = 'landing' | 'login' | 'register';

export default function AffiliatePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Forms State
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    dob: '',
    address: '',
    city: '',
    state: 'Jharkhand',
    pinCode: '',
    aadhaarNumber: '',
    panNumber: '',
    bankHolderName: '',
    bankAccountNumber: '',
    ifscCode: '',
    upiId: '',
    photoUrl: '',
    password: '',
    confirmPassword: '',
    agreementAccepted: false
  });

  // OTP Verification States
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const affiliateId = localStorage.getItem('affiliateId');
      if (affiliateId) {
        window.location.href = '/affiliates/dashboard';
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      alert('कृपया ईमेल और पासवर्ड दर्ज करें!');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAffiliatePartner(loginForm.email, loginForm.password);
      if (res.success && res.affiliate) {
        localStorage.setItem('affiliateId', res.affiliate.id);
        localStorage.setItem('affiliateCode', res.affiliate.affiliateCode);
        localStorage.setItem('affiliateName', res.affiliate.fullName);
        localStorage.setItem('affiliateEmail', res.affiliate.email);
        localStorage.setItem('affiliateStatus', res.affiliate.status);
        alert('लॉगिन सफल!');
        window.location.href = '/affiliates/dashboard';
      } else {
        alert(res.message || 'लॉगिन विफल। कृपया क्रेडेंशियल्स जांचें।');
      }
    } catch (err) {
      console.error(err);
      alert('एक आंतरिक त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtps = () => {
    if (!registerForm.mobile || !registerForm.email) {
      alert('कृपया मोबाइल नंबर और ईमेल दर्ज करें!');
      return;
    }
    setOtpSent(true);
    alert('सत्यापन कोड (123456) आपके मोबाइल नंबर और ईमेल पर भेज दिया गया है!');
  };

  const handleVerifyMobile = () => {
    if (mobileOtp === '123456') {
      setIsMobileVerified(true);
      alert('मोबाइल नंबर सत्यापित हो गया है!');
    } else {
      alert('अमान्य मोबाइल OTP!');
    }
  };

  const handleVerifyEmail = () => {
    if (emailOtp === '123456') {
      setIsEmailVerified(true);
      alert('ईमेल सफलतापूर्वक सत्यापित हो गया है!');
    } else {
      alert('अमान्य ईमेल OTP!');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      alert('पासवर्ड मेल नहीं खाते!');
      return;
    }
    if (!isMobileVerified || !isEmailVerified) {
      alert('कृपया पहले मोबाइल और ईमेल सत्यापित करें!');
      return;
    }
    if (!registerForm.agreementAccepted) {
      alert('पंजीकरण करने के लिए आपको शर्तों को स्वीकार करना होगा!');
      return;
    }

    setLoading(true);
    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;
      const res = await registerAffiliatePartner({
        ...registerForm,
        userAgent,
        ipAddress: '127.0.0.1',
        photoUrl: registerForm.photoUrl || 'https://picsum.photos/150/150?random=11'
      });

      if (res.success) {
        alert(`सफल पंजीकरण! आपकी पार्टनर कोड है: ${res.affiliateCode}। एडमिन अनुमोदन के बाद आप लॉग इन कर पाएंगे।`);
        setViewMode('login');
      } else {
        alert(res.message || 'पंजीकरण विफल!');
      }
    } catch (err) {
      console.error(err);
      alert('पंजीकरण के दौरान त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#090d16', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Poppins', sans-serif", overflowX: 'hidden' }}>
      
      {/* Background Glow */}
      <div style={{
        position: 'fixed',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)',
        top: '-10%',
        left: '-10%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
        bottom: '-10%',
        right: '-10%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <header style={{
        background: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
              THE DESI ANDAZ <span style={{ color: '#ef4444' }}>AFFILIATES</span>
            </span>
          </Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setViewMode('login')}
              style={{
                background: viewMode === 'login' ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setViewMode('register');
                setStep(1);
              }}
              style={{
                background: viewMode === 'register' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px', position: 'relative', zIndex: 1 }}>
        
        {/* LANDING MODE */}
        {viewMode === 'landing' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '50px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <span style={{
                background: 'rgba(79, 70, 229, 0.1)',
                color: '#818cf8',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                alignSelf: 'center',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                📢 Partnership Opportunity
              </span>
              <h1 style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-1px' }}>
                Become an Affiliate Partner & Earn <br />
                <span style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 950 }}>
                  High Monthly Commissions
                </span>
              </h1>
              <p style={{ fontSize: '16.5px', color: '#94a3b8', lineHeight: '1.6' }}>
                Promote our premium localized B2B marketing & advertising services. Help local brands grow and secure a massive monthly income with dynamic performance slab calculations.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
                <button
                  onClick={() => { setViewMode('register'); setStep(1); }}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: '30px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  🚀 Become a Partner Now
                </button>
                <button
                  onClick={() => setViewMode('login')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px 32px',
                    borderRadius: '30px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🔑 Partner Login
                </button>
              </div>
            </div>

            {/* Commissions slabs description */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '24px',
              padding: '36px',
              maxWidth: '900px',
              margin: '0 auto',
              backdropFilter: 'blur(20px)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>📈 Performance Commission Slabs (मासिक स्लैब दरें)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {[
                  { range: '₹0 – ₹1,00,000', comm: '15% Commission', desc: 'Starting Slab' },
                  { range: '₹1,00,001 – ₹2,00,000', comm: '18% Commission', desc: 'Achiever Slab' },
                  { range: '₹2,00,001 – ₹5,00,000', comm: '20% Commission', desc: 'Leader Slab' },
                  { range: 'Above ₹5,00,000', comm: '25% Commission', desc: 'Elite / VIP Slab' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    padding: '24px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 700 }}>{s.desc}</span>
                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{s.range}</span>
                    <span style={{ fontSize: '15px', color: '#ef4444', fontWeight: 700 }}>{s.comm}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '20px', fontStyle: 'italic' }}>
                *नोट:  कमीशन की गणना GST और करों को छोड़कर केवल शुद्ध बेस वैल्यू पर की जाती है।
              </p>
            </div>
          </div>
        )}

        {/* LOGIN MODE */}
        {viewMode === 'login' && (
          <div style={{ maxWidth: '420px', margin: '0 auto' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '36px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>पार्टनर लॉगिन</h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px', textAlign: 'center' }}>अपनी लॉगिन जानकारी दर्ज करें</p>
              
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Email (ईमेल)</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="name@email.com"
                    required
                    style={{
                      background: 'rgba(8, 12, 26, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Password (पासवर्ड)</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    style={{
                      background: 'rgba(8, 12, 26, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  {loading ? 'प्रमाणीकरण हो रहा है...' : 'सुरक्षित लॉगिन'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
                <span>नया पार्टनर खाता चाहिए? </span>
                <button
                  onClick={() => { setViewMode('register'); setStep(1); }}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  यहाँ रजिस्टर करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER MODE */}
        {viewMode === 'register' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '36px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)'
            }}>
              {/* Stepper Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: 'rgba(255,255,255,0.06)',
                  zIndex: 0
                }} />
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '10%',
                  width: step === 1 ? '0%' : step === 2 ? '40%' : '80%',
                  height: '2px',
                  background: '#ef4444',
                  zIndex: 0,
                  transition: 'all 0.3s'
                }} />

                {[
                  { num: 1, label: 'व्यक्तिगत जानकारी' },
                  { num: 2, label: 'बैंक व सत्यापन' },
                  { num: 3, label: 'नियम व स्वीकार्यता' }
                ].map((s) => (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, cursor: 'pointer' }} onClick={() => step > s.num && setStep(s.num)}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: step >= s.num ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#1e293b',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 800,
                      boxShadow: step >= s.num ? '0 0 10px rgba(239, 68, 68, 0.25)' : 'none'
                    }}>
                      {s.num}
                    </div>
                    <span style={{ fontSize: '11px', color: step >= s.num ? '#f1f5f9' : '#64748b', fontWeight: 600 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={step === 3 ? handleRegister : (e) => { e.preventDefault(); setStep(prev => prev + 1); }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* STEP 1: PERSONAL DETAILS */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#ef4444' }}>व्यक्तिगत विवरण (Personal Info)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>पूरा नाम (Full Name) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.fullName}
                          onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          placeholder="राम कुमार"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>जन्म तिथि (DOB) *</label>
                        <input
                          type="date"
                          required
                          value={registerForm.dob}
                          onChange={e => setRegisterForm({ ...registerForm, dob: e.target.value })}
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>मोबाइल नंबर (Mobile) *</label>
                        <input
                          type="tel"
                          required
                          value={registerForm.mobile}
                          onChange={e => setRegisterForm({ ...registerForm, mobile: e.target.value })}
                          placeholder="+91-XXXXXXXXXX"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>ईमेल (Email) *</label>
                        <input
                          type="email"
                          required
                          value={registerForm.email}
                          onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                          placeholder="name@email.com"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>पता (Full Address) *</label>
                      <input
                        type="text"
                        required
                        value={registerForm.address}
                        onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="गली/मोहल्ला, मकान नंबर"
                        style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>City (शहर) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.city}
                          onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                          placeholder="Pakur"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>State (राज्य) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.state}
                          onChange={e => setRegisterForm({ ...registerForm, state: e.target.value })}
                          placeholder="Jharkhand"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>PIN Code *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.pinCode}
                          onChange={e => setRegisterForm({ ...registerForm, pinCode: e.target.value })}
                          placeholder="816107"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>पासवर्ड (Password) *</label>
                        <input
                          type="password"
                          required
                          value={registerForm.password}
                          onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                          placeholder="••••••••"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>पासवर्ड कन्फर्म करें *</label>
                        <input
                          type="password"
                          required
                          value={registerForm.confirmPassword}
                          onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BANK AND KYC DETAILS */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#ef4444' }}>बैंक, यूपीआई व सत्यापन (Payment & KYC Details)</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>आधार नंबर (Aadhaar Number) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.aadhaarNumber}
                          onChange={e => setRegisterForm({ ...registerForm, aadhaarNumber: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>पैन नंबर (PAN Number) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.panNumber}
                          onChange={e => setRegisterForm({ ...registerForm, panNumber: e.target.value })}
                          placeholder="ABCDE1234F"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Bank Account Holder Name *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.bankHolderName}
                          onChange={e => setRegisterForm({ ...registerForm, bankHolderName: e.target.value })}
                          placeholder="Account Holder Name"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>Account Number *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.bankAccountNumber}
                          onChange={e => setRegisterForm({ ...registerForm, bankAccountNumber: e.target.value })}
                          placeholder="Bank Account Number"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>IFSC Code *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.ifscCode}
                          onChange={e => setRegisterForm({ ...registerForm, ifscCode: e.target.value })}
                          placeholder="SBIN0001234"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>UPI ID (वैकल्पिक)</label>
                        <input
                          type="text"
                          value={registerForm.upiId}
                          onChange={e => setRegisterForm({ ...registerForm, upiId: e.target.value })}
                          placeholder="ram@ybl"
                          style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                        />
                      </div>
                    </div>

                    {/* Profile Photo simulation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>प्रोफाइल फोटो URL</label>
                      <input
                        type="text"
                        value={registerForm.photoUrl}
                        onChange={e => setRegisterForm({ ...registerForm, photoUrl: e.target.value })}
                        placeholder="https://images.com/my-profile.jpg"
                        style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '13.5px' }}
                      />
                    </div>

                    {/* Verification Area */}
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      marginTop: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700 }}>मोबाइल व ईमेल सत्यापन</span>
                        {!otpSent && (
                          <button
                            type="button"
                            onClick={handleSendOtps}
                            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            सत्यापन कोड भेजें
                          </button>
                        )}
                      </div>

                      {otpSent && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={mobileOtp}
                              onChange={e => setMobileOtp(e.target.value)}
                              placeholder="Mobile OTP (123456)"
                              disabled={isMobileVerified}
                              style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '13px', flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyMobile}
                              disabled={isMobileVerified}
                              style={{
                                background: isMobileVerified ? '#10b981' : '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {isMobileVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={emailOtp}
                              onChange={e => setEmailOtp(e.target.value)}
                              placeholder="Email OTP (123456)"
                              disabled={isEmailVerified}
                              style={{ background: 'rgba(8, 12, 26, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '13px', flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyEmail}
                              disabled={isEmailVerified}
                              style={{
                                background: isEmailVerified ? '#10b981' : '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {isEmailVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: AGREEMENT AND FINAL SUBMISSION */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: '#ef4444' }}>अंतिम घोषणा एवं शर्तें (Affiliate Agreement)</h3>
                    
                    <div style={{
                      background: 'rgba(8, 12, 26, 0.85)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      padding: '20px',
                      borderRadius: '12px',
                      fontSize: '12.5px',
                      lineHeight: '1.6',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      color: '#94a3b8',
                      textAlign: 'justify'
                    }}>
                      <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '8px' }}>THE DESI ANDAZ AFFILIATE PARTNER AGREEMENT</h4>
                      <p style={{ marginBottom: '8px' }}><strong>1. Commission Policy (कमीशन नियम):</strong> कमीशन की गणना केवल ग्राहक द्वारा भुगतान की गई राशि में से 18% GST काटने के बाद बचे बेस सर्विस वैल्यू (Base Service value) पर की जाएगी। गेटवे शुल्क या अतिरिक्त सरकारी करों पर कोई कमीशन देय नहीं होगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>2. Refund Policy (रिफंड नियम):</strong> यदि ग्राहक द्वारा खरीदे गए विज्ञापन पैकेज को निरस्त कर दिया जाता है या रिफंड किया जाता है, तो उस सेल पर अर्जित कमीशन तुरंत काट लिया जाएगा और वॉलेट बैलेंस समायोजित किया जाएगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>3. Payout Schedule (भुगतान चक्र):</strong> संचित भुगतान महीने के अंत में संसाधित किए जाएंगे और अगले महीने की 1 से 7 तारीख के बीच बैंक हस्तांतरण या यूपीआई के माध्यम से जारी किए जाएंगे। न्यूनतम भुगतान सीमा ₹500 है। यदि अर्जित कमीशन ₹500 से कम है, तो उसे अगले माह के लिए कैरी फॉरवर्ड कर दिया जाएगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>4. Anti-Fraud Policy (धोखाधड़ी निषेध):</strong> अपने स्वयं के पार्टनर लिंक का उपयोग करके खरीदारी करना (Self-purchases) सख्त वर्जित है। डुप्लिकेट संपर्क विवरण, एक ही आईपी/डिवाइस के माध्यम से किए गए संदिग्ध भुगतानों को सिस्टम द्वारा स्वचालित रूप से फ्लैग किया जाएगा और एडमिन द्वारा खाते को बिना किसी पूर्व सूचना के निलंबित किया जा सकता है।</p>
                    </div>

                    <label style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>
                      <input
                        type="checkbox"
                        checked={registerForm.agreementAccepted}
                        onChange={e => setRegisterForm({ ...registerForm, agreementAccepted: e.target.checked })}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>मैं घोषणा करता हूँ कि मैंने सभी नियमों, कमीशन पॉलिसियों और रिफंड शर्तों को ध्यानपूर्वक पढ़ लिया है और मैं इनसे पूरी तरह सहमत हूँ। *</span>
                    </label>
                  </div>
                )}

                {/* Stepper Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(prev => prev - 1)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '13.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      पीछे जाएं
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 28px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'संसाधित हो रहा है...' : step === 3 ? 'रजिस्टर करें' : 'आगे बढ़ें'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
