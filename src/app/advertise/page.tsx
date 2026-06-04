'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trackReferralSale } from '@/actions/affiliate';

export default function AdvertisePage() {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'account' | 'details' | 'slides' | 'packages' | 'payment' | 'success'>('welcome');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<'week' | 'month' | '2month' | '3month' | '6month' | '12month'>('2month');
  
  // Auth & Details state
  const [accountForm, setAccountForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [detailsForm, setDetailsForm] = useState({ businessName: '', industry: 'Retail', targetCity: 'Pakur', description: '' });
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [showLiveIframe, setShowLiveIframe] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState({ number: '4532 •••• •••• 8824', name: 'Sonu Kumar Saha', expiry: '12/28', cvv: '•••' });

  // Handle Account Signup
  const handleAccountSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.email || !accountForm.phone) {
      alert('Please fill out all signup fields!');
      return;
    }
    setDetailsForm(prev => ({ ...prev, businessName: `${accountForm.name}'s Brand` }));
    setCurrentStep('packages');
  };

  // Handle Account Login
  const handleAccountLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      alert('Please enter your login details!');
      return;
    }
    setAccountForm({
      name: 'Sonu Kumar Saha',
      email: loginForm.email,
      phone: '+91-8409659560',
      password: 'saved'
    });
    setCurrentStep('packages');
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsForm.businessName || !detailsForm.targetCity) {
      alert('Please fill out business details!');
      return;
    }
    setCurrentStep('slides');
  };

  const handleSelectPackage = (pkg: any) => {
    const activeDur = Object.keys(pkg.pricing).find(key => pkg.pricing[key].base > 0) || '2month';
    setSelectedPackage(pkg);
    setSelectedDuration(activeDur as any);
    setShowLiveIframe(false);
    setCurrentStep('payment');
  };

  const saveNewClientToAdminDatabase = () => {
    try {
      const saved = localStorage.getItem('tda_advertiser_clients');
      let clientsList = [];
      if (saved) {
        clientsList = JSON.parse(saved);
      }
      
      const newClientId = String(clientsList.length + 100);
      const startStr = '2026-05-25'; // Today's date
      
      // Calculate end date based on duration
      const start = new Date(startStr);
      if (selectedDuration === 'week') {
        start.setDate(start.getDate() + 7);
      } else if (selectedDuration === 'month') {
        start.setMonth(start.getMonth() + 1);
      } else if (selectedDuration === '2month') {
        start.setMonth(start.getMonth() + 2);
      } else if (selectedDuration === '3month') {
        start.setMonth(start.getMonth() + 3);
      } else if (selectedDuration === '6month') {
        start.setMonth(start.getMonth() + 6);
      } else if (selectedDuration === '12month') {
        start.setFullYear(start.getFullYear() + 1);
      }
      const endStr = start.toISOString().split('T')[0];

      // Safe fallback calculations
      const planTotal = selectedPackage?.activePlan?.total || selectedPackage?.pricing?.[selectedDuration]?.total || 0;

      const newClient = {
        id: newClientId,
        name: accountForm.name || 'B2B Representative',
        businessName: detailsForm.businessName || `${accountForm.name || 'B2B Representative'}'s Brand`,
        email: accountForm.email || 'partner@thedesiandaz.com',
        phone: accountForm.phone || '+91-8409659560',
        packageId: selectedPackage?.id || 'local_startup',
        duration: selectedDuration,
        targetCity: detailsForm.targetCity || 'Pakur',
        paidAmount: planTotal,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_LIVE_' + Math.floor(10000000 + Math.random() * 90000000),
        campaignStatus: 'Active',
        startDate: startStr,
        endDate: endStr,
        tickerText: `💥 Special Launch! Check out our premium offers - ${detailsForm.businessName || `${accountForm.name || 'Our'}'s Brand`}!`,
        bannerText: `${detailsForm.businessName || `${accountForm.name || 'Our'}'s Brand`}: Premium Local Partner`
      };

      clientsList.push(newClient);
      localStorage.setItem('tda_advertiser_clients', JSON.stringify(clientsList));
    } catch (err) {
      console.error('Failed to save B2B client details to database', err);
    }
  };

  const triggerRazorpayPayment = () => {
    // Persist new B2B client details to admin database on sign-up / payment completion!
    saveNewClientToAdminDatabase();

    // Check for affiliate cookie to track referral sale
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };

      const refCode = getCookie('tda_ref');
      const refSource = getCookie('tda_ref_source') || 'Direct';

      if (refCode) {
        const planTotal = selectedPackage?.activePlan?.total || selectedPackage?.pricing?.[selectedDuration]?.total || 0;
        trackReferralSale(refCode, {
          customerName: accountForm.name || 'B2B Client',
          customerEmail: accountForm.email || 'client@thedesiandaz.com',
          customerPhone: accountForm.phone || '',
          packageName: selectedPackage?.name || 'Local Start-Up Combo',
          totalPaid: planTotal,
          transactionId: 'pay_RPY_LIVE_' + Math.floor(10000000 + Math.random() * 90000000),
          referralSource: refSource
        }).then(res => {
          if (res.success) {
            console.log('Affiliate referral sale tracked successfully.');
          } else {
            console.warn('Affiliate tracking returned: ', res.message);
          }
        });
      }
    } catch (err) {
      console.error('Error tracking affiliate sale during payment simulation:', err);
    }

    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        setCurrentStep('success');
      }, 1200);
    }, 2400);
  };

  const packages = [
    {
      id: 'launch_2month',
      name: '2 Months Complete Visibility (Launch Offer)',
      badge: 'LIMITED TIME OFFER!',
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
      },
      paymentLinks: {
        week: '',
        month: '',
        '2month': 'https://rzp.io/rzp/QTLq1Kev',
        '3month': '',
        '6month': '',
        '12month': ''
      },
      color: '#CC2200',
      glow: 'rgba(204, 34, 0, 0.15)'
    },
    {
      id: 'launch_6month',
      name: '6 Months Complete Visibility (Launch Offer)',
      badge: 'LIMITED SLOTS AVAILABLE!',
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
      },
      paymentLinks: {
        week: '',
        month: '',
        '2month': '',
        '3month': '',
        '6month': 'https://rzp.io/rzp/SVWX8m6R',
        '12month': ''
      },
      color: '#FF6B00',
      glow: 'rgba(255, 107, 0, 0.15)'
    }
  ];

  const slides = [
    {
      slideNum: 1,
      title: 'The Desi Andaz Media Network',
      subtitle: "Santhal Pargana's First Ever Media House — Smart Advertising Solutions to Grow Your Local Business",
      type: 'cover',
      trustFactor: '🏆 झारखण्ड संथाल परगना का पहला मीडिया हाउस',
      highlights: [
        'First Registered & Most Trusted Regional News House',
        'Direct connection to 5,00,000+ local citizens in Jharkhand',
        'Integrated Print + Web + YouTube Video + Social Media Network'
      ],
      mockupType: 'logo_glow',
      visualSuggestion: 'A professional slide showcasing The Desi Andaz Media Network with an official golden verification badge celebrating Santhal Pargana\'s First Ever Media House.',
      presenterTip: 'Remind the client that as the first registered media house here, our trust factor is our highest asset.'
    },
    {
      slideNum: 2,
      title: 'Trust the Pioneers: Why Advertise With Us?',
      subtitle: 'Partner with the #1 regional news platform to capture maximum local attention.',
      type: 'hook',
      bullets: [
        '🎖️ Unparalleled Local Trust: Being Santhal Pargana’s first media house, our audience treats our partner advertisers with immense respect.',
        '🛑 No Budget Wastage: Traditional agencies show your city shop\'s ad to people 200 km away. We target only customers in your geographical radius.',
        '⚡ Hassle-Free Traffic: You don\'t need to shoot custom video reels or manage ads. Simply place your brand on our running daily news streams!'
      ],
      solution: 'Our Pioneer Power Solution: We run the high-traffic channels. You simply place your brand logos, banners, L-shape ads, and scrolling tickers on our own daily news bulletins, physical newspaper, and high-traffic portal.',
      mockupType: 'comparison',
      visualSuggestion: 'A high-contrast grid comparing: Left: "Traditional Media" showing wasted spend on distant regions. Right: "TDA Local Targeting" showing highly concentrated local clicks surrounding the client\'s shop.',
      presenterTip: 'Ask the client how much money they have wasted in general newspaper or Facebook ads with zero local filters.'
    },
    {
      slideNum: 3,
      title: 'Our Smart Feature: Hyper-Local Targeting',
      subtitle: 'The game changer! We display your ads strictly to the audience in your specific city or location.',
      type: 'feature',
      salesLine: '"Don\'t pay to show your ad to the whole world. Pay only for the customers who can actually walk into your shop!"',
      sections: [
        {
          label: '💻 Web Portal dynamic filters',
          desc: 'Your banner ad will dynamically show up strictly for users browsing from your specific city, district, or nearby PIN codes.'
        },
        {
          label: '📺 YouTube Screen & Social Media',
          desc: 'Using advanced digital filters on our high-traffic channels, we ensure our news viewers in your exact location (like Pakur) see your L-shape ads, tickers, and logo overlays.'
        }
      ],
      mockupType: 'geofence',
      visualSuggestion: 'A dynamic radar-map targeting system locking strictly onto the client\'s home district (e.g. Pakur), showing advertisements delivered selectively within the geofenced circle.',
      presenterTip: 'This is the most powerful selling point. Emphasize that their advertisement budget is 100% focused on local buyers.'
    },
    {
      slideNum: 4,
      title: 'Visual Guide: How Your Ad Will Look on Our Platforms',
      subtitle: 'Premium placements designed to catch eyeballs without disturbing the news experience.',
      type: 'visual_explanation',
      grid: [
        { title: '📰 Physical Newspaper', desc: 'Elegant, high-contrast display ads placed inside our physical newspaper editions.' },
        { title: '💻 Website Banners', desc: 'Fixed or responsive display banners running 24/7 on our high-traffic home and article pages.' },
        { title: '📺 YouTube Screen Bulletins', desc: 'Premium L-Shape graphical frames wrapped on the sides of our active news feeds + continuous scrolling tickers at the bottom.' },
        { title: '📱 Social Media (FB & Instagram)', desc: 'Beautiful product image posts + sponsor logo pinned watermarks on our viral daily news reels.' }
      ],
      mockupType: 'overlays',
      visualSuggestion: 'A mockup of a smartphone running a Facebook reel with a permanent "Powered By" logo watermark, and a desktop showing a YouTube news video with L-shape banners and a scrolling bottom ticker.',
      presenterTip: 'Reiterate that we don\'t ask them to shoot custom reels. We put their brand overlays directly on our highly viral, already running news videos!'
    },
    {
      slideNum: 5,
      title: 'Package 1 - "Local Start-Up Combo"',
      subtitle: 'Best for local trial, small shops, institutes, and budget awareness.',
      type: 'package',
      specs: [
        '📰 Print: 1 Small Display Ad per week (Size: 4x5 cm) inside the Newspaper.',
        '💻 Website: 1 Fixed Sidebar Banner Ad on category pages (Visible 24/7 with Local Filters).',
        '📱 Social Media: 2 Premium Static Image Posts per week on Facebook & Instagram.',
        '📺 YouTube Screen Bulletins: 1 Scrolling Text Ticker running below the breaking news bar on our videos for 15 Days/Month.'
      ],
      prices: [
        { label: '1 Week Trial', val: '₹5,000 + ₹900 GST = ₹5,900' },
        { label: '1 Month Base', val: '₹10,000 + ₹1,800 GST = ₹11,800' },
        { label: '3 Months Plan', val: '₹26,000 + ₹4,680 GST = ₹30,680' },
        { label: '6 Months Plan', val: '₹48,000 + ₹8,640 GST = ₹56,640' },
        { label: '12 Months Plan', val: '₹85,000 + ₹15,300 GST = ₹1,00,300' }
      ],
      mockupType: 'startup_visual',
      visualSuggestion: 'A tablet layout highlighting category pages with the client\'s sidebar banner boxed in a clean green neon outline indicating active local filters.',
      presenterTip: 'Recommend the 1-Month plan as the absolute minimum trial.'
    },
    {
      slideNum: 6,
      title: 'Package 2 - "Market Leader Combo"',
      subtitle: 'Consistent Daily Branding for Mid-Level Showrooms, Private Hospitals, and Regional Brands.',
      type: 'package',
      specs: [
        '📰 Print: 1 Medium Display Ad per week (Total 4 Ads/Month, Size: 8x5 cm) in Paper.',
        '💻 Website: 1 Premium Sidebar Banner Ad fixed directly on the main Homepage (24/7 Slot).',
        '📱 Social Media: 2 Static Image Posts per week + Your Brand Logo watermarked on 5 Main Viral Reels of the month.',
        '📺 YouTube Screen Bulletins: 1 L-Shape Graphical Banner Ad on news videos for 15 Days/Month + 1 Daily Scrolling Ticker (30 Days).'
      ],
      prices: [
        { label: '1 Week Trial', val: '₹9,000 + ₹1,620 GST = ₹10,620' },
        { label: '1 Month Base', val: '₹20,000 + ₹3,600 GST = ₹23,600' },
        { label: '3 Months Plan', val: '₹52,000 + ₹9,360 GST = ₹61,360' },
        { label: '6 Months Plan', val: '₹95,000 + ₹17,100 GST = ₹1,12,100' },
        { label: '12 Months Plan', val: '₹1,70,000 + ₹30,600 GST = ₹2,00,600' }
      ],
      mockupType: 'leader_visual',
      visualSuggestion: 'A mockup displaying a premium banner fixed on the high-traffic homepage combined with a continuous scrolling bottom ticker on YouTube news feeds.',
      presenterTip: 'Point out that the L-shape video frames combined with home banners establish the business as a prominent leader.'
    },
    {
      slideNum: 7,
      title: 'Package 3 - "Dhamaka Visibility Combo"',
      subtitle: 'Our Most Recommended Plan! Complete local dominance and maximum eyes in the city.',
      type: 'package',
      specs: [
        '📰 Print: 1 Large Display Ad per week (Total 4 Ads/Month) + 1 Dedicated Event/Photo Feature page in our Newspaper.',
        '💻 Website: 1 Mega Top Header Banner Ad (The highest-viewed billboard slot on the entire website).',
        '📱 Social Media: 3 Static Image Posts per week (Total 12 posts/month) + Permanent "Powered By: [Your Logo]" on ALL reels published.',
        '📺 YouTube Screen Bulletins: 1 Permanent Daily L-Shape Graphical Banner + 1 Continuous Daily Scrolling Ticker on 100% of our updates.'
      ],
      prices: [
        { label: '1 Week Trial', val: '₹16,000 + ₹2,880 GST = ₹18,880' },
        { label: '1 Month Base', val: '₹35,000 + ₹6,300 GST = ₹41,300' },
        { label: '3 Months Plan', val: '₹90,000 + ₹16,200 GST = ₹1,06,200' },
        { label: '6 Months Plan', val: '₹1,65,000 + ₹29,700 GST = ₹1,94,700' },
        { label: '12 Months Plan', val: '₹3,00,000 + ₹54,000 GST = ₹3,54,000' }
      ],
      mockupType: 'dhamaka_visual',
      visualSuggestion: 'A visual overview of the absolute dominance plan: mega top header banner, permanent L-shape and ticker on all YouTube news feeds, and logo pinned on all viral reels.',
      presenterTip: 'This is our most recommended combo. Pitch it to clients who want absolute dominance.'
    },
    {
      slideNum: 8,
      title: 'Package 4 - "Festival & Special Season Combo"',
      subtitle: 'Short-Term Sales Boost during Durga Puja, Diwali, New Year, or Wedding Seasons.',
      type: 'package',
      specs: [
        '📰 Print: 1 Large Premium Color Ad on our Dedicated Special Festival Page.',
        '💻 Website: 1 Full Website Skin / Watermark Background Ad Takeover (Your brand wraps around our entire website layout!).',
        '📱 Social Media: Your Logo integrated onto 10 Special Festival Greeting Posts & 5 Seasonal Greeting Reels.',
        '📺 YouTube Screen Bulletins: 1 Featured L-Shape Banner Ad + 1 Scrolling Ticker on all Festival Special Video updates.'
      ],
      prices: [
        { label: '1 Week Peak', val: '₹12,000 + ₹2,160 GST = ₹14,160' },
        { label: '1 Month Festive', val: '₹25,000 + ₹4,500 GST = ₹29,500' },
        { label: '3 Months Plan', val: '₹65,000 + ₹11,700 GST = ₹76,700' }
      ],
      mockupType: 'festival_visual',
      visualSuggestion: 'An illustration showing a gorgeous website background takeover with festive overlays.',
      presenterTip: 'Seasonal slots are extremely scarce due to high demand.'
    },
    {
      slideNum: 9,
      title: 'Package 5 - "Kingmaker Corporate Combo"',
      subtitle: 'The Ultimate Partnership for elite builders, universities, or corporate brands wanting complete takeover.',
      type: 'package',
      specs: [
        '📰 Print: 1 Weekly Half-Page Premium Color Ad in the Newspaper Main Edition (Total 4 Half-Pages/Month).',
        '💻 Website: 1 Mega Homepage Banner + Fixed Banner Ads on 100% of Inside Article Pages (Full site takeover).',
        '📱 Social Media: 5 Static Image Posts per week (Total 20 posts/month) + Your Logo pinned as "Main Sponsor" on Cover Banners + Logo on all Reels.',
        '📺 YouTube Screen Bulletins: Permanent Daily L-Shape Banner & Ticker on ALL news updates + Logo on YouTube Cover Art + 1 Exclusive Talk-Show Interview.'
      ],
      prices: [
        { label: '1 Week Trial', val: '₹28,000 + ₹5,040 GST = ₹33,040' },
        { label: '1 Month Deal', val: '₹65,000 + ₹11,700 GST = ₹76,700' },
        { label: '3 Months Plan', val: '₹1,75,000 + ₹31,500 GST = ₹2,06,500' },
        { label: '6 Months Plan', val: '₹3,20,000 + ₹57,600 GST = ₹3,77,600' },
        { label: '12 Months Plan', val: '₹5,80,000 + ₹1,04,400 GST = ₹6,84,400' }
      ],
      mockupType: 'kingmaker_visual',
      visualSuggestion: 'A multi-screen layout showing: half-page print color layout, total website takeover, YouTube news branding cover art, and a studio executive interview scene.',
      presenterTip: 'This is our flagship deal. Emphasize that it includes a dedicated 10-15 min executive talk-show studio interview.'
    },
    {
      slideNum: 10,
      title: 'How We Work Together (Smooth Onboarding Terms)',
      subtitle: 'Simple process, WhatsApp-based creative approvals, and flexible partner terms.',
      type: 'process',
      steps: [
        { num: '1', title: 'Share Details', desc: 'You send us your brand logo, active offers, and images over WhatsApp.' },
        { num: '2', title: 'Studio Design', desc: 'Our in-house design team creates stunning, custom banners and tickers.' },
        { num: '3', title: 'WhatsApp Review', desc: 'We send completed mockups to your phone. You review and approve with zero stress.' },
        { num: '4', title: 'Launch Live!', desc: 'Your targeted local campaign is published immediately on Newspaper, Web, and YouTube.' }
      ],
      rules: [
        '💳 Payment Terms: 100% advance for 1 Week and 1 Month plans. For 3M/6M/12M contracts, pay 50% advance and clear the rest with monthly post-dated cheques (PDCs).',
        '🔄 Monthly Refresh: Update your retail offers, text, or graphics once every month for free to keep ads engaging.'
      ],
      mockupType: 'process_visual',
      visualSuggestion: 'A sleek flowchart outlining the 4-step WhatsApp creative validation process.',
      presenterTip: 'Reassure the client that they do not need any tech skills or graphics designers.'
    },
    {
      slideNum: 11,
      title: 'Contact Us & Lock Your Smart Slot Today!',
      subtitle: 'Secure your market dominance with Santhal Pargana’s first and most trusted media house.',
      type: 'contact',
      closing: 'Premium geofenced slots are limited due to layout grid limits. Secure your city spot today before competitors lock you out!',
      contacts: [
        { label: 'Owner & Managing Director', val: 'Sonu Kumar Saha' },
        { label: 'Official Hotlines (Call/WhatsApp)', val: '+91-6203868383, +91-8409659560' },
        { label: 'Official Partner Email', val: 'ads@thedesiandaz.com' },
        { label: 'Media HQ & Press Address', val: 'The Desi Andaz Media Network, Near Everett Mission School, D. S. M Hospital, Dhanushpuja, Pakur, Jharkhand 816107' }
      ],
      mockupType: 'business_card',
      visualSuggestion: 'A premium corporate gold business card displaying Sonu Kumar Saha\'s direct contacts, TDA stamps, and verified partner badges.',
      presenterTip: 'Finish by offering to check the geofence availability in their industry category (e.g. jewelry, hospital) for their city right now.'
    }
  ];

  const currentSlide = slides[slideIndex];

  return (
    <div style={{ background: '#05070e', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      
      {/* Dynamic Keyframe Animations Scoped inside Style Tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatGlow {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-25px) scale(1.15); opacity: 0.55; }
          100% { transform: translateY(0px) scale(1); opacity: 0.3; }
        }
        @keyframes radarRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radarPing {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes goldShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes activePulse {
          0% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.25); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.6); }
          100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.25); }
        }
        @keyframes borderGlow {
          0% { border-color: rgba(239, 68, 68, 0.2); }
          50% { border-color: rgba(239, 68, 68, 0.65); }
          100% { border-color: rgba(239, 68, 68, 0.2); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .float-sphere {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(100px);
        }
        .glow-indigo {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
          width: 55vw;
          height: 55vw;
          top: -15%;
          left: -15%;
          animation: floatGlow 8s ease-in-out infinite;
        }
        .glow-crimson {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.09) 0%, transparent 70%);
          width: 55vw;
          height: 55vw;
          bottom: -15%;
          right: -15%;
          animation: floatGlow 10s ease-in-out infinite alternate;
        }
        .glass-card {
          background: rgba(13, 18, 36, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
        }
        .text-gradient {
          background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-gradient {
          background: linear-gradient(135deg, #ef4444 0%, #d92727 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.45);
        }
        .input-carbon {
          background: rgba(8, 12, 26, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #ffffff;
          font-size: 14px;
          padding: 14px;
          outline: none;
          transition: all 0.25s ease;
        }
        .input-carbon:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
          background: rgba(13, 18, 36, 0.95);
        }
        .packages-responsive-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }
        @media (max-width: 1200px) {
          .packages-responsive-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 800px) {
          .packages-responsive-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 580px) {
          .packages-responsive-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* Import Breathtaking Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Floating Animated Backdrop Glow Spheres */}
      <div className="float-sphere glow-indigo" />
      <div className="float-sphere glow-crimson" />

      {/* Top Floating Glass Stepper Navigation */}
      <div style={{ 
        background: 'rgba(5, 7, 14, 0.85)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
        padding: '16px 24px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
              color: '#05070e', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontWeight: 900, 
              fontSize: '10px',
              letterSpacing: '1.2px',
              textTransform: 'uppercase'
            }}>
              PIONEER PARTNER
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
              The Desi Andaz <span style={{ color: '#ef4444' }}>Media Network</span>
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a 
              href="/pricing"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/pricing';
              }}
              style={{ 
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              🏷️ Pricing
            </a>
            <button 
              onClick={() => {
                setAuthMode('login');
                setCurrentStep('account');
              }}
              style={{ 
                background: currentStep !== 'welcome' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: currentStep !== 'welcome' ? '#fff' : '#94a3b8',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🔑 Partner Access (Sign In / Sign Up)
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        
        {/* ==================== STEP 1: DETAILED B2B LANDING PAGE ==================== */}
        {currentStep === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            
            {/* Elegant Hero Banner with verified dynamic highlights */}
            <div className="glass-card" style={{ 
              padding: '64px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              animation: 'borderGlow 6s ease-in-out infinite'
            }}>
              {/* Trust highlighting badge */}
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)', 
                color: '#f59e0b', 
                padding: '10px 24px', 
                borderRadius: '30px', 
                fontSize: '12.5px', 
                fontWeight: 800, 
                border: '1px solid rgba(245, 158, 11, 0.35)', 
                marginBottom: '28px',
                letterSpacing: '0.2px',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.05)'
              }}>
                👑 झारखंड संथाल परगना का पहला मीडिया हाउस (RNI NO: JHBIL/26/A3245)
              </div>
              
              <h2 className="text-gradient" style={{ fontSize: '46px', fontWeight: 900, marginBottom: '20px', lineHeight: '1.15', letterSpacing: '-1.5px' }}>
                Double Your Local Store Sales With <br />
                <span style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 950 }}>
                  Smart Geotargeted Advertising
                </span>
              </h2>
              
              <p style={{ fontSize: '16.5px', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
                Do not waste your marketing budget on distant regions. Place your brand directly on our high-traffic regional portals, physical newspaper, and viral YouTube video news bulletins geofenced strictly to local buyers!
              </p>

              {/* Action Triggers */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    setAuthMode('signup');
                    setCurrentStep('account');
                  }}
                  className="btn-gradient"
                  style={{ 
                    color: '#fff',
                    padding: '16px 36px',
                    borderRadius: '30px',
                    fontSize: '15px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Create Partner Account
                </button>

                <button 
                  onClick={() => {
                    setLoginForm({ email: 'ads@thedesiandaz.com', password: 'demo' });
                    setAuthMode('login');
                    setCurrentStep('account');
                  }}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: '#fff',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    padding: '16px 36px',
                    borderRadius: '30px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  🔑 Advertiser Partner Login
                </button>
              </div>
            </div>

            {/* Core Geofence Features (3 column layout grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {[
                { 
                  title: '🎯 Exact Location targeting', 
                  desc: 'Select your target city (e.g. Pakur, Dumka, Sahibganj) in our form. Our algorithm ensures readers from outside this radius do not see your campaigns.', 
                  icon: 'fa-map-marked-alt',
                  color: '#6366f1'
                },
                { 
                  title: '📺 YouTube Screen Overlays', 
                  desc: 'No complex video shooting needed. We embed L-shape frames, scrolling bottom tickers, and permanent sponsor logos directly on our daily viral news bulletins.', 
                  icon: 'fa-play-circle',
                  color: '#ef4444'
                },
                { 
                  title: '📰 Newspaper Display', 
                  desc: 'Perfect print media integration. Run sleek color columns inside our high-circulation regional offline prints alongside digital web banners.', 
                  icon: 'fa-newspaper',
                  color: '#f59e0b'
                }
              ].map((item, idx) => (
                <div key={idx} className="glass-card" style={{ 
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ width: '44px', height: '44px', background: `${item.color}15`, color: item.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <i className={`fas ${item.icon}`} />
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '18px', margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>



            {/* Package Combos Grid Showcase */}
            <div>
              <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', marginBottom: '24px', textAlign: 'center', letterSpacing: '-0.5px' }}>
                Select Dynamic Combos & Packages
              </h3>
              <div className="packages-responsive-grid">
                {packages.map(pkg => {
                  const activeDur = Object.keys(pkg.pricing).find(k => (pkg.pricing as any)[k].base > 0) || '2month';
                  const plan = (pkg.pricing as any)[activeDur];
                  const durationLabel = activeDur === 'week' ? 'Weekly' :
                                        activeDur === 'month' ? 'Monthly' :
                                        activeDur === '2month' ? '2 Months' :
                                        activeDur === '3month' ? '3 Months' :
                                        activeDur === '6month' ? '6 Months' :
                                        activeDur === '12month' ? '12 Months' : activeDur;
                  return (
                    <div 
                      key={pkg.id} 
                      className="glass-card"
                      style={{ 
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: `1px solid ${pkg.color}35`,
                        boxShadow: `0 8px 30px ${pkg.glow}`,
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                    >
                      <div>
                        <span style={{ background: `${pkg.color}15`, color: pkg.color, border: `1px solid ${pkg.color}35`, padding: '4px 12px', borderRadius: '20px', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                          {pkg.badge}
                        </span>
                        <h4 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', marginTop: '16px', marginBottom: '8px' }}>{pkg.name}</h4>
                        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: '1.45' }}>{pkg.description}</p>
                      </div>
                      <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Starting Plan ({durationLabel}):</div>
                          <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', margin: '4px 0' }}>
                            ₹{plan.total.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Includes Base + 18% GST</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setSelectedDuration(activeDur as any);
                            setAuthMode('signup');
                            setCurrentStep('account');
                          }}
                          style={{
                            width: '100%',
                            background: pkg.color,
                            color: '#fff',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: `0 4px 12px ${pkg.glow}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 20px ${pkg.color}60`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${pkg.glow}`;
                          }}
                        >
                          Choose Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>



          </div>
        )}

        {/* ==================== STEP 2: INTEGRATED PARTNER ACCESS (LOGIN & SIGNUP) ==================== */}
        {currentStep === 'account' && (
          <div className="glass-card" style={{ 
            padding: '48px 40px',
            maxWidth: '520px',
            margin: '0 auto',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            {/* Elegant Form Toggle Capsules */}
            <div style={{ display: 'flex', background: 'rgba(8, 12, 26, 0.85)', padding: '4px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '32px', width: 'fit-content', margin: '0 auto 32px auto' }}>
              <button 
                type="button"
                onClick={() => setAuthMode('login')}
                style={{ 
                  background: authMode === 'login' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'none',
                  color: authMode === 'login' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '25px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => setAuthMode('signup')}
                style={{ 
                  background: authMode === 'signup' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'none',
                  color: authMode === 'signup' ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: '25px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
              >
                Sign Up
              </button>
            </div>

            {authMode === 'signup' ? (
              <>
                <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.5px' }}>
                  Create Partner Profile
                </h3>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '32px', textAlign: 'center', lineHeight: '1.4' }}>
                  Set up your secure Advertiser account to customize geofencing parameters and access Razorpay billing panels.
                </p>
                
                <form onSubmit={handleAccountSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Full Name / Representative Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sonu Kumar Saha"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Official Business Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. partner@thedesiandaz.com"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Phone Number (WhatsApp Active)</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="e.g. +91 8409659560"
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Set Secure Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="btn-gradient"
                    style={{ 
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      marginTop: '12px'
                    }}
                  >
                    Register as B2B Partner
                  </button>
                </form>

                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13.5px', color: '#94a3b8' }}>Already verified B2B partner? </span>
                  <button 
                    onClick={() => setAuthMode('login')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '13.5px' }}
                  >
                    Go to Login
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '8px', textAlign: 'center', letterSpacing: '-0.5px' }}>
                  Partner Sign In
                </h3>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '32px', textAlign: 'center', lineHeight: '1.4' }}>
                  Access your Advertiser dashboard, geofence configurations, and simulate payments.
                </p>
                
                <form onSubmit={handleAccountLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Registered Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="partner@thedesiandaz.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Secure Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="input-carbon"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="btn-gradient"
                    style={{ 
                      color: '#fff',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      marginTop: '12px'
                    }}
                  >
                    Sign In as Partner
                  </button>
                </form>

                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '13.5px', color: '#94a3b8' }}>New regional partner? </span>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: '13.5px' }}
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}
          </div>
        )}



        {/* ==================== STEP 4: INTERACTIVE WIDESCREEN SLIDE DECK ==================== */}
        {currentStep === 'slides' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Advertiser Pitch Deck</h3>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>Understand how we target regional buyers and display advertisements.</p>
              </div>
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#ef4444',
                padding: '8px 20px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 800,
                letterSpacing: '0.5px'
              }}>
                SLIDE {slideIndex + 1} OF {slides.length}
              </div>
            </div>

            {/* Premium widescreen pitch deck canvas */}
            <div className="glass-card" style={{ 
              border: '2px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 45px rgba(239, 68, 68, 0.12)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr',
              minHeight: '580px'
            }}>
              
              {/* Left Column: presentation info */}
              <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {currentSlide.trustFactor && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '6px 18px', borderRadius: '30px', fontSize: '11px', fontWeight: 800, marginBottom: '20px', letterSpacing: '0.5px' }}>
                    {currentSlide.trustFactor}
                  </div>
                )}

                <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginBottom: '14px', lineHeight: '1.2', letterSpacing: '-0.5px' }}>
                  {currentSlide.title}
                </h2>
                
                <p style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500', marginBottom: '32px', lineHeight: '1.5' }}>
                  {currentSlide.subtitle}
                </p>

                {/* SLIDE TYPE: COVER */}
                {currentSlide.type === 'cover' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {currentSlide.highlights?.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14.5px', color: '#f1f5f9' }}>
                        <span style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* SLIDE TYPE: HOOK */}
                {currentSlide.type === 'hook' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentSlide.bullets?.map((b, i) => (
                        <div key={i} style={{ background: 'rgba(8, 12, 26, 0.45)', padding: '14px 18px', borderRadius: '10px', fontSize: '13px', borderLeft: '4px solid #ef4444', lineHeight: '1.4', color: '#cbd5e1' }}>
                          {b}
                        </div>
                      ))}
                    </div>
                    {currentSlide.solution && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px 20px', borderRadius: '12px', fontSize: '13.5px', color: '#10b981', fontWeight: 700, lineHeight: '1.4' }}>
                        💡 {currentSlide.solution}
                      </div>
                    )}
                  </div>
                )}

                {/* SLIDE TYPE: FEATURE */}
                {currentSlide.type === 'feature' && (
                  <div>
                    {currentSlide.salesLine && (
                      <div style={{ fontStyle: 'italic', fontSize: '16px', color: '#f59e0b', fontWeight: 800, background: 'rgba(245, 158, 11, 0.03)', padding: '16px 24px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', marginBottom: '28px', lineHeight: '1.4', textAlign: 'center' }}>
                        {currentSlide.salesLine}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {currentSlide.sections?.map((sec, i) => (
                        <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '18px', borderRadius: '12px' }}>
                          <h5 style={{ fontWeight: 800, fontSize: '14.5px', color: '#fff', marginBottom: '8px' }}>{sec.label}</h5>
                          <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: '1.45' }}>{sec.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SLIDE TYPE: VISUAL EXPLANATION */}
                {currentSlide.type === 'visual_explanation' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {currentSlide.grid?.map((g, i) => (
                      <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '12px' }}>
                        <h5 style={{ fontWeight: 800, fontSize: '13.5px', color: '#ef4444', marginBottom: '6px' }}>{g.title}</h5>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>{g.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SLIDE TYPE: PACKAGE */}
                {currentSlide.type === 'package' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '18px', borderRadius: '12px' }}>
                      <h5 style={{ fontWeight: 800, fontSize: '12.5px', color: '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Campaign Deliverables</h5>
                      <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '12.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.45' }}>
                        {currentSlide.specs?.map((spec, i) => (
                          <li key={i}>{spec}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div style={{ background: 'rgba(8, 12, 26, 0.45)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '18px', borderRadius: '12px' }}>
                      <h5 style={{ fontWeight: 800, fontSize: '12.5px', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Pricing Plans (Base + 18% GST = Total)</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        {currentSlide.prices?.map((pr, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px dashed rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{pr.label}:</span>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{pr.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE TYPE: PROCESS */}
                {currentSlide.type === 'process' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {currentSlide.steps?.map((st, i) => (
                        <div key={i} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '16px 10px', borderRadius: '12px', textAlign: 'center', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '22px', background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239,68,68,0.25)' }}>
                            {st.num}
                          </div>
                          <h6 style={{ fontWeight: 800, fontSize: '13px', color: '#fff', marginTop: '6px', marginBottom: '4px' }}>{st.title}</h6>
                          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, lineHeight: '1.25' }}>{st.desc}</p>
                        </div>
                      ))}
                    </div>
                    {currentSlide.rules && (
                      <div style={{ background: 'rgba(8, 12, 26, 0.45)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '14px 18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                        {currentSlide.rules.map((rule, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ color: '#ef4444' }}>•</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SLIDE TYPE: CONTACT */}
                {currentSlide.type === 'contact' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentSlide.contacts?.map((c, i) => (
                        <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{c.label}</div>
                          <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: 800, marginTop: '2px' }}>{c.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(8, 12, 26, 0.45)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '20px', borderRadius: '14px' }}>
                      <span style={{ fontSize: '32px', marginBottom: '10px' }}>🤝</span>
                      <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: 0, lineHeight: '1.45', fontWeight: 600 }}>
                        {currentSlide.closing}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: High-fidelity CSS Mockups screen */}
              <div style={{ background: 'rgba(8, 12, 26, 0.85)', padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <div style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', textAlign: 'center' }}>
                    🖥️ Live Preview Screen
                  </div>
                  
                  {/* MOCKUP: logo_glow */}
                  {currentSlide.mockupType === 'logo_glow' && (
                    <div style={{ 
                      background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(15,23,42,0.9) 80%)', 
                      borderRadius: '20px', 
                      padding: '36px 20px', 
                      border: '1.5px dashed rgba(239, 68, 68, 0.25)', 
                      textAlign: 'center'
                    }}>
                      <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: '0 auto 16px auto', boxShadow: '0 0 20px rgba(239,68,68,0.4)', animation: 'spin 12s linear infinite' }}>
                        TDA
                      </div>
                      <h5 style={{ fontWeight: 800, color: '#fff', fontSize: '15px', margin: '0 0 2px 0' }}>The Desi Andaz</h5>
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1ST MEDIA HOUSE</span>
                    </div>
                  )}

                  {/* MOCKUP: comparison */}
                  {currentSlide.mockupType === 'comparison' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#ef4444', lineHeight: '1.4' }}>
                        <b>🚫 Traditional Spend:</b> Shows local Pakur shop ad to users in Ranchi (200km away). 90% wasted budget.
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#10b981', lineHeight: '1.4' }}>
                        <b>✅ TDA Smart Core:</b> Displays ads strictly to regional consumers in your exact city. 100% efficient.
                      </div>
                    </div>
                  )}

                  {/* MOCKUP: geofence */}
                  {currentSlide.mockupType === 'geofence' && (
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                      <div style={{ width: '120px', height: '120px', border: '1.5px solid rgba(16, 185, 129, 0.25)', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'radarPing 1.5s infinite' }} />
                        <div style={{ position: 'absolute', width: '100%', height: '100%', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'radarRotate 4s linear infinite' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', display: 'block', marginTop: '12px' }}>
                        📍 Geofence Target: {detailsForm.targetCity || 'Pakur'}
                      </span>
                    </div>
                  )}

                  {/* MOCKUP: overlays */}
                  {currentSlide.mockupType === 'overlays' && (
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ height: '70px', background: '#000', borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '22px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: '#fff' }}>AD</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>YouTube Broadcast Screen</div>
                        <div style={{ position: 'absolute', bottom: 0, left: '22px', right: 0, height: '8px', background: '#f59e0b', opacity: 0.8 }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: '6px', fontSize: '9.5px' }}>
                        <span style={{ background: '#ef4444', color: '#fff', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold', fontSize: '8px' }}>REELS</span>
                        <span>Logo watermark overlay</span>
                      </div>
                    </div>
                  )}

                  {/* MOCKUPS: packages */}
                  {['startup_visual', 'leader_visual', 'dhamaka_visual', 'festival_visual', 'kingmaker_visual'].includes(currentSlide.mockupType || '') && (
                    <div style={{ background: '#090d16', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>💼</span>
                      <h6 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', margin: '0 0 2px 0' }}>{currentSlide.title}</h6>
                      <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>Dynamic Combo Configured</span>
                    </div>
                  )}

                  {/* MOCKUP: process_visual */}
                  {currentSlide.mockupType === 'process_visual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {['Creative Info', 'Graphics Design', 'WhatsApp Review', 'Campaign Go Live!'].map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#090d16', padding: '8px 12px', borderRadius: '6px', fontSize: '10.5px' }}>
                          <span style={{ width: '16px', height: '16px', background: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>✓</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MOCKUP: business_card */}
                  {currentSlide.mockupType === 'business_card' && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #13192e 0%, #080c16 100%)', 
                      borderRadius: '12px', 
                      padding: '14px', 
                      border: '1.5px solid #f59e0b', 
                      boxShadow: '0 0 15px rgba(245,158,11,0.15)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#fff' }}>Sonu Kumar Saha</div>
                          <div style={{ fontSize: '8.5px', color: '#f59e0b', fontWeight: 'bold' }}>DIRECTOR & OWNER</div>
                        </div>
                        <span style={{ fontSize: '14px' }}>👑</span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: '1.3' }}>
                        📞 +91-6203868383<br />
                        ✉️ ads@thedesiandaz.com
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* Premium Slide Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button 
                disabled={slideIndex === 0}
                onClick={() => setSlideIndex(slideIndex - 1)}
                style={{ 
                  background: slideIndex === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)', 
                  color: slideIndex === 0 ? '#64748b' : '#fff', 
                  border: '1px solid rgba(255, 255, 255, 0.06)', 
                  padding: '12px 24px', 
                  borderRadius: '30px', 
                  fontWeight: 700,
                  cursor: slideIndex === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ← Previous Slide
              </button>

              {/* Progress indicators segment bar */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {slides.map((_, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      width: '18px', 
                      height: '4px', 
                      borderRadius: '2px', 
                      background: i <= slideIndex ? '#ef4444' : 'rgba(255,255,255,0.08)',
                      transition: 'background 0.3s ease'
                    }} 
                  />
                ))}
              </div>

              {slideIndex < slides.length - 1 ? (
                <button 
                  onClick={() => setSlideIndex(slideIndex + 1)}
                  className="btn-gradient"
                  style={{ 
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px 32px', 
                    borderRadius: '30px', 
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Next Slide →
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentStep('packages')}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '12px 32px', 
                    borderRadius: '30px', 
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Configure Pricing
                </button>
              )}
            </div>
            
            {/* Visual presenter tips drawer */}
            <div className="glass-card" style={{ 
              padding: '18px 24px',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#cbd5e1',
              marginTop: '32px',
              border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <strong style={{ color: '#ef4444' }}>💡 Presenter Visual Suggestion:</strong> {currentSlide.visualSuggestion}
              {currentSlide.presenterTip && (
                <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 800 }}>
                  ⚡ Sales Tip: {currentSlide.presenterTip}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== STEP 5: PACKAGES SELECTOR ==================== */}
        {currentStep === 'packages' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                Select Your Ad Package
              </h3>
              <p style={{ fontSize: '14.5px', color: '#94a3b8', marginTop: '8px' }}>
                Choose the visibility offer package that matches your local marketing targets.
              </p>
            </div>

            {/* Premium pricing cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {packages.map(pkg => {
                const activeDur = Object.keys(pkg.pricing).find(key => (pkg.pricing as any)[key].base > 0) || '2month';
                const plan = (pkg.pricing as any)[activeDur];
                const notAvailable = false;

                return (
                  <div 
                    key={pkg.id} 
                    className="glass-card"
                    style={{ 
                      padding: '32px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr 1fr',
                      gap: '30px',
                      alignItems: 'center',
                      position: 'relative',
                      border: `1px solid ${pkg.color}45`,
                      boxShadow: `0 10px 30px ${pkg.glow}`,
                      opacity: 1,
                      pointerEvents: 'auto',
                      transition: 'all 0.3s'
                    } as any}
                  >
                    <div style={{ position: 'absolute', top: '-11px', left: '30px', background: pkg.color, color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {pkg.badge}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>{pkg.name}</h4>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.45' }}>{pkg.description}</p>
                    </div>

                    <div style={{ background: 'rgba(8, 12, 26, 0.45)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800, display: 'block', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>🎁 PLAN BENEFITS & DELIVERABLES</span>
                      <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11.5px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.45' }}>
                        {pkg.deliverables.map((del, i) => (
                          <li key={i} style={{ listStyleType: 'none', paddingLeft: '0', textIndent: '-14px' }}>
                            {del}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {notAvailable ? (
                        <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '14px' }}>Seasonal Plan Only</div>
                      ) : (
                        <>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>BASE: ₹{plan.base.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>+ 18% GST (₹{plan.gst.toLocaleString('en-IN')})</div>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '6px 0 16px 0', fontFamily: 'monospace' }}>
                            ₹{plan.total.toLocaleString('en-IN')}
                          </div>
                          <button 
                            onClick={() => handleSelectPackage({ ...pkg, activePlan: plan })}
                            className="btn-gradient"
                            style={{ 
                              color: '#fff', 
                              border: 'none', 
                              padding: '12px 30px', 
                              borderRadius: '25px', 
                              fontWeight: 800, 
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            Configure Package
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== STEP 6: SECURE RAZORPAY CHECKOUT TERMINAL ==================== */}
        {currentStep === 'payment' && selectedPackage && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            
            {/* Billing Config Meta Summary */}
            <div className="glass-card" style={{ 
              padding: '30px', 
              marginBottom: '28px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <h4 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '18px' }}>
                Billing Configuration Summary
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Campaign Level:</span>
                <strong style={{ color: '#fff' }}>{selectedPackage.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Target Geofence:</span>
                <strong style={{ color: '#10b981' }}>City Filter: {detailsForm.targetCity}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span style={{ color: '#cbd5e1' }}>Duration Period:</span>
                <strong style={{ color: '#fff' }}>{selectedDuration.toUpperCase()} Plan</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '12px', fontSize: '16.5px' }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>Total Billing (GST Included):</span>
                <strong style={{ color: '#f59e0b', fontSize: '22px', fontFamily: 'monospace' }}>
                  ₹{selectedPackage.activePlan.total.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Luxury Secure gold credit card simulator terminal */}
            <div style={{ 
              background: '#090d16', 
              color: '#1e293b',
              borderRadius: '24px', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.65)',
              overflow: 'hidden',
              border: '2.5px solid #10b981'
            }}>
              {/* Razorpay Secure Banner */}
              <div style={{ background: '#0a142c', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: '#3399FF', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 800 }}>R</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.5px' }}>Razorpay Secure Terminal</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 900, border: '1.5px solid #10b981', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.5px', textShadow: '0 0 10px rgba(16, 185, 129, 0.35)' }}>
                  LIVE PRODUCTION
                </span>
              </div>

              {paymentStatus === 'idle' && (
                <div style={{ padding: '30px' }}>
                  {selectedPackage.paymentLinks?.[selectedDuration] ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'activePulse 1.5s infinite' }} />
                          LIVE GATEWAY SESSION ACTIVE
                        </span>
                      </div>
                      
                      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '2.5px solid #d97706', boxShadow: '0 10px 30px rgba(217, 119, 6, 0.15)' }}>
                        <iframe 
                          src={selectedPackage.paymentLinks[selectedDuration]}
                          style={{ 
                            width: '100%', 
                            height: '560px', 
                            border: 'none',
                            display: 'block'
                          }}
                          title="Razorpay Live Checkout"
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                        <button 
                          onClick={triggerRazorpayPayment}
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            fontWeight: 800, 
                            cursor: 'pointer',
                            width: '100%',
                            fontSize: '15px',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.25s'
                          }}
                        >
                          ✅ Complete Campaign Setup (After Payment)
                        </button>
                        
                        <a 
                          href={selectedPackage.paymentLinks[selectedDuration]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            textAlign: 'center', 
                            fontSize: '12px', 
                            color: '#94a3b8', 
                            textDecoration: 'underline' 
                          }}
                        >
                          Can't complete payment inside the frame? Click here to open in a new window
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <span style={{ fontSize: '48px', margin: 0 }}>🔒</span>
                      <div>
                        <h5 style={{ fontWeight: 800, color: '#fff', fontSize: '18px', margin: '0 0 8px 0' }}>Live Gateway Link Pending</h5>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', maxWidth: '380px', margin: 0 }}>
                          The live checkout page for this combo package is currently being generated. Please click below to connect with our Campaign Manager over WhatsApp and activate your slot instantly!
                        </p>
                      </div>
                      
                      <a 
                        href="https://wa.me/918409659560" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          background: '#25D366',
                          color: '#fff',
                          padding: '14px 36px',
                          borderRadius: '30px',
                          fontWeight: 800,
                          fontSize: '14px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          animation: 'activePulse 3s infinite',
                          boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
                        }}
                      >
                        <i className="fab fa-whatsapp" style={{ fontSize: '18px' }} /> Connect with Sonu on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}

              {paymentStatus === 'processing' && (
                <div style={{ padding: '70px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    border: '4px solid rgba(255, 255, 255, 0.05)', 
                    borderLeftColor: '#f59e0b', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    marginBottom: '24px'
                  }} />
                  <h5 style={{ fontWeight: 800, fontSize: '18px', color: '#fff', margin: '0 0 6px 0' }}>Processing Secure Transaction</h5>
                  <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0 }}>Verifying credentials with Razorpay banking servers...</p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div style={{ padding: '70px 24px', textAlign: 'center' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%', display: 'flex', justifySelf: 'center', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px auto' }}>✓</div>
                  <h5 style={{ fontWeight: 800, fontSize: '19px', color: '#10b981', margin: '0 0 6px 0' }}>Payment Simulated Successfully!</h5>
                  <p style={{ fontSize: '13.5px', color: '#cbd5e1', margin: 0 }}>Onboarding package confirmed. Setting up partner workspace...</p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ==================== STEP 7: ONBOARDING SUCCESS DASHBOARD ==================== */}
        {currentStep === 'success' && (
          <div className="glass-card" style={{ 
            border: '2.5px solid #10b981',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(16,185,129,0.12)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ width: '68px', height: '68px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '50%', display: 'flex', justifySelf: 'center', alignItems: 'center', justifyContent: 'center', fontSize: '34px', margin: '0 auto 24px auto' }}>✓</div>
            
            <h2 style={{ fontSize: '34px', fontWeight: 900, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Your Campaign is Booked!
            </h2>
            <p style={{ fontSize: '16px', color: '#10b981', fontWeight: 800, marginBottom: '40px' }}>
              Santhal Pargana\'s First Media Network stands ready to launch your brand.
            </p>

            <div style={{ 
              background: 'rgba(8, 12, 26, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.04)', 
              borderRadius: '20px', 
              padding: '28px', 
              textAlign: 'left',
              marginBottom: '40px',
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: '30px'
            }}>
              <div>
                <h5 style={{ color: '#ef4444', fontWeight: 800, fontSize: '13.5px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next Onboarding Steps:
                </h5>
                <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px', lineHeight: '1.45' }}>
                  <li>Our Campaign Manager will message you on WhatsApp (<b>{accountForm.phone}</b>) within 15 minutes.</li>
                  <li>Provide your logo assets, tagline text, or raw banners directly over WhatsApp.</li>
                  <li>Our studio designs the L-shape overlays and tickers.</li>
                  <li>We send mockups for your approval, then go live!</li>
                </ol>
              </div>

              <div>
                <h5 style={{ color: '#f59e0b', fontWeight: 800, fontSize: '13.5px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Campaign Meta Profile:
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                  <div><b>Partner Brand:</b> <span style={{ color: '#fff', fontWeight: 700 }}>{detailsForm.businessName}</span></div>
                  <div><b>Geotargeting Area:</b> <span style={{ color: '#10b981', fontWeight: 700 }}>{detailsForm.targetCity} (Dynamic Filter)</span></div>
                  <div><b>Campaign Manager:</b> <span style={{ color: '#fff', fontWeight: 700 }}>Sonu Kumar Saha</span></div>
                  <div><b>Receipt Hash:</b> <span style={{ color: '#fff', fontFamily: 'monospace' }}>TDA_PAY_B2B_SUCCESS_88924</span></div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '28px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <Link 
                href="/"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  padding: '14px 36px',
                  borderRadius: '30px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                Back to Homepage
              </Link>
              
              <a 
                href="https://wa.me/918409659560" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  background: '#25D366',
                  color: '#fff',
                  padding: '14px 36px',
                  borderRadius: '30px',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  animation: 'activePulse 3s infinite'
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '18px' }} /> Message Sonu on WhatsApp
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
