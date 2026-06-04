'use client';

import React, { useState, useEffect } from 'react';

// Pre-defined B2B Package specs for calculations & options
const PACKAGES = [
  {
    id: 'local_startup',
    name: 'Local Start-Up Combo',
    badge: 'Local Targeting',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.15)',
    pricing: {
      week: 5000,
      month: 10000,
      '2month': 0,
      '3month': 26000,
      '6month': 48000,
      '12month': 85000
    }
  },
  {
    id: 'market_leader',
    name: 'Market Leader Combo',
    badge: 'Branding Core',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.15)',
    pricing: {
      week: 9000,
      month: 20000,
      '2month': 0,
      '3month': 52000,
      '6month': 95000,
      '12month': 170000
    }
  },
  {
    id: 'dhamaka_visibility',
    name: 'Dhamaka Visibility Combo',
    badge: 'Most Popular',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.15)',
    pricing: {
      week: 16000,
      month: 35000,
      '2month': 0,
      '3month': 90000,
      '6month': 165000,
      '12month': 300000
    }
  },
  {
    id: 'festival_special',
    name: 'Festival & Special Season Combo',
    badge: 'Sales Booster',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.15)',
    pricing: {
      week: 12000,
      month: 25000,
      '2month': 0,
      '3month': 65000,
      '6month': 0, // Not available
      '12month': 0
    }
  },
  {
    id: 'kingmaker_corporate',
    name: 'Kingmaker Corporate Combo',
    badge: 'Ultimate Power',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.15)',
    pricing: {
      week: 28000,
      month: 65000,
      '2month': 0,
      '3month': 175000,
      '6month': 320000,
      '12month': 580000
    }
  },
  {
    id: 'launch_2month',
    name: '2 Months Visibility (Launch Offer)',
    badge: 'Launch Offer',
    color: '#CC2200',
    glow: 'rgba(204, 34, 0, 0.15)',
    pricing: {
      week: 0,
      month: 0,
      '2month': 10000,
      '3month': 0,
      '6month': 0,
      '12month': 0
    }
  },
  {
    id: 'launch_6month',
    name: '6 Months Visibility (Launch Offer)',
    badge: 'Launch Offer',
    color: '#FF6B00',
    glow: 'rgba(255, 107, 0, 0.15)',
    pricing: {
      week: 0,
      month: 0,
      '2month': 0,
      '3month': 0,
      '6month': 25000,
      '12month': 0
    }
  }
];

interface AdvertiserClient {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  packageId: string;
  duration: 'week' | 'month' | '2month' | '3month' | '6month' | '12month';
  targetCity: string;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  razorpayId: string;
  campaignStatus: 'Active' | 'Pending Creative' | 'Paused' | 'Completed';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  tickerText: string;
  bannerText: string;
}

// Helper to calculate Campaign Expiration Date based on Start Date and Duration (Pure function)
const calculateEndDateStr = (startStr: string, dur: 'week' | 'month' | '2month' | '3month' | '6month' | '12month') => {
  if (!startStr) return '';
  const date = new Date(startStr);
  if (isNaN(date.getTime())) return '';
  
  if (dur === 'week') {
    date.setDate(date.getDate() + 7);
  } else if (dur === 'month') {
    date.setMonth(date.getMonth() + 1);
  } else if (dur === '2month') {
    date.setMonth(date.getMonth() + 2);
  } else if (dur === '3month') {
    date.setMonth(date.getMonth() + 3);
  } else if (dur === '6month') {
    date.setMonth(date.getMonth() + 6);
  } else if (dur === '12month') {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString().split('T')[0];
};

export default function AdvertiserDashboard() {
  const [clients, setClients] = useState<AdvertiserClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<AdvertiserClient | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form States for creation/edit
  const [formName, setFormName] = useState('');
  const [formBusiness, setFormBusiness] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPackage, setFormPackage] = useState('local_startup');
  const [formDuration, setFormDuration] = useState<'week' | 'month' | '2month' | '3month' | '6month' | '12month'>('month');
  const [formCity, setFormCity] = useState('Pakur');
  const [formPaid, setFormPaid] = useState('');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'Paid' | 'Partial' | 'Pending'>('Paid');
  const [formRazorpayId, setFormRazorpayId] = useState('');
  const [formCampaignStatus, setFormCampaignStatus] = useState<'Active' | 'Pending Creative' | 'Paused' | 'Completed'>('Active');
  const [formStartDate, setFormStartDate] = useState('2026-05-25');
  const [formEndDate, setFormEndDate] = useState('2026-06-25');
  const [formTicker, setFormTicker] = useState('Specially discounted rates inside our showroom! Grab offer today.');
  const [formBanner, setFormBanner] = useState('Premium Brands, Dynamic Local Delivery.');

  // Load preset mock advertiser data on initialization
  useEffect(() => {
    const saved = localStorage.getItem('tda_advertiser_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdvertiserClient[];
        // Sanitize and ensure every client has a valid startDate and endDate!
        const sanitized = parsed.map(c => {
          const startDate = c.startDate || (c as any).registeredDate || '2026-05-25';
          const endDate = c.endDate || calculateEndDateStr(startDate, c.duration) || '2026-06-25';
          return {
            ...c,
            startDate,
            endDate
          };
        });
        setClients(sanitized);
        saveToStorage(sanitized);
        setSelectedClient(sanitized[0] || null);
      } catch (e) {
        initializePresetData();
      }
    } else {
      initializePresetData();
    }
  }, []);

  const initializePresetData = () => {
    const presets: AdvertiserClient[] = [
      {
        id: '1',
        name: 'Sonu Kumar Saha',
        businessName: 'Saha Electronics',
        email: 'sonu@sahaelectronics.com',
        phone: '+918409659560',
        packageId: 'dhamaka_visibility',
        duration: 'month',
        targetCity: 'Pakur',
        paidAmount: 41300,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_88294625',
        campaignStatus: 'Active',
        startDate: '2026-05-20',
        endDate: '2026-06-20',
        tickerText: '💥 Special Dhamaka Sale! Buy Smart LED TVs at 40% OFF - Saha Electronics Pakur!',
        bannerText: 'Saha Electronics: Pakur\'s Most Trusted Smart Appliance Center'
      },
      {
        id: '2',
        name: 'Karan Sharma',
        businessName: 'Sharma Honda Showroom',
        email: 'karan.sharma@honda-dealer.in',
        phone: '+919988776655',
        packageId: 'market_leader',
        duration: 'month',
        targetCity: 'Dumka',
        paidAmount: 23600,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_90123984',
        campaignStatus: 'Active',
        startDate: '2026-05-22',
        endDate: '2026-06-22',
        tickerText: '🏍️ Book your new Honda Activa this week & get free insurance strictly at Sharma Honda Dumka!',
        bannerText: 'Sharma Honda: Ride with Trust and Premium Quality'
      },
      {
        id: '3',
        name: 'Priya Gupta',
        businessName: 'Gupta Fashion Hub',
        email: 'priya@guptafashions.com',
        phone: '+917766554433',
        packageId: 'local_startup',
        duration: 'week',
        targetCity: 'Sahibganj',
        paidAmount: 5900,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_92736412',
        campaignStatus: 'Pending Creative',
        startDate: '2026-05-24',
        endDate: '2026-05-31',
        tickerText: '👗 New Summer Wear Collection launched at Sahibganj Main Road shop!',
        bannerText: 'Gupta Fashion Hub: Stylish, Trendy, and Affordable Wear'
      },
      {
        id: '4',
        name: 'Dr. A. K. Roy',
        businessName: 'Roy Nethralaya & Eye Care',
        email: 'appointments@roynethralaya.org',
        phone: '+919431102938',
        packageId: 'kingmaker_corporate',
        duration: '3month',
        targetCity: 'Pakur',
        paidAmount: 206500,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_86293021',
        campaignStatus: 'Active',
        startDate: '2026-05-15',
        endDate: '2026-08-15',
        tickerText: '👁️ Free Cataract Screening Camp on Sundays inside Roy Nethralaya, Pakur (Call +91-9431102938).',
        bannerText: 'Roy Nethralaya: Super Specialty Eye Surgery & Diagnostics center'
      },
      {
        id: '5',
        name: 'Vikram Singh',
        businessName: 'Singh Sweets & Caterers',
        email: 'vikram@singhsweets.com',
        phone: '+918800991122',
        packageId: 'festival_special',
        duration: 'month',
        targetCity: 'Deoghar',
        paidAmount: 20000,
        paymentStatus: 'Partial',
        razorpayId: 'Offline PDC Cheque 40924',
        campaignStatus: 'Paused',
        startDate: '2026-05-18',
        endDate: '2026-06-18',
        tickerText: '🍬 Deoghar Peda & Kaju Katli special combos ready for festive delivery!',
        bannerText: 'Singh Sweets: Traditional Santhal Pargana Flavors Since 1985'
      },
      {
        id: '6',
        name: 'Rajesh Verma',
        businessName: 'Verma Jewelers',
        email: 'rajesh@vermajewelers.com',
        phone: '+919876543210',
        packageId: 'local_startup',
        duration: 'week',
        targetCity: 'Pakur',
        paidAmount: 5900,
        paymentStatus: 'Paid',
        razorpayId: 'pay_RPY_81092837',
        campaignStatus: 'Completed',
        startDate: '2026-05-10',
        endDate: '2026-05-17',
        tickerText: '💎 Gold & Diamond jewelry discounted exchange offers strictly at Pakur showroom.',
        bannerText: 'Verma Jewelers: Crafting Pure Elegance in Pakur Since 1999'
      }
    ];
    setClients(presets);
    saveToStorage(presets);
    setSelectedClient(presets[0]);
  };

  const saveToStorage = (updatedList: AdvertiserClient[]) => {
    localStorage.setItem('tda_advertiser_clients', JSON.stringify(updatedList));
  };

  // Helper calculation for Package Costs
  const calculateTotalCost = (pkgId: string, dur: AdvertiserClient['duration']) => {
    const pkg = PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return 0;
    const base = pkg.pricing[dur];
    if (base === 0) return 0;
    const gst = Math.round(base * 0.18);
    return base + gst;
  };

  // Helper to calculate Campaign Expiration Date based on Start Date and Duration
  const calculateEndDate = (startStr: string, dur: AdvertiserClient['duration']) => {
    return calculateEndDateStr(startStr, dur);
  };

  // Automatically update suggested paid amount when package or duration changes
  useEffect(() => {
    if (isAddModalOpen || isEditModalOpen) {
      const suggested = calculateTotalCost(formPackage, formDuration);
      if (suggested > 0) {
        setFormPaid(suggested.toString());
      }
    }
  }, [formPackage, formDuration, isAddModalOpen, isEditModalOpen]);

  // Automatically update suggested end date when start date or duration changes
  useEffect(() => {
    if (isAddModalOpen || isEditModalOpen) {
      const calculated = calculateEndDate(formStartDate, formDuration);
      if (calculated) {
        setFormEndDate(calculated);
      }
    }
  }, [formStartDate, formDuration, isAddModalOpen, isEditModalOpen]);

  // Helper to calculate the Plan Expiry Status / Days Left
  const getPlanExpiryBadge = (endDateStr: string, status: AdvertiserClient['campaignStatus']) => {
    if (!endDateStr) {
      return (
        <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          🕒 No Date Set
        </span>
      );
    }

    const today = new Date('2026-05-25'); // Align with simulated current local time (May 25, 2026)
    today.setHours(0, 0, 0, 0);
    
    const end = new Date(endDateStr);
    if (isNaN(end.getTime())) {
      return (
        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          🕒 Invalid Date
        </span>
      );
    }
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (status === 'Paused') {
      return (
        <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          ⏸️ Paused
        </span>
      );
    }

    if (diffDays < 0) {
      return (
        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          🔴 Expired
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          ⚠️ Expires Today
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span style={{ background: '#fff7ed', color: '#d97706', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          🟡 {diffDays} Days Left
        </span>
      );
    } else {
      return (
        <span style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 800 }}>
          🟢 {diffDays} Days Left
        </span>
      );
    }
  };

  // Handle Client Add Submission
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBusiness || !formPhone) {
      alert('Please fill out Client Name, Brand Name, and WhatsApp active Phone!');
      return;
    }

    const calculatedTotal = calculateTotalCost(formPackage, formDuration);

    const newClient: AdvertiserClient = {
      id: Date.now().toString(),
      name: formName,
      businessName: formBusiness,
      email: formEmail || 'partner@thedesiandaz.com',
      phone: formPhone.startsWith('+91') ? formPhone : `+91${formPhone.replace(/\D/g, '')}`,
      packageId: formPackage,
      duration: formDuration,
      targetCity: formCity,
      paidAmount: Number(formPaid) || calculatedTotal,
      paymentStatus: formPaymentStatus,
      razorpayId: formRazorpayId || `pay_RPY_${Math.floor(10000000 + Math.random() * 90000000)}`,
      campaignStatus: formCampaignStatus,
      startDate: formStartDate,
      endDate: formEndDate,
      tickerText: formTicker || `🔥 Grab heavy premium retail discounts today only at ${formBusiness} ${formCity}!`,
      bannerText: formBanner || `${formBusiness}: Verified Local Partner in ${formCity}`
    };

    const updated = [...clients, newClient];
    setClients(updated);
    saveToStorage(updated);
    setSelectedClient(newClient);
    setIsAddModalOpen(false);
    resetForm();
  };

  // Handle Client Edit Submission
  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const updated = clients.map(client => {
      if (client.id === selectedClient.id) {
        const calculatedTotal = calculateTotalCost(formPackage, formDuration);
        const updatedObj: AdvertiserClient = {
          ...client,
          name: formName,
          businessName: formBusiness,
          email: formEmail,
          phone: formPhone,
          packageId: formPackage,
          duration: formDuration,
          targetCity: formCity,
          paidAmount: Number(formPaid) || calculatedTotal,
          paymentStatus: formPaymentStatus,
          razorpayId: formRazorpayId,
          campaignStatus: formCampaignStatus,
          startDate: formStartDate,
          endDate: formEndDate,
          tickerText: formTicker,
          bannerText: formBanner
        };
        setSelectedClient(updatedObj);
        return updatedObj;
      }
      return client;
    });

    setClients(updated);
    saveToStorage(updated);
    setIsEditModalOpen(false);
  };

  // Open Edit Modal with pre-loaded client parameters
  const openEdit = (client: AdvertiserClient) => {
    setSelectedClient(client);
    setFormName(client.name);
    setFormBusiness(client.businessName);
    setFormEmail(client.email);
    setFormPhone(client.phone);
    setFormPackage(client.packageId);
    setFormDuration(client.duration);
    setFormCity(client.targetCity);
    setFormPaid(client.paidAmount.toString());
    setFormPaymentStatus(client.paymentStatus);
    setFormRazorpayId(client.razorpayId);
    setFormCampaignStatus(client.campaignStatus);
    setFormStartDate(client.startDate);
    setFormEndDate(client.endDate);
    setFormTicker(client.tickerText);
    setFormBanner(client.bannerText);
    setIsEditModalOpen(true);
  };

  // Delete Advertiser Client
  const handleDeleteClient = (id: string) => {
    if (confirm('Are you absolutely sure you want to delete this advertiser client? This will delete all campaign assets.')) {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      saveToStorage(updated);
      if (selectedClient?.id === id) {
        setSelectedClient(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  // Toggle Campaign active status instantly on row click
  const quickToggleCampaign = (id: string, current: AdvertiserClient['campaignStatus']) => {
    const nextStatus: AdvertiserClient['campaignStatus'] = 
      current === 'Active' ? 'Paused' : current === 'Paused' ? 'Active' : 'Active';

    const updated = clients.map(c => {
      if (c.id === id) {
        const u = { ...c, campaignStatus: nextStatus };
        if (selectedClient?.id === id) setSelectedClient(u);
        return u;
      }
      return c;
    });
    setClients(updated);
    saveToStorage(updated);
  };

  // Quick WhatsApp Template builder
  const openWhatsApp = (client: AdvertiserClient) => {
    const pkg = PACKAGES.find(p => p.id === client.packageId);
    const text = encodeURIComponent(
      `Hello ${client.name},\n\nThis is Sonu Kumar Saha from *The Desi Andaz Media Network* (झारखंड संथाल परगना ka pehla media house).\n\nYour campaign settings for *${client.businessName}* inside *${client.targetCity}* are live!\n\n📋 *Campaign Summary:*\n- *Package:* ${pkg?.name}\n- *Billing Duration:* ${client.duration.toUpperCase()}\n- *Timeline:* ${client.startDate} to ${client.endDate}\n- *Amount Paid:* ₹${client.paidAmount.toLocaleString('en-IN')}\n- *Live Web Banner:* "${client.bannerText}"\n- *YouTube Scroll Ticker:* "${client.tickerText}"\n- *Campaign Status:* 🟢 ACTIVE\n\nPlease let us know if you want to refresh your retail banners or news tickers for this month. Thank you for partnering with Santhal Pargana's pioneer news network!`
    );
    window.open(`https://wa.me/${client.phone.replace('+', '')}?text=${text}`, '_blank');
  };

  const resetForm = () => {
    setFormName('');
    setFormBusiness('');
    setFormEmail('');
    setFormPhone('');
    setFormPackage('local_startup');
    setFormDuration('month');
    setFormCity('Pakur');
    setFormPaid('');
    setFormPaymentStatus('Paid');
    setFormRazorpayId('');
    setFormCampaignStatus('Active');
    setFormStartDate('2026-05-25');
    setFormEndDate('2026-06-25');
    setFormTicker('Specially discounted rates inside our showroom! Grab offer today.');
    setFormBanner('Premium Brands, Dynamic Local Delivery.');
  };

  // Cumulative B2B stats
  const totalRevenue = clients.reduce((sum, c) => sum + (c.paymentStatus !== 'Pending' ? c.paidAmount : 0), 0);
  const activeCount = clients.filter(c => c.campaignStatus === 'Active').length;
  const pendingCreative = clients.filter(c => c.campaignStatus === 'Pending Creative').length;
  const estimatedReach = clients.filter(c => c.campaignStatus === 'Active').length * 28000;

  return (
    <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", color: '#1e293b', background: '#f8fafc', minHeight: '100vh', padding: '12px' }}>
      
      {/* Dynamic Keyframe Animations Scoped inside Style Tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes subtlePulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pulse-active {
          animation: subtlePulse 2s infinite;
        }
        .dashboard-container {
          width: 100%;
        }
      `}} />

      {/* Header Banner */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        background: '#ffffff',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ef4444' }}>📣</span> B2B Advertiser Management Center
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Supervise simulated geofencing campaigns, manage payments (A to Z), verify retail content overlays, and message active partners.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
          >
            <i className="fas fa-user-plus"></i> Add Advertiser Client
          </button>
          
          <button 
            onClick={initializePresetData}
            style={{
              background: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Reset to default mock database"
          >
            <i className="fas fa-undo"></i> Reset Database
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total B2B Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, desc: 'GST included simulated ledger', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: 'fa-wallet' },
          { label: 'Active Campaigns', value: activeCount.toString(), desc: 'Currently running geofences', color: '#6366f1', bg: '#e0e7ff', border: '#c7d2fe', icon: 'fa-play-circle' },
          { label: 'Creative Verification Pending', value: pendingCreative.toString(), desc: 'Needs graphics design checks', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', icon: 'fa-paint-brush' },
          { label: 'Estimated Geofence Views', value: `${estimatedReach.toLocaleString()} / mo`, desc: 'Direct Santhal Pargana exposure', color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', icon: 'fa-eye' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>{stat.value}</div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>{stat.desc}</div>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: stat.bg,
              color: stat.color,
              border: `1.5px solid ${stat.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="dashboard-container">
        
        {/* Client Accounts Ledger Table */}
        <div style={{ 
          background: '#ffffff', 
          borderRadius: '16px', 
          padding: '24px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            💼 Registered Client Registry
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <th style={{ padding: '12px' }}>Brand / Representative</th>
                  <th style={{ padding: '12px' }}>Combo Package</th>
                  <th style={{ padding: '12px' }}>Geofence Area</th>
                  <th style={{ padding: '12px' }}>Billing Amount</th>
                  <th style={{ padding: '12px' }}>Plan Duration</th>
                  <th style={{ padding: '12px' }}>Plan Expiry</th>
                  <th style={{ padding: '12px' }}>Campaign Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      No Advertiser clients registered. Click 'Add Advertiser Client' above to populate.
                    </td>
                  </tr>
                ) : (
                  clients.map(client => {
                    const pkg = PACKAGES.find(p => p.id === client.packageId);
                    
                    return (
                      <tr 
                        key={client.id}
                        style={{
                          background: '#f8fafc',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Column 1: Client Profile */}
                        <td style={{ padding: '16px 12px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>{client.businessName}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>👤 {client.name}</span>
                          </div>
                        </td>
                        
                        {/* Column 2: Package Name & Duration */}
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{ 
                            background: `${pkg?.color}15`, 
                            color: pkg?.color, 
                            border: `1.5px solid ${pkg?.color}25`, 
                            padding: '3px 8px', 
                            borderRadius: '20px', 
                            fontSize: '10px', 
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px'
                          }}>
                            {pkg?.badge}
                          </span>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>{client.duration.toUpperCase()} cycle</div>
                        </td>

                        {/* Column 3: Geofence Filter */}
                        <td style={{ padding: '16px 12px', fontWeight: 700, color: '#059669' }}>
                          📍 {client.targetCity}
                        </td>

                        {/* Column 4: Billing & Razorpay */}
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', fontSize: '13.5px' }}>
                            ₹{client.paidAmount.toLocaleString('en-IN')}
                          </div>
                          
                          <span style={{ 
                            display: 'inline-block',
                            marginTop: '4px',
                            fontSize: '9.5px', 
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: client.paymentStatus === 'Paid' ? '#ecfdf5' : client.paymentStatus === 'Partial' ? '#fff7ed' : '#fef2f2',
                            color: client.paymentStatus === 'Paid' ? '#10b981' : client.paymentStatus === 'Partial' ? '#f59e0b' : '#ef4444',
                            border: `1px solid ${client.paymentStatus === 'Paid' ? '#a7f3d0' : client.paymentStatus === 'Partial' ? '#fde68a' : '#fecaca'}`
                          }}>
                            {client.paymentStatus}
                          </span>
                        </td>

                        {/* Column 5: Start & End Dates */}
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#334155', fontSize: '12.5px' }}>{client.startDate}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2.5px' }}>to {client.endDate}</div>
                        </td>

                        {/* Column 6: Plan Expiration Badge */}
                        <td style={{ padding: '16px 12px' }}>
                          {getPlanExpiryBadge(client.endDate, client.campaignStatus)}
                        </td>

                        {/* Column 7: Campaign Active status */}
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div 
                              className={client.campaignStatus === 'Active' ? 'pulse-active' : ''}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: client.campaignStatus === 'Active' ? '#10b981' : client.campaignStatus === 'Pending Creative' ? '#f59e0b' : client.campaignStatus === 'Paused' ? '#ef4444' : '#64748b',
                              }} 
                            />
                            <span style={{ 
                              fontWeight: 800, 
                              fontSize: '11.5px', 
                              color: client.campaignStatus === 'Active' ? '#10b981' : client.campaignStatus === 'Pending Creative' ? '#ea580c' : client.campaignStatus === 'Paused' ? '#ef4444' : '#64748b' 
                            }}>
                              {client.campaignStatus}
                            </span>
                          </div>
                        </td>

                        {/* Column 8: Quick Action icons */}
                        <td 
                          style={{ padding: '16px 12px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', textAlign: 'center' }}
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setIsViewModalOpen(true);
                              }}
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#2563eb' }}
                              title="View Campaign Information Card in Popup"
                            >
                              <i className="fas fa-eye"></i>
                            </button>

                            <button
                              onClick={() => quickToggleCampaign(client.id, client.campaignStatus)}
                              style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#475569' }}
                              title="Quick Toggle Campaign Active/Paused"
                            >
                              <i className={`fas ${client.campaignStatus === 'Active' ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>

                            <button
                              onClick={() => openWhatsApp(client)}
                              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#10b981' }}
                              title="Open Direct Message in WhatsApp"
                            >
                              <i className="fab fa-whatsapp"></i>
                            </button>

                            <button
                              onClick={() => openEdit(client)}
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#2563eb' }}
                              title="Edit Client Campaign Parameters"
                            >
                              <i className="fas fa-edit"></i>
                            </button>

                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#ef4444' }}
                              title="Delete Advertiser"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ==================== MODAL: VIEW CLIENT DETAILS (POPUP) ==================== */}
      {isViewModalOpen && selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1.5px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📂 Campaign Information Card
              </h3>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
              >
                &times;
              </button>
            </div>
            
            <div style={{ padding: '28px 24px' }}>
              {/* Client Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', fontSize: '24px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
                  {selectedClient.businessName[0].toUpperCase()}
                </div>
                <div>
                  <h5 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedClient.businessName}</h5>
                  <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>Representative: {selectedClient.name}</span>
                </div>
              </div>

              {/* Grid details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13.5px', color: '#475569', marginBottom: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CONTACT WHATSAPP</div>
                  <strong style={{ color: '#0f172a', display: 'block', marginTop: '2px' }}>{selectedClient.phone}</strong>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>OFFICIAL EMAIL</div>
                  <strong style={{ color: '#0f172a', display: 'block', marginTop: '2px' }}>{selectedClient.email}</strong>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TARGET LOCATION</div>
                  <strong style={{ color: '#059669', display: 'block', marginTop: '2px' }}>📍 {selectedClient.targetCity} (Geofence)</strong>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRANSACTION REF</div>
                  <strong style={{ color: '#d97706', fontFamily: 'monospace', display: 'block', marginTop: '2px' }}>{selectedClient.razorpayId}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>CAMPAIGN TIMELINE</div>
                  <strong style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📅 {selectedClient.startDate} <span style={{ color: '#cbd5e1' }}>→</span> {selectedClient.endDate}
                  </strong>
                </div>
                 <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>PLAN EXPIRATION STATUS</div>
                  {getPlanExpiryBadge(selectedClient.endDate, selectedClient.campaignStatus)}
                </div>

                {((selectedClient as any).logoAsset || (selectedClient as any).bannerAsset) && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                    <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                      🖼️ Uploaded Brand Assets:
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      {(selectedClient as any).logoAsset && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Official Logo:</span>
                          <img 
                            src={(selectedClient as any).logoAsset} 
                            alt="Logo" 
                            style={{ height: '70px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#000', objectFit: 'contain', padding: '4px' }} 
                          />
                        </div>
                      )}
                      {(selectedClient as any).bannerAsset && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Ad Graphic Creative:</span>
                          <img 
                            src={(selectedClient as any).bannerAsset} 
                            alt="Ad Creative" 
                            style={{ height: '70px', borderRadius: '8px', border: '1px solid #cbd5e1', objectFit: 'contain' }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => openWhatsApp(selectedClient)}
                  style={{
                    width: '100%',
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <i className="fab fa-whatsapp" style={{ fontSize: '18px' }}></i> Message Sonu / Send Campaign Details
                </button>
                
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  style={{
                    width: '100%',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    cursor: 'pointer'
                  }}
                >
                  Close Details Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD CLIENT ==================== */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Add B2B Advertiser Client</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleAddClient} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Client Full Name</label>
                  <input type="text" required placeholder="e.g. Sonu Kumar Saha" value={formName} onChange={e => setFormName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Brand / Showroom Name</label>
                  <input type="text" required placeholder="e.g. Saha Electronics" value={formBusiness} onChange={e => setFormBusiness(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Official Email</label>
                  <input type="email" placeholder="partner@thedesiandaz.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>WhatsApp Phone Number</label>
                  <input type="tel" required placeholder="e.g. +918409659560" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Select Package Combo</label>
                  <select value={formPackage} onChange={e => setFormPackage(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    {PACKAGES.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Billing Cycle</label>
                  <select value={formDuration} onChange={e => setFormDuration(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    <option value="week">1 Week Trial</option>
                    <option value="month">1 Month</option>
                    <option value="2month">2 Months (Launch Offer)</option>
                    <option value="3month">3 Months</option>
                    <option value="6month">6 Months</option>
                    <option value="12month">12 Months (Annual)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Geofence Target City</label>
                  <input type="text" required placeholder="e.g. Pakur" value={formCity} onChange={e => setFormCity(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Amount Paid (Simulated Ledger)</label>
                  <input type="number" required placeholder="Suggested calculated value" value={formPaid} onChange={e => setFormPaid(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Campaign Start Date</label>
                  <input type="date" required value={formStartDate} onChange={e => setFormStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Campaign End Date (Auto-calculated)</label>
                  <input type="date" required value={formEndDate} onChange={e => setFormEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Payment Status</label>
                  <select value={formPaymentStatus} onChange={e => setFormPaymentStatus(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Razorpay ID / Ref</label>
                  <input type="text" placeholder="pay_RPY_88294625" value={formRazorpayId} onChange={e => setFormRazorpayId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>YouTube News scrolling ticker text</label>
                <textarea rows={2} placeholder="e.g. Special Dhamaka Sale! Buy Smart LED TVs at 40% OFF - Saha Electronics Pakur!" value={formTicker} onChange={e => setFormTicker(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '12.5px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Web Portal banner headline text</label>
                <input type="text" placeholder="e.g. Saha Electronics: Pakur's Most Trusted Smart Appliance Center" value={formBanner} onChange={e => setFormBanner(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12.5px' }} />
              </div>

              <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}>
                Create Client Profile & Simulated Campaign
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT CLIENT ==================== */}
      {isEditModalOpen && selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Edit Campaign & Payment Details</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditClient} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Client Full Name</label>
                  <input type="text" required placeholder="Sonu Kumar Saha" value={formName} onChange={e => setFormName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Brand / Showroom Name</label>
                  <input type="text" required placeholder="Saha Electronics" value={formBusiness} onChange={e => setFormBusiness(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>Official Email</label>
                  <input type="email" placeholder="partner@thedesiandaz.com" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>WhatsApp Phone Number</label>
                  <input type="tel" required placeholder="+918409659560" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Select Package Combo</label>
                  <select value={formPackage} onChange={e => setFormPackage(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    {PACKAGES.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Billing Cycle</label>
                  <select value={formDuration} onChange={e => setFormDuration(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    <option value="week">1 Week Trial</option>
                    <option value="month">1 Month</option>
                    <option value="2month">2 Months (Launch Offer)</option>
                    <option value="3month">3 Months</option>
                    <option value="6month">6 Months</option>
                    <option value="12month">12 Months (Annual)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Geofence Target City</label>
                  <input type="text" required placeholder="e.g. Pakur" value={formCity} onChange={e => setFormCity(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Amount Paid (Simulated Ledger)</label>
                  <input type="number" required placeholder="23600" value={formPaid} onChange={e => setFormPaid(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Campaign Start Date</label>
                  <input type="date" required value={formStartDate} onChange={e => setFormStartDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Campaign End Date (Auto-calculated)</label>
                  <input type="date" required value={formEndDate} onChange={e => setFormEndDate(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Payment Status</label>
                  <select value={formPaymentStatus} onChange={e => setFormPaymentStatus(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Razorpay ID / Ref</label>
                  <input type="text" placeholder="pay_RPY_88294625" value={formRazorpayId} onChange={e => setFormRazorpayId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Campaign Status</label>
                  <select value={formCampaignStatus} onChange={e => setFormCampaignStatus(e.target.value as any)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
                    <option value="Active">Active</option>
                    <option value="Pending Creative">Pending Creative</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>YouTube News scrolling ticker text</label>
                <textarea rows={2} placeholder="Sponsor Scrolling ticker contents" value={formTicker} onChange={e => setFormTicker(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '12.5px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Web Portal banner headline text</label>
                <input type="text" placeholder="Sponsor banner overlay headline" value={formBanner} onChange={e => setFormBanner(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12.5px' }} />
              </div>

              <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}>
                Update Client Profile & Campaign Details
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
