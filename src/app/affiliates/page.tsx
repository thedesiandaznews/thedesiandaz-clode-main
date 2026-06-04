'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { registerAffiliatePartner, loginAffiliatePartner } from '@/actions/affiliate';
import Footer from '@/components/Footer';
import styles from './affiliates.module.css';

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
    <div className={styles.pageWrapper}>
      
      {/* Background Aurora Glows removed for clean light theme */}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>
              <span className={styles.logoDesi}>THE DESI</span> <span className={styles.logoAndaz}>ANDAZ</span> <span className={styles.logoHighlight}>AFFILIATES</span>
            </span>
          </Link>
          <div className={styles.navActionGroup}>
            <button
              onClick={() => setViewMode('login')}
              className={`${styles.navBtn} ${viewMode === 'login' ? styles.navBtnActive : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setViewMode('register');
                setStep(1);
              }}
              className={`${styles.navBtn} ${viewMode === 'register' ? styles.navBtnPrimary : ''}`}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        
        {/* LANDING MODE */}
        {viewMode === 'landing' && (
          <div className={styles.flexWrapper}>
            <div className={styles.heroBlock}>
              <span className={styles.badge}>
                📢 Partnership Opportunity
              </span>
              <h1 className={styles.heroTitle}>
                Become an Affiliate Partner & Earn <br />
                <span className={styles.titleGradient}>
                  High Monthly Commissions
                </span>
              </h1>
              <p className={styles.heroSubtitle}>
                Promote our premium localized B2B marketing & advertising services. Help local brands grow and secure a massive monthly income with dynamic performance slab calculations.
              </p>
              <div className={styles.heroCtaGroup}>
                <button
                  onClick={() => { setViewMode('register'); setStep(1); }}
                  className={`${styles.ctaBtn} ${styles.ctaPrimary}`}
                >
                  🚀 Become a Partner Now
                </button>
                <button
                  onClick={() => setViewMode('login')}
                  className={`${styles.ctaBtn} ${styles.ctaSecondary}`}
                >
                  🔑 Partner Login
                </button>
              </div>
            </div>

            {/* Commissions slabs description */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>📈 Performance Commission Slabs (मासिक स्लैब दरें)</h3>
              <div className={styles.slabsGrid}>
                {[
                  { range: '₹0 – ₹1,00,000', comm: '15% Commission', desc: 'Starting Slab', color: '#FF6B00' },
                  { range: '₹1,00,001 – ₹2,00,000', comm: '18% Commission', desc: 'Achiever Slab', color: '#F97316' },
                  { range: '₹2,00,001 – ₹5,00,000', comm: '20% Commission', desc: 'Leader Slab', color: '#CC2200' },
                  { range: 'Above ₹5,00,000', comm: '25% Commission', desc: 'Elite / VIP Slab', color: '#D4A017' }
                ].map((s, idx) => (
                  <div key={idx} className={styles.slabCard} style={{ borderLeft: `4px solid ${s.color}` }}>
                    <span className={styles.slabDesc} style={{ color: s.color }}>{s.desc}</span>
                    <span className={styles.slabRange}>{s.range}</span>
                    <span className={styles.slabComm} style={{ color: s.color }}>{s.comm}</span>
                  </div>
                ))}
              </div>
              <p className={styles.slabNote}>
                *नोट: कमीशन की गणना GST और करों को छोड़कर केवल शुद्ध बेस वैल्यू पर की जाती है।
              </p>
            </div>

            {/* How It Works */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>🛠️ Join in 3 Simple Steps (पार्टनर बनने की प्रक्रिया)</h3>
              <div className={styles.stepsGrid}>
                <div className={styles.stepBlock}>
                  <div className={`${styles.stepNum} ${styles.stepNum1}`}>1</div>
                  <h4 className={styles.stepTitle}>1. Register Account</h4>
                  <p className={styles.stepText}>पार्टनर रजिस्ट्रेशन फॉर्म भरकर अपना खाता तुरंत बनाएं। बैंक, यूपीआई और केवाईसी विवरण दर्ज करें।</p>
                </div>
                <div className={styles.stepBlock}>
                  <div className={`${styles.stepNum} ${styles.stepNum2}`}>2</div>
                  <h4 className={styles.stepTitle}>2. Share Referral Links</h4>
                  <p className={styles.stepText}>डैशबोर्ड से सामान्य या विशिष्ट सेवा का रेफरल लिंक कॉपी करें और अपने नेटवर्क/व्हाट्सएप ग्रुप्स में साझा करें।</p>
                </div>
                <div className={styles.stepBlock}>
                  <div className={`${styles.stepNum} ${styles.stepNum3}`}>3</div>
                  <h4 className={styles.stepTitle}>3. Earn Commissions</h4>
                  <p className={styles.stepText}>आपके रेफरल से होने वाली प्रत्येक B2B विज्ञापन खरीद पर 15% से 25% तक का बेस कमीशन प्राप्त करें।</p>
                </div>
              </div>
            </div>

            {/* Why Join Us / Core Benefits */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>🌟 Platform Features & Benefits (मुख्य विशेषताएं)</h3>
              <div className={styles.benefitsGrid}>
                {[
                  { title: '🍪 90-Day Cookies', desc: 'यदि कोई ग्राहक आपके लिंक पर क्लिक करके 90 दिनों के भीतर कभी भी विज्ञापन पैकेज खरीदता है, तो कमीशन आपका है।' },
                  { title: '📊 Live Dashboard Tracking', desc: 'क्लिक, लीड, सेल्स, कमीशन और पेंडिंग राशि को रियल-टाइम में सीधे अपने डैशबोर्ड से ट्रैक करें।' },
                  { title: '📈 Retrospective Slab Rates', desc: 'मासिक सेल बढ़ने पर आपका कमीशन 15% से 25% तक अपग्रेड हो जाता है, जो पूरे महीने की कुल सेल पर लागू होता है।' },
                  { title: '🏆 Performance Leaderboard', desc: 'सर्वश्रेष्ठ परफॉर्मर्स को प्रत्येक माह अतिरिक्त नकद बोनस और विशेष रिवार्ड्स प्रदान किए जाते हैं।' },
                  { title: '📁 Marketing Materials', desc: 'प्रचार के लिए प्री-डिजाइन किए गए बैनर्स, पोस्टर्स, वीडियो और पीडीएफ गाइड बिल्कुल फ्री प्राप्त करें।' },
                  { title: '🔒 Bank / UPI Payouts', desc: 'अर्जित बैलेंस को महीने के अंत में संसाधित कर सीधे आपके बैंक खाते या UPI आईडी में सुरक्षित रूप से ट्रांसफर किया जाता है।' }
                ].map((item, idx) => (
                  <div key={idx} className={styles.benefitCard}>
                    <h4 className={styles.benefitTitle}>{item.title}</h4>
                    <p className={styles.benefitText}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Rules Explanation */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>📌 Essential Rules & Transparency (पारदर्शी नियम और नीतियां)</h3>
              <div className={styles.rulesList}>
                <div className={styles.rulesItem}>
                  <strong className={styles.rulesTitle}>• Commission Base Calculation (कमीशन बेस वैल्यू):</strong> 
                  कमीशन की गणना केवल शुद्ध बेस वैल्यू (विज्ञापन पैकेज मूल्य - 18% GST) पर की जाती है। 
                  <div className={styles.rulesExample}>
                    उदाहरण: यदि एक ग्राहक ₹11,800 (₹10,000 बेस + 18% GST) का पैकेज खरीदता है, तो कमीशन की गणना ₹10,000 की बेस वैल्यू पर की जाएगी। 15% दर पर आपका कमीशन ₹1,500 होगा।
                  </div>
                </div>
                <div className={styles.rulesItem}>
                  <strong className={styles.rulesTitle}>• Payout Threshold & Process (भुगतान सीमा और चक्र):</strong> 
                  न्यूनतम भुगतान राशि ₹1500 है। पेंडिंग या अप्रूव्ड राशि ₹1500 से कम होने पर वह अगले महीने में कैरी फॉरवर्ड हो जाएगी। भुगतान प्रति माह 1 से 7 तारीख के बीच आपके बैंक/UPI पर ट्रांसफर किया जाता है।
                </div>
                <div className={styles.rulesItem}>
                  <strong className={styles.rulesTitle}>• Self-Purchasing Policy (स्व-खरीद निषेध):</strong> 
                  खुद के रेफरल लिंक से स्वयं के लिए विज्ञापन पैकेज खरीदना सख्त मना है। सिस्टम द्वारा ईमेल, फोन, आईपी एड्रेस या डिवाइस ट्रैक होने पर कमीशन तुरंत निरस्त (Reverse) कर दिया जाएगा।
                </div>
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>❓ Frequently Asked Questions (अक्सर पूछे जाने वाले प्रश्न)</h3>
              <div className={styles.faqContainer}>
                {[
                  { q: 'क्या इस प्रोग्राम में शामिल होने के लिए कोई फीस है?', a: 'नहीं, द देसी अंदाज का पार्टनर प्रोग्राम पूरी तरह से मुफ्त है। कोई भी व्यक्ति रजिस्टर करके रेफरल कमाना शुरू कर सकता है।' },
                  { q: 'क्या मैं अपने ग्राहकों के लिए कस्टम लिंक बना सकता हूँ?', a: 'हाँ, डैशबोर्ड के अंदर "Custom Page Link Generator" टूल मौजूद है, जहाँ आप वेबसाइट की किसी भी विज्ञापन सेवा का लिंक डालकर उसे रेफरल लिंक में बदल सकते हैं।' },
                  { q: 'अगर ग्राहक विज्ञापन रद्द या रिफंड करता है तो क्या होगा?', a: 'यदि ग्राहक द्वारा खरीदे गए विज्ञापन पैकेज को कैंसिल या रिफंड किया जाता है, तो उस ट्रांजेक्शन पर दिया गया कमीशन निरस्त (Reversed) कर दिया जाएगा और वॉलेट बैलेंस समायोजित किया जाएगा।' },
                  { q: 'खाता सक्रिय (Activate) होने में कितना समय लगता है?', a: 'केवाईसी और बैंक विवरण सबमिट करने के बाद, एडमिन द्वारा 24 से 48 घंटे के भीतर आपके प्रलेखों का सत्यापन कर खाता सक्रिय कर दिया जाता है।' }
                ].map((faq, idx) => (
                  <details key={idx} className={styles.faqDetails}>
                    <summary className={styles.faqSummary}>
                      {faq.q}
                    </summary>
                    <p className={styles.faqText}>
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOGIN MODE */}
        {viewMode === 'login' && (
          <div className={styles.authContainer}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>पार्टनर लॉगिन</h2>
              <p className={styles.formSubtitle}>अपनी लॉगिन जानकारी दर्ज करें</p>
              
              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Email (ईमेल)</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="name@email.com"
                    required
                    className={styles.input}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Password (पासवर्ड)</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className={styles.input}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                >
                  {loading ? 'प्रमाणीकरण हो रहा है...' : 'सुरक्षित लॉगिन'}
                </button>
              </form>

              <div className={styles.formToggleText}>
                <span>नया पार्टनर खाता चाहिए? </span>
                <button
                  onClick={() => { setViewMode('register'); setStep(1); }}
                  className={styles.formToggleBtn}
                >
                  यहाँ रजिस्टर करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER MODE */}
        {viewMode === 'register' && (
          <div className={styles.wizardContainer}>
            <div className={styles.formCard}>
              {/* Stepper Header */}
              <div className={styles.stepper}>
                <div className={styles.stepperLine} />
                <div 
                  className={styles.stepperProgress} 
                  style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />

                {[
                  { num: 1, label: 'व्यक्तिगत जानकारी' },
                  { num: 2, label: 'बैंक व सत्यापन' },
                  { num: 3, label: 'नियम व स्वीकार्यता' }
                ].map((s) => (
                  <div 
                    key={s.num} 
                    className={styles.stepNode}
                    onClick={() => step > s.num && setStep(s.num)}
                  >
                    <div className={`${styles.stepCircle} ${step >= s.num ? styles.stepCircleActive : ''}`}>
                      {s.num}
                    </div>
                    <span className={`${styles.stepLabel} ${step >= s.num ? styles.stepLabelActive : ''}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={step === 3 ? handleRegister : (e) => { e.preventDefault(); setStep(prev => prev + 1); }} className={styles.form}>
                
                {/* STEP 1: PERSONAL DETAILS */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className={styles.sectionHeader}>व्यक्तिगत विवरण (Personal Info)</h3>
                    
                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>पूरा नाम (Full Name) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.fullName}
                          onChange={e => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                          placeholder="राम कुमार"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>जन्म तिथि (DOB) *</label>
                        <input
                          type="date"
                          required
                          value={registerForm.dob}
                          onChange={e => setRegisterForm({ ...registerForm, dob: e.target.value })}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>मोबाइल नंबर (Mobile) *</label>
                        <input
                          type="tel"
                          required
                          value={registerForm.mobile}
                          onChange={e => setRegisterForm({ ...registerForm, mobile: e.target.value })}
                          placeholder="+91-XXXXXXXXXX"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>ईमेल (Email) *</label>
                        <input
                          type="email"
                          required
                          value={registerForm.email}
                          onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                          placeholder="name@email.com"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>पता (Full Address) *</label>
                      <input
                        type="text"
                        required
                        value={registerForm.address}
                        onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="गली/मोहल्ला, मकान नंबर"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.grid3Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>City (शहर) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.city}
                          onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                          placeholder="Pakur"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>State (राज्य) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.state}
                          onChange={e => setRegisterForm({ ...registerForm, state: e.target.value })}
                          placeholder="Jharkhand"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>PIN Code *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.pinCode}
                          onChange={e => setRegisterForm({ ...registerForm, pinCode: e.target.value })}
                          placeholder="816107"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>पासवर्ड (Password) *</label>
                        <input
                          type="password"
                          required
                          value={registerForm.password}
                          onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                          placeholder="••••••••"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>पासवर्ड कन्फर्म करें *</label>
                        <input
                          type="password"
                          required
                          value={registerForm.confirmPassword}
                          onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BANK AND KYC DETAILS */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className={styles.sectionHeader}>बैंक, यूपीआई व सत्यापन (Payment & KYC Details)</h3>
                    
                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>आधार नंबर (Aadhaar Number) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.aadhaarNumber}
                          onChange={e => setRegisterForm({ ...registerForm, aadhaarNumber: e.target.value })}
                          placeholder="XXXX XXXX XXXX"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>पैन नंबर (PAN Number) *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.panNumber}
                          onChange={e => setRegisterForm({ ...registerForm, panNumber: e.target.value })}
                          placeholder="ABCDE1234F"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Bank Account Holder Name *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.bankHolderName}
                          onChange={e => setRegisterForm({ ...registerForm, bankHolderName: e.target.value })}
                          placeholder="Account Holder Name"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Account Number *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.bankAccountNumber}
                          onChange={e => setRegisterForm({ ...registerForm, bankAccountNumber: e.target.value })}
                          placeholder="Bank Account Number"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.grid2Col}>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>IFSC Code *</label>
                        <input
                          type="text"
                          required
                          value={registerForm.ifscCode}
                          onChange={e => setRegisterForm({ ...registerForm, ifscCode: e.target.value })}
                          placeholder="SBIN0001234"
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>UPI ID (वैकल्पिक)</label>
                        <input
                          type="text"
                          value={registerForm.upiId}
                          onChange={e => setRegisterForm({ ...registerForm, upiId: e.target.value })}
                          placeholder="ram@ybl"
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>प्रोफाइल फोटो URL</label>
                      <input
                        type="text"
                        value={registerForm.photoUrl}
                        onChange={e => setRegisterForm({ ...registerForm, photoUrl: e.target.value })}
                        placeholder="https://images.com/my-profile.jpg"
                        className={styles.input}
                      />
                    </div>

                    {/* Verification Area */}
                    <div className={styles.verificationBox}>
                      <div className={styles.verificationRow}>
                        <span className={styles.verificationTitle}>मोबाइल व ईमेल सत्यापन</span>
                        {!otpSent && (
                          <button
                            type="button"
                            onClick={handleSendOtps}
                            className={styles.verifyBtn}
                          >
                            सत्यापन कोड भेजें
                          </button>
                        )}
                      </div>

                      {otpSent && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div className={styles.otpRow}>
                            <input
                              type="text"
                              value={mobileOtp}
                              onChange={e => setMobileOtp(e.target.value)}
                              placeholder="Mobile OTP (123456)"
                              disabled={isMobileVerified}
                              className={styles.input}
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyMobile}
                              disabled={isMobileVerified}
                              className={`${styles.verifyBtn} ${isMobileVerified ? styles.verifyBtnSuccess : ''}`}
                            >
                              {isMobileVerified ? 'Verified ✓' : 'Verify'}
                            </button>
                          </div>

                          <div className={styles.otpRow}>
                            <input
                              type="text"
                              value={emailOtp}
                              onChange={e => setEmailOtp(e.target.value)}
                              placeholder="Email OTP (123456)"
                              disabled={isEmailVerified}
                              className={styles.input}
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyEmail}
                              disabled={isEmailVerified}
                              className={`${styles.verifyBtn} ${isEmailVerified ? styles.verifyBtnSuccess : ''}`}
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
                    <h3 className={styles.sectionHeader}>अंतिम घोषणा एवं शर्तें (Affiliate Agreement)</h3>
                    
                    <div className={styles.agreementText}>
                      <h4 className={styles.agreementHeader}>THE DESI ANDAZ AFFILIATE PARTNER AGREEMENT</h4>
                      <p style={{ marginBottom: '8px' }}><strong>1. Commission Policy (कमीशन नियम):</strong> कमीशन की गणना केवल ग्राहक द्वारा भुगतान की गई राशि में से 18% GST काटने के बाद बचे बेस सर्विस वैल्यू (Base Service value) पर की जाएगी। गेटवे शुल्क या अतिरिक्त सरकारी करों पर कोई कमीशन देय नहीं होगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>2. Refund Policy (रिफंड नियम):</strong> यदि ग्राहक द्वारा खरीदे गए विज्ञापन पैकेज को निरस्त कर दिया जाता है या रिफंड किया जाता है, तो उस सेल पर अर्जित कमीशन तुरंत काट लिया जाएगा और वॉलेट बैलेंस समायोजित किया जाएगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>3. Payout Schedule (भुगतान चक्र):</strong> संचित भुगतान महीने के अंत में संसाधित किए जाएंगे और अगले महीने की 1 से 7 तारीख के बीच bank हस्तांतरण या यूपीआई के माध्यम से जारी किए जाएंगे। न्यूनतम भुगतान सीमा ₹1500 है। यदि अर्जित कमीशन ₹1500 से कम है, तो उसे अगले माह के लिए कैरी फॉरवर्ड कर दिया जाएगा।</p>
                      <p style={{ marginBottom: '8px' }}><strong>4. Anti-Fraud Policy (धोखाधड़ी निषेध):</strong> अपने स्वयं के पार्टनर लिंक का उपयोग करके खरीदारी करना (Self-purchases) सख्त वर्जित है।  संदिग्ध भुगतानों को सिस्टम द्वारा स्वचालित रूप से फ्लैग किया जाएगा और एडमिन द्वारा खाते को बिना किसी पूर्व सूचना के निलंबित किया जा सकता है।</p>
                    </div>

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={registerForm.agreementAccepted}
                        onChange={e => setRegisterForm({ ...registerForm, agreementAccepted: e.target.checked })}
                        className={styles.checkbox}
                      />
                      <span>मैं घोषणा करता हूँ कि मैंने सभी नियमों, कमीशन पॉलिसियों और रिफंड शर्तों को ध्यानपूर्वक पढ़ लिया है और मैं इनसे पूरी तरह सहमत हूँ। *</span>
                    </label>
                  </div>
                )}

                {/* Stepper Actions */}
                <div className={styles.wizardActions}>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(prev => prev - 1)}
                      className={styles.wizardBackBtn}
                    >
                      पीछे जाएं
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.wizardNextBtn}
                  >
                    {loading ? 'संसाधित हो रहा है...' : step === 3 ? 'रजिस्टर करें' : 'आगे बढ़ें'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
