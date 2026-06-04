/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';
import {
  updateAffiliateStatus,
  updateAffiliateKYC,
  releasePayout,
  approveAffiliateCommissions,
  uploadMarketingMaterial
} from '@/actions/affiliate';

export default function AffiliatesClient({ initialList }: { initialList: any[] }) {
  const [affiliates, setAffiliates] = useState<any[]>(initialList);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  
  // Tab control inside admin panel: 'Partners' | 'Marketing'
  const [adminTab, setAdminTab] = useState<'Partners' | 'Marketing'>('Partners');

  // Payout Release Modal States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    referenceNumber: '',
    paymentMethod: 'UPI'
  });
  const [processingPayout, setProcessingPayout] = useState(false);

  // Marketing material Upload Form States
  const [marketingForm, setMarketingForm] = useState({
    title: '',
    type: 'Poster',
    fileUrl: '',
    description: ''
  });
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updateAffiliateStatus(id, status);
      if (res.success) {
        alert(`पार्टनर का स्टेटस सफलतापूर्वक अपडेट होकर '${status}' हो गया है!`);
        setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        if (selectedAffiliate && selectedAffiliate.id === id) {
          setSelectedAffiliate((prev: any) => ({ ...prev, status }));
        }
      } else {
        alert('अपडेट करने में विफल: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateKYC = async (id: string, verified: boolean) => {
    try {
      const res = await updateAffiliateKYC(id, verified);
      if (res.success) {
        alert(verified ? 'केवाईसी सफलतापूर्वक सत्यापित (KYC Verified)!' : 'केवाईसी सत्यापन हटाया गया!');
        setAffiliates(prev => prev.map(a => a.id === id ? { ...a, kycVerified: verified } : a));
        if (selectedAffiliate && selectedAffiliate.id === id) {
          setSelectedAffiliate((prev: any) => ({ ...prev, kycVerified: verified }));
        }
      } else {
        alert('अपडेट विफल: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveCommissions = async (id: string) => {
    if (!confirm('क्या आप इस पार्टनर के सभी लंबित (Pending) कमीशन को स्वीकृत (Approve) करना चाहते हैं?')) return;
    try {
      const res = await approveAffiliateCommissions(id);
      if (res.success) {
        alert('सभी लंबित कमीशन स्वीकृत कर दिए गए हैं और वे वॉलेट बैलेंस में शामिल हो गए हैं!');
        // Reload dashboard logic
        window.location.reload();
      } else {
        alert('कमीशन स्वीकृत करने में विफल: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleasePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate || !payoutForm.referenceNumber.trim()) return;

    setProcessingPayout(true);
    try {
      const res = await releasePayout({
        affiliateId: selectedAffiliate.id,
        amount: Number(payoutForm.amount),
        referenceNumber: payoutForm.referenceNumber.trim(),
        paymentMethod: payoutForm.paymentMethod
      });

      if (res.success) {
        alert('भुगतान सफलतापूर्वक जारी किया गया!');
        setShowPayoutModal(false);
        // Reset and update list state locally
        setAffiliates(prev => prev.map(a => {
          if (a.id === selectedAffiliate.id) {
            const updatedBalance = Math.max(0, a.walletBalance - payoutForm.amount);
            return { ...a, walletBalance: updatedBalance };
          }
          return a;
        }));
        setSelectedAffiliate((prev: any) => {
          if (prev) {
            const updatedBalance = Math.max(0, prev.walletBalance - payoutForm.amount);
            return { ...prev, walletBalance: updatedBalance };
          }
          return null;
        });
      } else {
        alert('भुगतान रिलीज विफल: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleUploadMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketingForm.title || !marketingForm.fileUrl) {
      alert('शीर्षक और फ़ाइल URL आवश्यक हैं!');
      return;
    }

    setUploadingMaterial(true);
    try {
      const res = await uploadMarketingMaterial(marketingForm);
      if (res.success) {
        alert('मार्केटिंग रिसोर्स सफलतापूर्वक लाइब्रेरी में जोड़ा गया!');
        setMarketingForm({ title: '', type: 'Poster', fileUrl: '', description: '' });
      } else {
        alert('अपलोड करने में विफल: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingMaterial(false);
    }
  };

  // Metrics calculations
  const totalPartners = affiliates.length;
  const activePartners = affiliates.filter(a => a.status === 'Approved').length;
  const pendingApprovals = affiliates.filter(a => a.status === 'Pending').length;
  const totalSalesValue = affiliates.reduce((sum, a) => sum + a.sales, 0);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-handshake" style={{ color: '#ef4444' }} />
            <span>Affiliate Partner Dashboard</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Manage affiliate partner registrations, review KYC verification documents, release payouts, and publish marketing creatives.
          </p>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total Partners', val: totalPartners, icon: 'fa-users', color: '#6366f1' },
          { label: 'Active Affiliates', val: activePartners, icon: 'fa-check-circle', color: '#10b981' },
          { label: 'Pending KYC/Approvals', val: pendingApprovals, icon: 'fa-clock', color: '#f59e0b' },
          { label: 'Total Affiliate Sales', val: totalSalesValue, icon: 'fa-shopping-bag', color: '#ec4899' }
        ].map((m, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{m.label}</span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '6px 0 0 0', color: '#0f172a' }}>{m.val}</h2>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${m.color}10`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className={`fas ${m.icon}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'Partners', label: 'Manage Partners (पार्टनर्स)', icon: 'fa-users' },
          { id: 'Marketing', label: 'Marketing Creatives Library', icon: 'fa-images' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setAdminTab(t.id as any)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: adminTab === t.id ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#f1f5f9',
              color: adminTab === t.id ? '#ffffff' : '#475569',
              boxShadow: adminTab === t.id ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
            }}
          >
            <i className={`fas ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* PARTNERS MANAGEMENT TAB */}
      {adminTab === 'Partners' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedAffiliate ? '1fr 380px' : '1fr', gap: '24px' }}>
          
          {/* List of Partners Grid */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>Affiliate Partners Registry</h3>
            
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '10px' }}>Code / Name</th>
                  <th style={{ padding: '10px' }}>Contact Info</th>
                  <th style={{ padding: '10px' }}>KYC State</th>
                  <th style={{ padding: '10px' }}>Performance</th>
                  <th style={{ padding: '10px' }}>Wallet Balance</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map(aff => (
                  <tr
                    key={aff.id}
                    onClick={() => setSelectedAffiliate(aff)}
                    style={{
                      background: selectedAffiliate?.id === aff.id ? '#f8fafc' : '#ffffff',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <td style={{ padding: '14px 10px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: '#4f46e5' }}>
                          {aff.fullName[0]}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{aff.fullName}</span>
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>{aff.affiliateCode}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 10px', color: '#334155' }}>
                      <div>{aff.email}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>{aff.mobile}</div>
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <span style={{
                        background: aff.kycVerified ? '#10b98115' : '#ef444415',
                        color: aff.kycVerified ? '#10b981' : '#ef4444',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {aff.kycVerified ? 'KYC Verified' : 'KYC Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', fontSize: '12px' }}>
                      <div>Clicks: <strong>{aff.clicks}</strong></div>
                      <div>Sales: <strong style={{ color: '#10b981' }}>{aff.sales}</strong></div>
                    </td>
                    <td style={{ padding: '14px 10px', fontWeight: 800, color: '#0f172a' }}>
                      ₹{aff.walletBalance.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 10px', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', textAlign: 'center' }}>
                      <span style={{
                        background: aff.status === 'Approved' ? '#10b98115' : aff.status === 'Suspended' ? '#ef444415' : '#f59e0b15',
                        color: aff.status === 'Approved' ? '#10b981' : aff.status === 'Suspended' ? '#ef4444' : '#f59e0b',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700
                      }}>
                        {aff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed Side Panel */}
          {selectedAffiliate && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Partner Detailed Audit</h3>
                <button onClick={() => setSelectedAffiliate(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* Basic Profile */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img
                  src={selectedAffiliate.photoUrl || 'https://picsum.photos/100/100?random=11'}
                  alt={selectedAffiliate.fullName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>{selectedAffiliate.fullName}</h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>DOB: {selectedAffiliate.dob}</span>
                </div>
              </div>

              {/* Status Controls */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedAffiliate.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedAffiliate.id, 'Approved')}
                      style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flex: 1 }}
                    >
                      Approve Profile
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedAffiliate.id, 'Rejected')}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flex: 1 }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedAffiliate.status === 'Approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAffiliate.id, 'Suspended')}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
                  >
                    Suspend Partner Account
                  </button>
                )}

                {selectedAffiliate.status === 'Suspended' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedAffiliate.id, 'Approved')}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
                  >
                    Re-Activate Account
                  </button>
                )}
              </div>

              {/* KYC Verification Actions */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>KYC Document Details</h4>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <div>Aadhaar: <strong>{selectedAffiliate.aadhaar || 'N/A'}</strong></div>
                  <div>PAN card: <strong>{selectedAffiliate.pan || 'N/A'}</strong></div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {!selectedAffiliate.kycVerified ? (
                    <button
                      onClick={() => handleUpdateKYC(selectedAffiliate.id, true)}
                      style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
                    >
                      Mark KYC as Verified
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateKYC(selectedAffiliate.id, false)}
                      style={{ background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
                    >
                      Reset KYC Status
                    </button>
                  )}
                </div>
              </div>

              {/* Wallet Ledger Actions */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Wallet & Commissions Balance</h4>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Withdrawable Balance:</span>
                  <strong style={{ color: '#10b981' }}>₹{selectedAffiliate.walletBalance.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {/* Approve Pending Commissions */}
                  <button
                    onClick={() => handleApproveCommissions(selectedAffiliate.id)}
                    style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flex: 1 }}
                  >
                    Approve Commissions
                  </button>

                  {/* Trigger Payout modal */}
                  <button
                    onClick={() => {
                      setPayoutForm({ ...payoutForm, amount: selectedAffiliate.walletBalance });
                      setShowPayoutModal(true);
                    }}
                    disabled={selectedAffiliate.walletBalance < 1500}
                    style={{
                      background: selectedAffiliate.walletBalance >= 1500 ? '#10b981' : '#cbd5e1',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: selectedAffiliate.walletBalance >= 1500 ? 'pointer' : 'not-allowed',
                      flex: 1
                    }}
                  >
                    Release Payout
                  </button>
                </div>
              </div>

              {/* Bank Transfer Specs */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: '#475569' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Registered Settlement Account</h4>
                <div>Holder: <strong>{selectedAffiliate.bankDetails.holder || 'N/A'}</strong></div>
                <div>Account: <strong>{selectedAffiliate.bankDetails.account || 'N/A'}</strong></div>
                <div>IFSC: <strong>{selectedAffiliate.bankDetails.ifsc || 'N/A'}</strong></div>
                <div>UPI ID: <strong>{selectedAffiliate.bankDetails.upi || 'N/A'}</strong></div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MARKETING MATERIALS MANAGER TAB */}
      {adminTab === 'Marketing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
          
          {/* Upload Form */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#0f172a' }}>Add Marketing Creative</h3>
            
            <form onSubmit={handleUploadMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Asset Title *</label>
                <input
                  type="text"
                  required
                  value={marketingForm.title}
                  onChange={e => setMarketingForm({ ...marketingForm, title: e.target.value })}
                  placeholder="durga puja dynamic header poster"
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Creative Type *</label>
                <select
                  value={marketingForm.type}
                  onChange={e => setMarketingForm({ ...marketingForm, type: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                >
                  <option value="Poster">Poster (पोस्टर)</option>
                  <option value="Banner">Banner (बैनर)</option>
                  <option value="Video">Video Promotional Link</option>
                  <option value="PDF">PDF Brochure / Sales Guide</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Creative Media File URL *</label>
                <input
                  type="text"
                  required
                  value={marketingForm.fileUrl}
                  onChange={e => setMarketingForm({ ...marketingForm, fileUrl: e.target.value })}
                  placeholder="https://cloud.com/creative.jpg"
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Short Description</label>
                <input
                  type="text"
                  value={marketingForm.description}
                  onChange={e => setMarketingForm({ ...marketingForm, description: e.target.value })}
                  placeholder="Describe where to share this poster..."
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={uploadingMaterial}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {uploadingMaterial ? 'Uploading...' : 'Publish to Library'}
              </button>
            </form>
          </div>

          {/* Quick Assets Instructions */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', fontSize: '13.5px', color: '#475569', lineHeight: '1.6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Publishing Assets to Partners</h3>
            <p>जब आप यहाँ मार्केटिंग सामग्रियां जैसे कि बैनर, पोस्टर, गाइड या वीडियो साझा करेंगे, तो यह सभी पंजीकृत एफिलिएट पार्टनर्स के डैशबोर्ड के &quot;Creatives &amp; Guides&quot; सेक्शन में तुरंत दिखाई देने लगेंगी।</p>
            <p>पार्टनर इन क्रिएटिव को सीधे डाउनलोड करके व्हाट्सएप, फेसबुक या इंस्टाग्राम पर अपने विशिष्ट ट्रैकिंग लिंक के साथ प्रचारित कर सकेंगे।</p>
          </div>

        </div>
      )}

      {/* Payout Processing Dialog Modal */}
      {showPayoutModal && selectedAffiliate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '28px',
            width: '400px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>रिलीज़ मासिक भुगतान (Payout Settlement)</h3>
              <button onClick={() => setShowPayoutModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleReleasePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '13px', color: '#475569', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                पार्टनर: <strong>{selectedAffiliate.fullName} ({selectedAffiliate.affiliateCode})</strong><br />
                वॉलेट बैलेंस: <strong style={{ color: '#10b981' }}>₹{selectedAffiliate.walletBalance.toLocaleString('en-IN')}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Release Amount (भुगतान राशि) *</label>
                <input
                  type="number"
                  required
                  max={selectedAffiliate.walletBalance}
                  value={payoutForm.amount}
                  onChange={e => setPayoutForm({ ...payoutForm, amount: Number(e.target.value) })}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Transaction Reference Number *</label>
                <input
                  type="text"
                  required
                  value={payoutForm.referenceNumber}
                  onChange={e => setPayoutForm({ ...payoutForm, referenceNumber: e.target.value })}
                  placeholder="TXN1234567"
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>Payment Method *</label>
                <select
                  value={payoutForm.paymentMethod}
                  onChange={e => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px' }}
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer (खाता हस्तांतरण)</option>
                  <option value="NEFT">NEFT</option>
                  <option value="IMPS">IMPS</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={processingPayout}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                {processingPayout ? 'भुगतान जारी हो रहा है...' : 'Confirm Release Payout'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
