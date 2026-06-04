/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { getAffiliateDashboardData, getMarketingMaterials, getAffiliateLeaderboard } from '@/actions/affiliate';

export default function AffiliateDashboard() {
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [marketing, setMarketing] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sales' | 'wallet' | 'marketing' | 'leaderboard'>('overview');
  const [loading, setLoading] = useState(true);

  // Referral Link Generator States
  const [customPageUrl, setCustomPageUrl] = useState('');
  const [generatedCustomLink, setGeneratedCustomLink] = useState('');

  // Sales Filter State
  const [salesFilter, setSalesFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('affiliateId');
      if (!id) {
        window.location.href = '/affiliate';
      } else {
        setAffiliateId(id);
        loadDashboardData(id);
      }
    }
  }, []);

  const loadDashboardData = async (id: string) => {
    setLoading(true);
    try {
      const res = await getAffiliateDashboardData(id);
      if (res) {
        setData(res);
      }
      
      const mMaterials = await getMarketingMaterials();
      setMarketing(mMaterials);

      const lBoard = await getAffiliateLeaderboard();
      setLeaderboard(lBoard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/affiliate';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('लिंक क्लिपबोर्ड पर कॉपी हो गया है!');
  };

  const generateCustomLink = () => {
    if (!customPageUrl.trim() || !data) return;
    
    // Clean target URL and append ?ref=TDAXXXX
    let target = customPageUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    
    const url = new URL(target);
    url.searchParams.set('ref', data.affiliateCode);
    
    setGeneratedCustomLink(url.toString());
  };

  if (loading || !data) {
    return (
      <div style={{ background: '#090d16', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#ef4444' }} />
        <span>पार्टनर डैशबोर्ड लोड हो रहा है...</span>
      </div>
    );
  }

  // Filter Sales list
  const getFilteredSales = () => {
    if (!data.salesList) return [];
    
    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // start of week Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return data.salesList.filter((s: any) => {
      const saleDate = new Date(s.createdAt);
      
      if (salesFilter === 'today') {
        return saleDate.toDateString() === todayStr;
      }
      if (salesFilter === 'yesterday') {
        return saleDate.toDateString() === yesterdayStr;
      }
      if (salesFilter === 'week') {
        return saleDate >= startOfWeek;
      }
      if (salesFilter === 'month') {
        return saleDate >= startOfMonth;
      }
      return true;
    });
  };

  const filteredSales = getFilteredSales();

  // Share Referral Link on WhatsApp
  const shareReferralOnWhatsApp = () => {
    if (!data) return;
    const baseLink = `https://thedesiandaz.com/?ref=${data.affiliateCode}`;
    const text = encodeURIComponent(`नमस्ते, मैं इस बेहतरीन विज्ञापन और मार्केटिंग सेवा की सिफारिश करता हूँ। नीचे दिए लिंक पर क्लिक करके विज्ञापन खरीदें और लाभ उठाएं:\n\n👉 ${baseLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Generate downloadable PDF statement
  const generatePDFStatement = () => {
    // Basic CSV/HTML Print style simulation since full pdf libraries can be tricky on server
    const printContent = `
      <html>
      <head>
        <title>TDA Affiliate Statement - ${data.affiliateCode}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f4f4f4; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ef4444; padding-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>THE DESI ANDAZ MEDIA NETWORK</h1>
          <h3>AFFILIATE STATEMENT OF ACCOUNT</h3>
          <p>Affiliate Code: ${data.affiliateCode} | Name: ${data.fullName}</p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        
        <h2>Overview Statistics</h2>
        <table>
          <tr><th>Total Clicks</th><td>${data.totalClicks}</td><th>Total Sales</th><td>${data.totalSales}</td></tr>
          <tr><th>Lifetime Earnings</th><td>₹${data.totalLifetimeEarnings.toLocaleString('en-IN')}</td><th>Wallet Balance</th><td>₹${data.walletBalance.toLocaleString('en-IN')}</td></tr>
          <tr><th>Approved Commissions</th><td>₹${data.approvedCommission.toLocaleString('en-IN')}</td><th>Paid Commissions</th><td>₹${data.paidCommission.toLocaleString('en-IN')}</td></tr>
        </table>

        <h2>Sales History</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Customer</th><th>Package</th><th>Base Value</th><th>GST</th><th>Total Paid</th><th>Commission</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data.salesList.map((s: any) => `
              <tr>
                <td>${new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                <td>${s.customerName}</td>
                <td>${s.packageName}</td>
                <td>₹${s.baseValue}</td>
                <td>₹${s.gstAmount}</td>
                <td>₹${s.totalPaid}</td>
                <td>₹${s.commissionEarned}</td>
                <td>${s.commissionStatus}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const referralLink = `https://thedesiandaz.com/?ref=${data.affiliateCode}`;
  
  // Progress Bar percentage calculate
  const targetPercent = Math.min(100, Math.floor((data.currentMonthBaseValue / (data.remainingTarget + data.currentMonthBaseValue)) * 100));

  return (
    <div style={{ background: '#090d16', color: '#f1f5f9', minHeight: '100vh', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Top Navbar */}
      <nav style={{ background: 'rgba(9, 13, 22, 0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>AFFILIATE PARTNER</span>
            <span style={{ fontSize: '16px', fontWeight: 900 }}>TDA DASHBOARD</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{data.fullName}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ID: {data.affiliateCode}</span>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'overview', label: 'Overview (अवलोकन)', icon: 'fa-home' },
            { id: 'sales', label: 'Sales History (बिक्री)', icon: 'fa-shopping-cart' },
            { id: 'wallet', label: 'Wallet & Payouts', icon: 'fa-wallet' },
            { id: 'marketing', label: 'Creatives & Guides', icon: 'fa-bullhorn' },
            { id: 'leaderboard', label: 'Leaderboard', icon: 'fa-trophy' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeSubTab === tab.id ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : 'transparent',
                color: activeSubTab === tab.id ? '#fff' : '#94a3b8',
                fontSize: '13.5px',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            >
              <i className={`fas ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Quick statement download shortcut */}
          <button
            onClick={generatePDFStatement}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px dashed rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#10b981',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'left',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            <i className="fas fa-file-invoice" />
            <span>Generate Statement</span>
          </button>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Profile Verification Notice */}
              {data.status === 'Pending' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '18px' }} />
                  <div style={{ fontSize: '13px', color: '#f59e0b' }}>
                    <strong>प्रलेखन सत्यापन लंबित (KYC Verification Pending):</strong> आपका पार्टनर खाता वर्तमान में सत्यापन के अधीन है। एडमिन द्वारा अनुमोदन के बाद आपके खाते से सेल्स ट्रैक होना शुरू हो जाएगा।
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Total Clicks (क्लिक)', val: data.totalClicks, color: '#6366f1', icon: 'fa-mouse-pointer' },
                  { label: 'Total Leads (लीड्स)', val: data.totalLeads, color: '#f59e0b', icon: 'fa-user-plus' },
                  { label: 'Total Sales (बिक्री)', val: data.totalSales, color: '#10b981', icon: 'fa-shopping-cart' },
                  { label: 'Lifetime Revenue Generated', val: `₹${data.totalRevenueGenerated.toLocaleString('en-IN')}`, color: '#ec4899', icon: 'fa-chart-line' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '24px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{s.val}</span>
                    <div style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '28px', color: `${s.color}15` }}>
                      <i className={`fas ${s.icon}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Wallet Earnings Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Pending Commission (लंबित)', val: `₹${data.pendingCommission.toLocaleString('en-IN')}`, color: '#f59e0b' },
                  { label: 'Approved Wallet Balance', val: `₹${data.walletBalance.toLocaleString('en-IN')}`, color: '#10b981' },
                  { label: 'Paid Commission (भुगतान)', val: `₹${data.paidCommission.toLocaleString('en-IN')}`, color: '#6366f1' },
                  { label: 'Lifetime Earnings', val: `₹${data.totalLifetimeEarnings.toLocaleString('en-IN')}`, color: '#38bdf8' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px',
                    borderRadius: '16px',
                    borderLeft: `4px solid ${s.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
                    <span style={{ fontSize: '20px', fontWeight: 800 }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Slab Progress Tracker (Visual Performance Tracker) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '28px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>📊 Performance Slab Tracker (कमीशन स्लैब प्रोग्रेस)</h3>
                    <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                      Current Month Sales (Base Value): <strong>₹{data.currentMonthBaseValue.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: '#ef444415', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      Current Slab: {data.currentSlab}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '12px', background: '#1e293b', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${targetPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)', borderRadius: '20px', transition: 'width 0.5s ease-in-out' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                  <span>₹0 (15% Slab)</span>
                  <span>₹1,00,000 (18% Slab)</span>
                  <span>₹2,00,000 (20% Slab)</span>
                  <span>₹5,00,000+ (25% Slab)</span>
                </div>

                {data.remainingTarget > 0 ? (
                  <div style={{ fontSize: '13px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    🎯 अगला स्लैब <strong>{data.nextSlab}</strong> हासिल करने के लिए <strong>₹{data.remainingTarget.toLocaleString('en-IN')}</strong> की अतिरिक्त सेल्स आवश्यक है।
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    🎉 बधाई हो! आपने इस महीने का अधिकतम कमीशन स्लैब (25%) प्राप्त कर लिया है!
                  </div>
                )}
              </div>

              {/* Referral Links Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* General Link Copy */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>🔗 General Referral Link (मुख्य रेफरल लिंक)</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      style={{
                        background: '#080c1a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                        padding: '10px 12px',
                        fontSize: '13px',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(referralLink)}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Copy Link
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={shareReferralOnWhatsApp}
                      style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: '16px' }} />
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Specific Link Generator */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>🛠️ Custom Page Link Generator (पेज-विशिष्ट रेफरल)</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>वेबसाइट का कोई भी विशिष्ट सेवा पृष्ठ लिंक यहाँ दर्ज करें:</span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customPageUrl}
                      onChange={e => setCustomPageUrl(e.target.value)}
                      placeholder="https://thedesiandaz.com/advertise"
                      style={{
                        background: '#080c1a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                        padding: '8px 12px',
                        fontSize: '13px',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={generateCustomLink}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Generate
                    </button>
                  </div>

                  {generatedCustomLink && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {generatedCustomLink}
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCustomLink)}
                        style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, fontSize: '12px', cursor: 'pointer', padding: '4px' }}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SALES HISTORY */}
          {activeSubTab === 'sales' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '20px',
              padding: '28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>🛍️ Referred Sales History (कमीशन बिक्री विवरण)</h2>
                
                {/* Sales Filters */}
                <div style={{ display: 'flex', gap: '6px', background: '#090d16', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSalesFilter(f.id as any)}
                      style={{
                        background: salesFilter === f.id ? '#1e293b' : 'transparent',
                        color: salesFilter === f.id ? '#fff' : '#64748b',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  <i className="fas fa-shopping-bag" style={{ fontSize: '40px', color: '#1e293b', marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>कोई सेल रिकॉर्ड नहीं मिली</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>आपके रेफरल लिंक से अभी तक कोई खरीद पूरी नहीं हुई है।</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                        <th style={{ padding: '12px 10px' }}>Purchase Date</th>
                        <th style={{ padding: '12px 10px' }}>Customer</th>
                        <th style={{ padding: '12px 10px' }}>Package Specs</th>
                        <th style={{ padding: '12px 10px' }}>Base Value</th>
                        <th style={{ padding: '12px 10px' }}>GST (18%)</th>
                        <th style={{ padding: '12px 10px' }}>Total Paid</th>
                        <th style={{ padding: '12px 10px' }}>Commission</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 10px', color: '#94a3b8' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 600 }}>{s.customerName}</td>
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                              {s.packageName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px' }}>₹{s.baseValue.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', color: '#64748b' }}>₹{s.gstAmount.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 700 }}>₹{s.totalPaid.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', color: '#10b981', fontWeight: 800 }}>₹{s.commissionEarned.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                            <span style={{
                              background: s.commissionStatus === 'Paid' ? '#10b98115' : s.commissionStatus === 'Approved' ? '#3b82f615' : s.commissionStatus === 'Reversed' ? '#ef444415' : '#f59e0b15',
                              color: s.commissionStatus === 'Paid' ? '#10b981' : s.commissionStatus === 'Approved' ? '#3b82f6' : s.commissionStatus === 'Reversed' ? '#ef4444' : '#f59e0b',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}>
                              {s.commissionStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: WALLET AND PAYOUTS */}
          {activeSubTab === 'wallet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Wallet Ledger and Payout cycle card */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Balance & Info */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>💳 Withdrawables Wallet Balance</h3>
                    <p style={{ fontSize: '32px', fontWeight: 900, color: '#10b981', margin: '12px 0' }}>
                      ₹{data.walletBalance.toLocaleString('en-IN')}
                    </p>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      *न्यूनतम भुगतान सीमा (Minimum Payout Threshold): <strong>₹500</strong>
                    </span>
                  </div>

                  {data.walletBalance < 500 && (
                    <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b30', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#f59e0b' }}>
                      ℹ️ आपका वॉलेट बैलेंस भुगतान सीमा से कम है। राशि स्वतः अगले महीने में कैरी फॉरवर्ड हो जाएगी।
                    </div>
                  )}
                </div>

                {/* Payout cycle explanation */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#94a3b8'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0 }}>📅 Monthly Payout Cycle</h3>
                  <p>• भुगतान हर महीने की <strong>1 तारीख से 7 तारीख</strong> के बीच जारी किया जाता है।</p>
                  <p>• केवल <strong>Approved</strong> कमीशन ही वॉलेट में जुड़ता है और भुगतान के लिए योग्य होता है।</p>
                  <p>• भुगतान सीधे आपके पंजीकृत बैंक खाते या यूपीआई आईडी में भेजा जाएगा।</p>
                </div>

              </div>

              {/* Transactions Log */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>📝 Wallet Ledger Transactions (लेनदेन इतिहास)</h3>
                
                {data.transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    कोई लेन-देन नहीं मिला।
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ padding: '10px' }}>Date</th>
                          <th style={{ padding: '10px' }}>Type</th>
                          <th style={{ padding: '10px' }}>Description</th>
                          <th style={{ padding: '10px' }}>Amount</th>
                          <th style={{ padding: '10px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((t: any) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '12px 10px', color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                background: t.type === 'Credit' ? '#10b98115' : t.type === 'Debit' ? '#ef444415' : '#f59e0b15',
                                color: t.type === 'Credit' ? '#10b981' : t.type === 'Debit' ? '#ef4444' : '#f59e0b',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}>
                                {t.type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px' }}>{t.description}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 700 }}>
                              {t.type === 'Credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ color: t.status === 'Paid' || t.status === 'Approved' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: MARKETING MATERIALS */}
          {activeSubTab === 'marketing' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '20px',
              padding: '28px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px' }}>📁 Affiliate Marketing Assets Library (मार्केटिंग सामग्रियां)</h2>
              
              {marketing.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                  <i className="fas fa-folder-open" style={{ fontSize: '36px', color: '#1e293b', marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>मार्केटिंग रिसोर्स लाइब्रेरी अभी खाली है। एडमिन द्वारा जल्द ही पोस्टर्स और बैनर्स अपलोड किए जाएंगे।</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {marketing.map((m: any) => (
                    <div key={m.id} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ height: '140px', background: '#080c16', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontSize: '32px' }}>
                        <i className={m.type === 'PDF' ? 'fas fa-file-pdf' : m.type === 'Video' ? 'fas fa-video' : 'fas fa-image'} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>{m.type}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0', color: '#fff' }}>{m.title}</h4>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{m.description}</p>
                      </div>
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginTop: 'auto'
                        }}
                      >
                        Download Material
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: LEADERBOARD */}
          {activeSubTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Leaderboard rewards card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '28px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>🏆 Affiliate Leaderboard Rewards (पार्टनर प्रोत्साहन इनाम)</h3>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', maxWidth: '600px' }}>
                    हर महीने, तिमाही और वर्ष में सर्वाधिक बिक्री जनरेट करने वाले टॉप परफॉर्मर्स को अतिरिक्त नकद बोनस इनाम दिया जाएगा!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: '#00000040', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#a5b4fc', display: 'block' }}>Monthly Top</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>₹5,000 Bonus</span>
                  </div>
                  <div style={{ background: '#00000040', padding: '10px 16px', borderRadius: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#a5b4fc', display: 'block' }}>Quarterly Top</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>₹15,000 Bonus</span>
                  </div>
                </div>
              </div>

              {/* Ranks list */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Top Performing Affiliate Partners</h3>
                
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                    लीडरबोर्ड डेटा अभी उपलब्ध नहीं है।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {leaderboard.map((item, idx) => (
                      <div key={item.id} style={{
                        background: item.id === affiliateId ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: item.id === affiliateId ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid rgba(255, 255, 255, 0.04)',
                        padding: '14px 20px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : 'transparent',
                            color: idx < 3 ? '#000' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '12px'
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{item.fullName}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>({item.affiliateCode})</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Sales Generated</span>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#10b981' }}>
                              ₹{item.totalSalesValue.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </section>

      </div>

    </div>
  );
}
