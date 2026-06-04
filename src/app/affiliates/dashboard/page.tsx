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
        window.location.href = '/affiliates';
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
      window.location.href = '/affiliates';
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
      <div style={{ background: '#F5F7FA', color: '#2A343D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', fontFamily: "'Munshi Devanagari Semibold', sans-serif" }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#CC2200' }} />
        <span style={{ fontWeight: 600 }}>पार्टनर डैशबोर्ड लोड हो रहा है...</span>
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
    const printContent = `
      <html>
      <head>
        <title>TDA Affiliate Statement - ${data.affiliateCode}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f4f4f4; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #CC2200; padding-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>THE DESI ANDAZ — AFFILIATE STATEMENT</h2>
          <p>Partner Name: <strong>${data.fullName}</strong> | Code: <strong>${data.affiliateCode}</strong></p>
          <p>Generated on: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <h3>Summary</h3>
        <p>Wallet Balance: <strong>INR ${data.walletBalance}</strong> | Lifetime Earnings: <strong>INR ${data.totalLifetimeEarnings}</strong></p>
        
        <h3>Sales Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Package</th>
              <th>Base Value</th>
              <th>GST (18%)</th>
              <th>Total Paid</th>
              <th>Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(data.salesList || []).map((s: any) => `
              <tr>
                <td>${new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                <td>${s.customerName}</td>
                <td>${s.packageName}</td>
                <td>INR ${s.baseValue}</td>
                <td>INR ${s.gstAmount}</td>
                <td>INR ${s.totalPaid}</td>
                <td>INR ${s.commissionEarned}</td>
                <td>${s.commissionStatus}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  const referralLink = `https://thedesiandaz.com/?ref=${data.affiliateCode}`;
  
  // Progress Bar percentage calculate
  const targetPercent = Math.min(100, Math.floor((data.currentMonthBaseValue / (data.remainingTarget + data.currentMonthBaseValue)) * 100));

  return (
    <div style={{ background: '#F5F7FA', color: '#2A343D', minHeight: '100vh', fontFamily: "'Munshi Devanagari Semibold', 'Mukta', 'Poppins', sans-serif" }}>
      
      {/* Top Navbar */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #CC2200 0%, #B31E00 100%)', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>AFFILIATE PARTNER</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>TDA DASHBOARD</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{data.fullName}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ID: {data.affiliateCode}</span>
            </div>
            <button onClick={handleLogout} style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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
                background: activeSubTab === tab.id ? 'linear-gradient(135deg, #CC2200 0%, #B31E00 100%)' : 'transparent',
                color: activeSubTab === tab.id ? '#fff' : '#475569',
                fontSize: '13.5px',
                fontWeight: 700,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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
              border: '1px dashed #cbd5e1',
              background: '#f0fdf4',
              color: '#16a34a',
              fontSize: '13px',
              fontWeight: 700,
              textAlign: 'left',
              cursor: 'pointer',
              marginTop: '20px',
              transition: 'all 0.2s ease'
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
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <i className="fas fa-exclamation-triangle" style={{ color: '#d97706', fontSize: '18px' }} />
                  <div style={{ fontSize: '13.5px', color: '#b45309', lineHeight: '1.5' }}>
                    <strong>प्रलेखन सत्यापन लंबित (KYC Verification Pending):</strong> आपका पार्टनर खाता वर्तमान में सत्यापन के अधीन है। एडमिन द्वारा अनुमोदन के बाद आपके खाते से सेल्स ट्रैक होना शुरू हो जाएगा।
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Total Clicks (क्लिक)', val: data.totalClicks, color: '#4f46e5', icon: 'fa-mouse-pointer' },
                  { label: 'Total Leads (लीड्स)', val: data.totalLeads, color: '#d97706', icon: 'fa-user-plus' },
                  { label: 'Total Sales (बिक्री)', val: data.totalSales, color: '#16a34a', icon: 'fa-shopping-cart' },
                  { label: 'Lifetime Revenue Generated', val: `₹${data.totalRevenueGenerated.toLocaleString('en-IN')}`, color: '#db2777', icon: 'fa-chart-line' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                  }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</span>
                    <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{s.val}</span>
                    <div style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '28px', color: s.color, opacity: 0.12 }}>
                      <i className={`fas ${s.icon}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Wallet Earnings Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'Pending Commission (लंबित)', val: `₹${data.pendingCommission.toLocaleString('en-IN')}`, color: '#FF6B00' },
                  { label: 'Approved Wallet Balance', val: `₹${data.walletBalance.toLocaleString('en-IN')}`, color: '#1B8A3C' },
                  { label: 'Paid Commission (भुगतान)', val: `₹${data.paidCommission.toLocaleString('en-IN')}`, color: '#CC2200' },
                  { label: 'Lifetime Earnings', val: `₹${data.totalLifetimeEarnings.toLocaleString('en-IN')}`, color: '#0284c7' }
                ].map((s, idx) => (
                  <div key={idx} style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '20px',
                    borderRadius: '16px',
                    borderLeft: `4px solid ${s.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                  }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</span>
                    <span style={{ fontSize: '21px', fontWeight: 800, color: '#0f172a' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Slab Progress Tracker (Visual Performance Tracker) */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '28px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>📊 Performance Slab Tracker (कमीशन स्लैब प्रोग्रेस)</h3>
                    <span style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px', display: 'inline-block' }}>
                      Current Month Sales (Base Value): <strong>₹{data.currentMonthBaseValue.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: 'rgba(204, 34, 0, 0.08)', color: '#CC2200', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                      Current Slab: {data.currentSlab}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${targetPercent}%`, height: '100%', background: 'linear-gradient(90deg, #CC2200 0%, #FF6B00 100%)', borderRadius: '20px', transition: 'width 0.5s ease-in-out' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                  <span>₹0 (15% Slab)</span>
                  <span>₹1,00,000 (18% Slab)</span>
                  <span>₹2,00,000 (20% Slab)</span>
                  <span>₹5,00,000+ (25% Slab)</span>
                </div>

                {data.remainingTarget > 0 ? (
                  <div style={{ fontSize: '13px', background: '#FFF7ED', color: '#5C2C00', padding: '12px 16px', borderRadius: '8px', border: '1px solid #FFDBB5', lineHeight: '1.5' }}>
                    🎯 अगला स्लैब <strong>{data.nextSlab}</strong> हासिल करने के लिए <strong>₹{data.remainingTarget.toLocaleString('en-IN')}</strong> की अतिरिक्त सेल्स आवश्यक है।
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#065F46', background: '#ECFDF5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #A7F3D0', lineHeight: '1.5' }}>
                    🎉 बधाई हो! आपने इस महीने का अधिकतम कमीशन स्लैब (25%) प्राप्त कर लिया है!
                  </div>
                )}
              </div>

              {/* Referral Links Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* General Link Copy */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>🔗 General Referral Link (मुख्य रेफरल लिंक)</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        padding: '10px 12px',
                        fontSize: '13px',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(referralLink)}
                      style={{ background: '#CC2200', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
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
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>🛠️ Custom Page Link Generator (पेज-विशिष्ट रेफरल)</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>वेबसाइट का कोई भी विशिष्ट सेवा पृष्ठ लिंक यहाँ दर्ज करें:</span>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customPageUrl}
                      onChange={e => setCustomPageUrl(e.target.value)}
                      placeholder="https://thedesiandaz.com/advertise"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        padding: '8px 12px',
                        fontSize: '13px',
                        flex: 1,
                        outline: 'none'
                      }}
                    />
                    <button
                      onClick={generateCustomLink}
                      style={{ background: '#CC2200', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Generate
                    </button>
                  </div>

                  {generatedCustomLink && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', background: '#f1f5f9', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '11.5px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 600 }}>
                        {generatedCustomLink}
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCustomLink)}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, fontSize: '12px', cursor: 'pointer', padding: '4px' }}
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
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>🛍️ Referred Sales History (कमीशन बिक्री विवरण)</h2>
                
                {/* Sales Filters */}
                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                        background: salesFilter === f.id ? '#ffffff' : 'transparent',
                        color: salesFilter === f.id ? '#CC2200' : '#475569',
                        boxShadow: salesFilter === f.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
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
                  <i className="fas fa-shopping-bag" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>कोई सेल रिकॉर्ड नहीं मिली</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>आपके रेफरल लिंक से अभी तक कोई खरीद पूरी नहीं हुई है।</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Purchase Date</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Customer</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Package Specs</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Base Value</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>GST (18%)</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Total Paid</th>
                        <th style={{ padding: '12px 10px', fontWeight: 700 }}>Commission</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((s: any) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 10px', color: '#64748b' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 700, color: '#0f172a' }}>{s.customerName}</td>
                          <td style={{ padding: '14px 10px' }}>
                            <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                              {s.packageName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 10px', color: '#0f172a' }}>₹{s.baseValue.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', color: '#64748b' }}>₹{s.gstAmount.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', fontWeight: 700, color: '#0f172a' }}>₹{s.totalPaid.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', color: '#16a34a', fontWeight: 800 }}>₹{s.commissionEarned.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                            <span style={{
                              background: s.commissionStatus === 'Paid' ? 'rgba(27, 138, 60, 0.1)' : s.commissionStatus === 'Approved' ? 'rgba(37, 99, 235, 0.1)' : s.commissionStatus === 'Reversed' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                              color: s.commissionStatus === 'Paid' ? '#1B8A3C' : s.commissionStatus === 'Approved' ? '#2563EB' : s.commissionStatus === 'Reversed' ? '#DC2626' : '#D97706',
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
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>💳 Withdrawables Wallet Balance</h3>
                    <p style={{ fontSize: '32px', fontWeight: 900, color: '#16a34a', margin: '12px 0' }}>
                      ₹{data.walletBalance.toLocaleString('en-IN')}
                    </p>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      *न्यूनतम भुगतान सीमा (Minimum Payout Threshold): <strong>₹1500</strong>
                    </span>
                  </div>

                  {data.walletBalance < 1500 && (
                    <div style={{ background: '#FFF7ED', border: '1px solid #FFDBB5', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#B45309', lineHeight: '1.5' }}>
                      ℹ️ आपका वॉलेट बैलेंस भुगतान सीमा से कम है। राशि स्वतः अगले महीने में कैरी फॉरवर्ड हो जाएगी।
                    </div>
                  )}
                </div>

                {/* Payout cycle explanation */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#475569',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>📅 Monthly Payout Cycle</h3>
                  <p style={{ margin: 0 }}>• भुगतान हर महीने की <strong>1 तारीख से 7 तारीख</strong> के बीच जारी किया जाता है।</p>
                  <p style={{ margin: 0 }}>• केवल <strong>Approved</strong> कमीशन ही वॉलेट में जुड़ता है और भुगतान के लिए योग्य होता है।</p>
                  <p style={{ margin: 0 }}>• भुगतान सीधे आपके पंजीकृत बैंक खाते या यूपीआई आईडी में भेजा जाएगा।</p>
                </div>

              </div>

              {/* Transactions Log */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>📝 Wallet Ledger Transactions (लेनदेन इतिहास)</h3>
                
                {data.transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    कोई लेन-देन नहीं मिला।
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px', fontWeight: 700 }}>Date</th>
                          <th style={{ padding: '10px', fontWeight: 700 }}>Type</th>
                          <th style={{ padding: '10px', fontWeight: 700 }}>Description</th>
                          <th style={{ padding: '10px', fontWeight: 700 }}>Amount</th>
                          <th style={{ padding: '10px', fontWeight: 700 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((t: any) => (
                          <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 10px', color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                background: t.type === 'Credit' ? 'rgba(27, 138, 60, 0.1)' : t.type === 'Debit' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                color: t.type === 'Credit' ? '#1B8A3C' : t.type === 'Debit' ? '#DC2626' : '#D97706',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}>
                                {t.type}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#2A343D' }}>{t.description}</td>
                            <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>
                              {t.type === 'Credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ color: t.status === 'Paid' || t.status === 'Approved' ? '#1B8A3C' : '#D97706', fontWeight: 700 }}>
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
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: '#0f172a' }}>📁 Affiliate Marketing Assets Library (मार्केटिंग सामग्रियां)</h2>
              
              {marketing.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                  <i className="fas fa-folder-open" style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>मार्केटिंग रिसोर्स लाइब्रेरी अभी खाली है।</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>एडमिन द्वारा जल्द ही पोस्टर्स और बैनर्स अपलोड किए जाएंगे।</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {marketing.map((m: any) => (
                    <div key={m.id} style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CC2200', fontSize: '32px' }}>
                        <i className={m.type === 'PDF' ? 'fas fa-file-pdf' : m.type === 'Video' ? 'fas fa-video' : 'fas fa-image'} />
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#FF6B00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.type}</span>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0', color: '#0f172a' }}>{m.title}</h4>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{m.description}</p>
                      </div>
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'linear-gradient(135deg, #CC2200 0%, #B31E00 100%)',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '8px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginTop: 'auto',
                          boxShadow: '0 2px 4px rgba(204, 34, 0, 0.15)'
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
                background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.08) 0%, rgba(204, 34, 0, 0.08) 100%)',
                border: '1px solid rgba(204, 34, 0, 0.15)',
                padding: '28px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#CC2200' }}>🏆 Affiliate Leaderboard Rewards (पार्टनर प्रोत्साहन इनाम)</h3>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '6px', maxWidth: '600px', lineHeight: '1.5' }}>
                    हर महीने, तिमाही और वर्ष में सर्वाधिक बिक्री जनरेट करने वाले टॉप परफॉर्मर्स को अतिरिक्त नकद बोनस इनाम दिया जाएगा!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(204, 34, 0, 0.15)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '11px', color: '#FF6B00', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Monthly Top</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px', display: 'inline-block' }}>₹5,000 Bonus</span>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(204, 34, 0, 0.15)', padding: '10px 16px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '11px', color: '#FF6B00', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Quarterly Top</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px', display: 'inline-block' }}>₹15,000 Bonus</span>
                  </div>
                </div>
              </div>

              {/* Ranks list */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>Top Performing Affiliate Partners</h3>
                
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                    लीडरबोर्ड डेटा अभी उपलब्ध नहीं है।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {leaderboard.map((item, idx) => (
                      <div key={item.id} style={{
                        background: item.id === affiliateId ? 'rgba(204, 34, 0, 0.04)' : '#f8fafc',
                        border: item.id === affiliateId ? '1px solid rgba(204, 34, 0, 0.2)' : '1px solid #e2e8f0',
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
                            <span style={{ fontWeight: 700, color: item.id === affiliateId ? '#CC2200' : '#0f172a' }}>{item.fullName}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>({item.affiliateCode})</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>Sales Generated</span>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B8A3C' }}>
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
