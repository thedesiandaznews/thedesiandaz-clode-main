/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { getAffiliateDashboardData, getMarketingMaterials, getAffiliateLeaderboard } from '@/actions/affiliate';
import styles from '../affiliates.module.css';

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
    <div className={styles.dbWrapper}>
      
      {/* Top Navbar */}
      <nav className={styles.dbNavbar}>
        <div className={styles.dbNavbarInner}>
          <div className={styles.dbNavBrand}>
            <span className={styles.dbBrandTag}>AFFILIATE PARTNER</span>
            <span className={styles.dbBrandTitle}>TDA DASHBOARD</span>
          </div>

          <div className={styles.dbNavUser}>
            <div className={styles.dbUserInfo}>
              <span className={styles.dbUserTitle}>{data.fullName}</span>
              <span className={styles.dbUserSub}>ID: {data.affiliateCode}</span>
            </div>
            <button onClick={handleLogout} className={styles.dbLogoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className={styles.dbContainer}>
        
        {/* SIDEBAR NAVIGATION */}
        <aside className={styles.dbSidebar}>
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
              className={`${styles.dbSidebarBtn} ${activeSubTab === tab.id ? styles.dbSidebarBtnActive : ''}`}
            >
              <i className={`fas ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Quick statement download shortcut */}
          <button
            onClick={generatePDFStatement}
            className={styles.dbStatementBtn}
          >
            <i className="fas fa-file-invoice" />
            <span>Generate Statement</span>
          </button>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <section className={styles.dbViewport}>
          
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className={styles.dbOverview}>
              
              {/* Profile Verification Notice */}
              {data.status === 'Pending' && (
                <div className={styles.dbNotice}>
                  <i className={`fas fa-exclamation-triangle ${styles.dbNoticeIcon}`} />
                  <div className={styles.dbNoticeText}>
                    <strong>प्रलेखन सत्यापन लंबित (KYC Verification Pending):</strong> आपका पार्टनर खाता वर्तमान में सत्यापन के अधीन है। एडमिन द्वारा अनुमोदन के बाद आपके खाते से सेल्स ट्रैक होना शुरू हो जाएगा।
                  </div>
                </div>
              )}

              {/* Statistics Grid */}
              <div className={styles.dbStatsGrid}>
                {[
                  { label: 'Total Clicks (क्लिक)', val: data.totalClicks, color: '#4f46e5', icon: 'fa-mouse-pointer' },
                  { label: 'Total Leads (लीड्स)', val: data.totalLeads, color: '#d97706', icon: 'fa-user-plus' },
                  { label: 'Total Sales (बिक्री)', val: data.totalSales, color: '#16a34a', icon: 'fa-shopping-cart' },
                  { label: 'Lifetime Revenue Generated', val: `₹${data.totalRevenueGenerated.toLocaleString('en-IN')}`, color: '#db2777', icon: 'fa-chart-line' }
                ].map((s, idx) => (
                  <div key={idx} className={styles.dbStatsCard}>
                    <span className={styles.dbStatsCardLabel}>{s.label}</span>
                    <span className={styles.dbStatsCardVal}>{s.val}</span>
                    <div className={styles.dbStatsCardIcon} style={{ color: s.color }}>
                      <i className={`fas ${s.icon}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Wallet Earnings Summary */}
              <div className={styles.dbWalletGrid}>
                {[
                  { label: 'Pending Commission (लंबित)', val: `₹${data.pendingCommission.toLocaleString('en-IN')}`, color: '#FF6B00' },
                  { label: 'Approved Wallet Balance', val: `₹${data.walletBalance.toLocaleString('en-IN')}`, color: '#1B8A3C' },
                  { label: 'Paid Commission (भुगतान)', val: `₹${data.paidCommission.toLocaleString('en-IN')}`, color: '#CC2200' },
                  { label: 'Lifetime Earnings', val: `₹${data.totalLifetimeEarnings.toLocaleString('en-IN')}`, color: '#0284c7' }
                ].map((s, idx) => (
                  <div key={idx} className={styles.dbWalletCard} style={{ borderLeft: `4px solid ${s.color}` }}>
                    <span className={styles.dbWalletCardLabel}>{s.label}</span>
                    <span className={styles.dbWalletCardVal}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Slab Progress Tracker (Visual Performance Tracker) */}
              <div className={styles.dbSlabCard}>
                <div className={styles.dbSlabHeader}>
                  <div>
                    <h3 className={styles.dbSlabTitle}>📊 Performance Slab Tracker (कमीशन स्लैब प्रोग्रेस)</h3>
                    <span className={styles.dbSlabSubtitle}>
                      Current Month Sales (Base Value): <strong>₹{data.currentMonthBaseValue.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                  <div>
                    <span className={styles.dbSlabBadge}>
                      Current Slab: {data.currentSlab}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={styles.dbProgressBarTrack}>
                  <div className={styles.dbProgressBarFill} style={{ width: `${targetPercent}%` }} />
                </div>

                <div className={styles.dbSlabLegend}>
                  <span>₹0 (15% Slab)</span>
                  <span>₹1,00,000 (18% Slab)</span>
                  <span>₹2,00,000 (20% Slab)</span>
                  <span>₹5,00,000+ (25% Slab)</span>
                </div>

                {data.remainingTarget > 0 ? (
                  <div className={`${styles.dbSlabAlert} ${styles.dbSlabAlertPending}`}>
                    🎯 अगला स्लैब <strong>{data.nextSlab}</strong> हासिल करने के लिए <strong>₹{data.remainingTarget.toLocaleString('en-IN')}</strong> की अतिरिक्त सेल्स आवश्यक है।
                  </div>
                ) : (
                  <div className={`${styles.dbSlabAlert} ${styles.dbSlabAlertSuccess}`}>
                    🎉 बधाई हो! आपने इस महीने का अधिकतम कमीशन स्लैब (25%) प्राप्त कर लिया है!
                  </div>
                )}
              </div>

              {/* Referral Links Section */}
              <div className={styles.dbLinkGrid}>
                
                {/* General Link Copy */}
                <div className={styles.dbLinkCard}>
                  <h3 className={styles.dbLinkTitle}>🔗 General Referral Link (मुख्य रेफरल लिंक)</h3>
                  <div className={styles.dbInputRow}>
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className={styles.dbLinkInput}
                    />
                    <button
                      onClick={() => copyToClipboard(referralLink)}
                      className={styles.dbActionBtn}
                    >
                      Copy Link
                    </button>
                  </div>
                  <div className={styles.dbInputRow} style={{ marginTop: '4px' }}>
                    <button
                      onClick={shareReferralOnWhatsApp}
                      className={styles.dbWhatsappBtn}
                    >
                      <i className="fab fa-whatsapp" style={{ fontSize: '16px' }} />
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Specific Link Generator */}
                <div className={styles.dbLinkCard}>
                  <h3 className={styles.dbLinkTitle}>🛠️ Custom Page Link Generator (पेज-विशिष्ट रेफरल)</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>वेबसाइट का कोई भी विशिष्ट सेवा पृष्ठ लिंक यहाँ दर्ज करें:</span>
                  
                  <div className={styles.dbInputRow}>
                    <input
                      type="text"
                      value={customPageUrl}
                      onChange={e => setCustomPageUrl(e.target.value)}
                      placeholder="https://thedesiandaz.com/advertise"
                      className={styles.dbLinkInput}
                    />
                    <button
                      onClick={generateCustomLink}
                      className={styles.dbActionBtn}
                    >
                      Generate
                    </button>
                  </div>

                  {generatedCustomLink && (
                    <div className={styles.dbCustomLinkBox}>
                      <span className={styles.dbCustomLinkLabel}>
                        {generatedCustomLink}
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedCustomLink)}
                        className={styles.dbCopyTextBtn}
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
            <div className={styles.dbPanelCard}>
              <div className={styles.dbPanelHeader}>
                <h2 className={styles.dbPanelTitle}>🛍️ Referred Sales History (कमीशन बिक्री विवरण)</h2>
                
                {/* Sales Filters */}
                <div className={styles.dbFilterRow}>
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
                      className={`${styles.dbFilterBtn} ${salesFilter === f.id ? styles.dbFilterBtnActive : ''}`}
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
                <div className={styles.dbTableWrapper}>
                  <table className={styles.dbTable}>
                    <thead>
                      <tr>
                        <th>Purchase Date</th>
                        <th>Customer</th>
                        <th>Package Specs</th>
                        <th>Base Value</th>
                        <th>GST (18%)</th>
                        <th>Total Paid</th>
                        <th>Commission</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((s: any) => (
                        <tr key={s.id}>
                          <td data-label="Purchase Date" style={{ color: '#64748b' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                          <td data-label="Customer" style={{ fontWeight: 700, color: '#0f172a' }}>{s.customerName}</td>
                          <td data-label="Package Specs">
                            <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                              {s.packageName}
                            </span>
                          </td>
                          <td data-label="Base Value">₹{s.baseValue.toLocaleString('en-IN')}</td>
                          <td data-label="GST (18%)" style={{ color: '#64748b' }}>₹{s.gstAmount.toLocaleString('en-IN')}</td>
                          <td data-label="Total Paid" style={{ fontWeight: 700 }}>₹{s.totalPaid.toLocaleString('en-IN')}</td>
                          <td data-label="Commission" style={{ color: '#16a34a', fontWeight: 800 }}>₹{s.commissionEarned.toLocaleString('en-IN')}</td>
                          <td data-label="Status" style={{ textAlign: 'center' }}>
                            <span className={`${styles.dbStatusBadge} ${s.commissionStatus === 'Paid' ? styles.dbStatusPaid : s.commissionStatus === 'Approved' ? styles.dbStatusApproved : s.commissionStatus === 'Reversed' ? styles.dbStatusReversed : styles.dbStatusPending}`}>
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
              <div className={styles.dbLinkGrid}>
                
                {/* Balance & Info */}
                <div className={styles.dbLinkCard}>
                  <div>
                    <h3 className={styles.dbLinkTitle}>💳 Withdrawables Wallet Balance</h3>
                    <p style={{ fontSize: '32px', fontWeight: 900, color: '#16a34a', margin: '12px 0' }}>
                      ₹{data.walletBalance.toLocaleString('en-IN')}
                    </p>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      *न्यूनतम भुगतान सीमा (Minimum Payout Threshold): <strong>₹1500</strong>
                    </span>
                  </div>

                  {data.walletBalance < 1500 && (
                    <div className={`${styles.dbSlabAlert} ${styles.dbSlabAlertPending}`}>
                      ℹ️ आपका वॉलेट बैलेंस भुगतान सीमा से कम है। राशि स्वतः अगले महीने में कैरी फॉरवर्ड हो जाएगी।
                    </div>
                  )}
                </div>

                {/* Payout cycle explanation */}
                <div className={styles.dbLinkCard}>
                  <h3 className={styles.dbLinkTitle}>📅 Monthly Payout Cycle</h3>
                  <p style={{ margin: 0 }}>• भुगतान हर महीने की <strong>1 तारीख से 7 तारीख</strong> के बीच जारी किया जाता है।</p>
                  <p style={{ margin: 0 }}>• केवल <strong>Approved</strong> कमीशन ही वॉलेट में जुड़ता है और भुगतान के लिए योग्य होता है।</p>
                  <p style={{ margin: 0 }}>• भुगतान सीधे आपके पंजीकृत बैंक खाते या यूपीआई आईडी में भेजा जाएगा।</p>
                </div>

              </div>

              {/* Transactions Log */}
              <div className={styles.dbPanelCard}>
                <h3 className={styles.dbPanelTitle} style={{ marginBottom: '20px' }}>📝 Wallet Ledger Transactions (लेनदेन इतिहास)</h3>
                
                {data.transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                    कोई लेन-देन नहीं मिला।
                  </div>
                ) : (
                  <div className={styles.dbTableWrapper}>
                    <table className={styles.dbTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.transactions.map((t: any) => (
                          <tr key={t.id}>
                            <td data-label="Date" style={{ color: '#64748b' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                            <td data-label="Type">
                              <span className={`${styles.dbStatusBadge} ${t.type === 'Credit' ? styles.dbStatusPaid : styles.dbStatusReversed}`}>
                                {t.type}
                              </span>
                            </td>
                            <td data-label="Description" style={{ color: '#2A343D' }}>{t.description}</td>
                            <td data-label="Amount" style={{ fontWeight: 700, color: '#0f172a' }}>
                              {t.type === 'Credit' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                            </td>
                            <td data-label="Status">
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
            <div className={styles.dbPanelCard}>
              <h2 className={styles.dbPanelTitle} style={{ marginBottom: '24px' }}>📁 Affiliate Marketing Assets Library (मार्केटिंग सामग्रियां)</h2>
              
              {marketing.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                  <i className="fas fa-folder-open" style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>मार्केटिंग रिसोर्स लाइब्रेरी अभी खाली है।</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>एडमिन द्वारा जल्द ही पोस्टर्स और बैनर्स अपलोड किए जाएंगे।</p>
                </div>
              ) : (
                <div className={styles.dbMarketingGrid}>
                  {marketing.map((m: any) => (
                    <div key={m.id} className={styles.dbMarketingCard}>
                      <div className={styles.dbMarketingVisual}>
                        <i className={m.type === 'PDF' ? 'fas fa-file-pdf' : m.type === 'Video' ? 'fas fa-video' : 'fas fa-image'} />
                      </div>
                      <div>
                        <span className={styles.dbMarketingType}>{m.type}</span>
                        <h4 className={styles.dbMarketingTitle}>{m.title}</h4>
                        <p className={styles.dbMarketingDesc}>{m.description}</p>
                      </div>
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.dbMarketingDownloadBtn}
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
              <div className={styles.dbLeaderboardRewardCard}>
                <div>
                  <h3 className={styles.dbRewardTitle}>🏆 Affiliate Leaderboard Rewards (पार्टनर प्रोत्साहन इनाम)</h3>
                  <p className={styles.dbRewardText}>
                    हर महीने, तिमाही और वर्ष में सर्वाधिक बिक्री जनरेट करने वाले टॉप परफॉर्मर्स को अतिरिक्त नकद बोनस इनाम दिया जाएगा!
                  </p>
                </div>
                <div className={styles.dbRewardBadgeGroup}>
                  <div className={styles.dbRewardBadge}>
                    <span className={styles.dbRewardBadgeLabel}>Monthly Top</span>
                    <span className={styles.dbRewardBadgeVal}>₹5,000 Bonus</span>
                  </div>
                  <div className={styles.dbRewardBadge}>
                    <span className={styles.dbRewardBadgeLabel}>Quarterly Top</span>
                    <span className={styles.dbRewardBadgeVal}>₹15,000 Bonus</span>
                  </div>
                </div>
              </div>

              {/* Ranks list */}
              <div className={styles.dbPanelCard}>
                <h3 className={styles.dbPanelTitle} style={{ marginBottom: '20px' }}>Top Performing Affiliate Partners</h3>
                
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                    लीडरबोर्ड डेटा अभी उपलब्ध नहीं है।
                  </div>
                ) : (
                  <div className={styles.dbLeaderboardList}>
                    {leaderboard.map((item, idx) => (
                      <div key={item.id} className={`${styles.dbLeaderboardRow} ${item.id === affiliateId ? styles.dbLeaderboardRowSelf : styles.dbLeaderboardRowOther}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className={styles.dbRankCircle} style={{
                            background: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : 'transparent',
                            color: idx < 3 ? '#000' : '#64748b'
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
