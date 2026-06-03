'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { updateReporterStatus, deleteReporter } from '@/actions/reporter';
import { uploadFileAction } from '@/actions/upload';
import { getReporterMessages, sendReporterMessage, markReporterMessagesAsRead, getReportersListWithUnreadCounts } from '@/actions/chat';

export default function ReportersClient({ initialList }: { initialList: any[] }) {
  const [reporters, setReporters] = useState<any[]>(initialList);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Chat'>('Pending');
  const [selectedReporter, setSelectedReporter] = useState<any | null>(null);

  // Rejection Dialogue States
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Approval Dialogue States
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [joiningLetterFile, setJoiningLetterFile] = useState<File | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const filteredList = activeTab === 'Chat'
    ? [...reporters].sort((a, b) => {
        if ((a.unreadCount || 0) !== (b.unreadCount || 0)) {
          return (b.unreadCount || 0) - (a.unreadCount || 0);
        }
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.fullName.localeCompare(b.fullName);
      })
    : reporters.filter(r => r.status === activeTab);

  const handleOpenReview = (rep: any) => {
    setSelectedReporter(rep);
    setShowRejectForm(false);
    setShowApproveForm(false);
    setRejectReason('');
    setJoiningLetterFile(null);
    if (activeTab === 'Chat') {
      setIsAdminChatOpen(true);
    }
  };

  const handleCloseReview = () => {
    setSelectedReporter(null);
  };

  const handleRejectKYC = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    setIsRejecting(true);

    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Rejected', undefined, rejectReason.trim());
      if (res.success) {
        alert('Reporter KYC marked as Rejected.');
        
        // Update local list state
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Rejected', rejectionReason: rejectReason } : r));
        handleCloseReview();
      } else {
        alert('Failed to reject: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleApproveKYC = async () => {
    if (!joiningLetterFile) return alert('Please select a Joining Letter PDF file.');
    setIsApproving(true);

    try {
      // 1. Upload Joining Letter
      const uploadFormData = new FormData();
      uploadFormData.append('file', joiningLetterFile);
      uploadFormData.append('folder', 'joining_letters');

      const uploadRes = await uploadFileAction(uploadFormData);
      if (!uploadRes.success || !uploadRes.url) {
        alert('Failed to upload joining letter: ' + uploadRes.message);
        setIsApproving(false);
        return;
      }

      // 2. Call server action to update status to Approved
      const res = await updateReporterStatus(selectedReporter.id, 'Approved', uploadRes.url);
      if (res.success) {
        alert('Reporter approved and Joining Letter published!');
        
        // Update local list state
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Approved', joiningLetter: uploadRes.url } : r));
        handleCloseReview();
      } else {
        alert('Failed to approve reporter: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  // Suspension & Deletion States
  const [isSuspending, setIsSuspending] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuspendReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to block/suspend reporter ${selectedReporter.fullName}?`)) return;
    setIsSuspending(true);
    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Suspended');
      if (res.success) {
        alert('Reporter has been blocked.');
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Suspended' } : r));
        handleCloseReview();
      } else {
        alert('Failed to block: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivateReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to unblock and reactivate reporter ${selectedReporter.fullName}?`)) return;
    setIsReactivating(true);
    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Approved');
      if (res.success) {
        alert('Reporter has been unblocked successfully!');
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Approved' } : r));
        handleCloseReview();
      } else {
        alert('Failed to unblock: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDeleteReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to permanently delete reporter ${selectedReporter.fullName} and their KYC documents? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteReporter(selectedReporter.id);
      if (res.success) {
        alert('Reporter has been successfully deleted.');
        setReporters(prev => prev.filter(r => r.id !== selectedReporter.id));
        handleCloseReview();
      } else {
        alert('Failed to delete: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Admin Direct Chat States
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);

  // Poll for new messages every 4 seconds when chat is open
  useEffect(() => {
    if (!selectedReporter?.id) {
      setIsAdminChatOpen(false);
      return;
    }

    const fetchAdminChatData = async () => {
      try {
        if (isAdminChatOpen) {
          const messages = await getReporterMessages(selectedReporter.id);
          setAdminChatMessages(messages);
          await markReporterMessagesAsRead(selectedReporter.id, 'Admin');
          // Instantly clear unread count for this reporter in local state
          setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, unreadCount: 0 } : r));
        }
      } catch (e) {
        console.error('Error polling admin chat:', e);
      }
    };

    fetchAdminChatData();
    const interval = setInterval(fetchAdminChatData, 4000);
    return () => clearInterval(interval);
  }, [selectedReporter?.id, isAdminChatOpen]);

  // Periodic polling for reporters list with unread counts (every 5 seconds)
  useEffect(() => {
    const fetchReportersUnreadData = async () => {
      try {
        const list = await getReportersListWithUnreadCounts();
        if (list && list.length > 0) {
          setReporters(list);
        }
      } catch (err) {
        console.error('Error fetching reporters unread data:', err);
      }
    };

    fetchReportersUnreadData();
    const interval = setInterval(fetchReportersUnreadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of admin chat automatically
  useEffect(() => {
    if (isAdminChatOpen) {
      const chatBody = document.getElementById('adminChatMessagesBody');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
  }, [adminChatMessages, isAdminChatOpen]);

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !selectedReporter?.id || isSendingAdminMessage) return;

    const text = adminChatInput.trim();
    setAdminChatInput('');
    setIsSendingAdminMessage(true);

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      reporterId: selectedReporter.id,
      sender: 'Admin',
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setAdminChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendReporterMessage(selectedReporter.id, 'Admin', text);
      if (res.success && res.message) {
        setAdminChatMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
      }
    } catch (err) {
      console.error('Error sending admin message:', err);
    } finally {
      setIsSendingAdminMessage(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-users-cog" style={{ color: '#ef4444' }}></i>
            <span>Reporter KYC Management</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Audit verification dossier submissions, manage official contracts, and regulate active reporting authorizations.
          </p>
        </div>
      </div>

      {/* Premium Capsule Tabs Selector */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px',
        background: '#f1f5f9',
        borderRadius: '16px',
        border: '1px solid #cbd5e1',
        marginBottom: '32px',
        overflowX: 'auto',
        maxWidth: 'max-content',
        scrollbarWidth: 'none',
        boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.03)'
      }}>
        <button 
          onClick={() => setActiveTab('Pending')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Pending' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
            color: activeTab === 'Pending' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Pending' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-hourglass-half" style={{ color: activeTab === 'Pending' ? '#fff' : '#818cf8' }}></i>
          <span>Pending Review</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Pending' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Pending' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {reporters.filter(r => r.status === 'Pending').length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Approved')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: activeTab === 'Approved' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Approved' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-check-circle" style={{ color: activeTab === 'Approved' ? '#fff' : '#10b981' }}></i>
          <span>Approved Active</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Approved' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Approved' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {reporters.filter(r => r.status === 'Approved').length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Rejected')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Rejected' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
            color: activeTab === 'Rejected' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Rejected' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-times-circle" style={{ color: activeTab === 'Rejected' ? '#fff' : '#f59e0b' }}></i>
          <span>Rejected Profiles</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Rejected' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Rejected' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {reporters.filter(r => r.status === 'Rejected').length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Suspended')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Suspended' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: activeTab === 'Suspended' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Suspended' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-ban" style={{ color: activeTab === 'Suspended' ? '#fff' : '#ef4444' }}></i>
          <span>Blocked Profiles</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Suspended' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Suspended' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {reporters.filter(r => r.status === 'Suspended').length}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Chat')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Chat' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
            color: activeTab === 'Chat' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Chat' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <i className="fas fa-comments" style={{ color: activeTab === 'Chat' ? '#fff' : '#6366f1' }}></i>
          <span>Direct Chat with Reporter</span>
          
          {reporters.reduce((acc, r) => acc + (r.unreadCount || 0), 0) > 0 && (
            <span style={{
              fontSize: '11px',
              background: activeTab === 'Chat' ? '#ffffff' : '#ef4444',
              color: activeTab === 'Chat' ? '#ef4444' : '#ffffff',
              padding: '2px 8px',
              borderRadius: '20px',
              fontWeight: 800,
              marginLeft: '4px',
              boxShadow: activeTab === 'Chat' ? 'none' : '0 2px 6px rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              {reporters.reduce((acc, r) => acc + (r.unreadCount || 0), 0)} New
            </span>
          )}
        </button>
      </div>

      {/* Spacious Card-Separated Row spacing grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
              <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Reporter Dossier Details</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Email Address</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Mobile Number</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Assigned Region</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Registration Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ 
                  textAlign: 'center', 
                  padding: '60px 40px', 
                  color: '#64748b',
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }}>
                    <i className="fas fa-users-slash"></i>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, display: 'block', color: '#475569' }}>No profiles found</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>There are currently no reporters under the active tab selection.</span>
                </td>
              </tr>
            ) : (
              filteredList.map((rep) => (
                <tr key={rep.id} style={{
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                  borderRadius: '12px',
                  transition: 'all 0.2s',
                }}>
                  <td style={{ 
                    padding: '14px 16px', 
                    borderTopLeftRadius: '12px', 
                    borderBottomLeftRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: rep.status === 'Suspended' ? '4px solid #ef4444' : '1px solid #e2e8f0',
                    borderRight: 'none',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={rep.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                          alt={rep.fullName}
                          style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '50%', 
                            objectFit: 'cover', 
                            border: '2px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                            background: '#f8fafc'
                          }}
                        />
                        {/* Status notification dot */}
                        <span style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          border: '2px solid #ffffff',
                          background: rep.status === 'Approved' ? '#10b981' : rep.status === 'Pending' ? '#6366f1' : rep.status === 'Rejected' ? '#f59e0b' : '#ef4444',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{rep.fullName}</span>
                          {rep.status === 'Suspended' ? (
                            <span style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fca5a5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              lineHeight: '1'
                            }}>
                              <i className="fas fa-ban" style={{ fontSize: '9px' }}></i>
                              <span>Blocked</span>
                            </span>
                          ) : activeTab === 'Chat' ? (
                            <span style={{
                              background: rep.status === 'Approved' ? '#ecfdf5' : rep.status === 'Pending' ? '#eeebff' : '#fff9db',
                              color: rep.status === 'Approved' ? '#10b981' : rep.status === 'Pending' ? '#4f46e5' : '#d97706',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${rep.status === 'Approved' ? '#a7f3d0' : rep.status === 'Pending' ? '#cbd5e1' : '#fde68a'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              lineHeight: '1'
                            }}>
                              <i className={`fas ${rep.status === 'Approved' ? 'fa-check-circle' : rep.status === 'Pending' ? 'fa-hourglass-half' : 'fa-times-circle'}`} style={{ fontSize: '9px' }}></i>
                              <span>{rep.status}</span>
                            </span>
                          ) : null}
                          {(rep.unreadCount || 0) > 0 && (
                            <span style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                            }}>
                              <i className="fas fa-bell" style={{ fontSize: '8px' }}></i>
                              <span>{rep.unreadCount} New</span>
                            </span>
                          )}
                        </span>
                        
                        {activeTab === 'Chat' ? (
                          <div style={{ marginTop: '4px' }}>
                            {rep.lastMessageText ? (
                              <span style={{ 
                                fontSize: '12px', 
                                color: (rep.unreadCount || 0) > 0 ? '#4f46e5' : '#64748b', 
                                fontWeight: (rep.unreadCount || 0) > 0 ? 700 : 500, 
                                display: 'block',
                                maxWidth: '280px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                              }}>
                                {(rep.unreadCount || 0) > 0 ? '💬 ' : ''}{rep.lastMessageText}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>
                                No message history
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            fontSize: '10.5px', 
                            color: '#4f46e5', 
                            fontWeight: 800, 
                            fontFamily: 'monospace', 
                            marginTop: '4px',
                            background: '#eeebff',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}>
                            <i className="fas fa-id-badge"></i> {rep.reporterCode || 'NO ID ASSIGNED'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none', 
                    borderRight: 'none',
                    verticalAlign: 'middle',
                    color: '#475569',
                    fontWeight: 600
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="far fa-envelope" style={{ color: '#94a3b8' }}></i>
                      <span>{rep.email}</span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none', 
                    borderRight: 'none',
                    verticalAlign: 'middle',
                    color: '#475569',
                    fontWeight: 600
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-phone-alt" style={{ color: '#94a3b8' }}></i>
                      <span>{rep.mobile}</span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none', 
                    borderRight: 'none',
                    verticalAlign: 'middle',
                    color: '#475569',
                    fontWeight: 600
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-map-marker-alt" style={{ color: '#f43f5e' }}></i>
                      <span>{rep.block ? `${rep.block}, ` : ''}{rep.district}, {rep.state}</span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none', 
                    borderRight: 'none',
                    verticalAlign: 'middle',
                    color: '#64748b',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="far fa-calendar-alt" style={{ color: '#94a3b8' }}></i>
                      <span>{new Date(rep.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '14px 16px', 
                    borderTopRightRadius: '12px', 
                    borderBottomRightRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: 'none',
                    verticalAlign: 'middle',
                    textAlign: 'center'
                  }}>
                    <button 
                      onClick={() => handleOpenReview(rep)} 
                      style={{
                        background: activeTab === 'Chat' && (rep.unreadCount || 0) > 0
                          ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        border: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? 'none' : '1px solid #cbd5e1',
                        color: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? '#ffffff' : '#334155',
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab === 'Chat' && (rep.unreadCount || 0) > 0) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#1e293b';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab === 'Chat' && (rep.unreadCount || 0) > 0) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.25)';
                        } else {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        }
                      }}
                    >
                      <i className={`fas ${activeTab === 'Chat' ? 'fa-comments' : 'fa-clipboard-check'}`}></i>
                      <span>{activeTab === 'Chat' ? 'Open Chat' : 'Review KYC'}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL INTERACTIVE PORTAL */}
      {selectedReporter && (
        <div className={styles.adminModalBackdrop} style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.3s ease',
        }}>
          <div className={styles.adminModalContent} style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            maxWidth: isAdminChatOpen ? '1200px' : '850px',
            overflow: 'hidden',
            transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '24px 32px', 
              background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fas fa-folder-open" style={{ color: '#4f46e5' }}></i>
                  <span>KYC Dossier: {selectedReporter.fullName}</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Review personal information, verification credentials, and supporting documents.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Chat Toggle Button */}
                <button 
                  onClick={() => setIsAdminChatOpen(!isAdminChatOpen)}
                  style={{
                    background: isAdminChatOpen ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' : '#f1f5f9',
                    border: isAdminChatOpen ? 'none' : '1px solid #cbd5e1',
                    color: isAdminChatOpen ? '#ffffff' : '#475569',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isAdminChatOpen ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-comments"></i>
                  <span>{isAdminChatOpen ? 'Close Chat Workspace' : 'Direct Chat with Reporter'}</span>
                </button>

                <button 
                  onClick={handleCloseReview} 
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '16px', 
                    color: '#475569', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Split Container for KYC Dossier + Chat */}
            <div style={{ display: 'flex', height: 'calc(90vh - 120px)', overflow: 'hidden', flexGrow: 1 }}>
              
              {/* Left Column: KYC Dossier (60% width if chat open, otherwise 100%) */}
              <div style={{ 
                width: isAdminChatOpen ? '60%' : '100%', 
                padding: '32px', 
                overflowY: 'auto', 
                borderRight: isAdminChatOpen ? '1px solid #e2e8f0' : 'none',
                maxHeight: '100%',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
              
              {/* Profile Details Grid */}
              <h4 style={{ 
                fontSize: '13.5px', 
                fontWeight: 800, 
                color: '#4f46e5', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '10px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-user-circle"></i>
                <span>Personal Profile & Contact Info</span>
              </h4>
              
              <div style={{ 
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                display: 'flex', 
                gap: '28px', 
                marginBottom: '32px', 
                alignItems: 'start', 
                flexWrap: 'wrap' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={selectedReporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                    alt={selectedReporter.fullName}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '20px', 
                      objectFit: 'cover', 
                      border: '3px solid #ffffff', 
                      boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.15)', 
                      background: '#f8fafc' 
                    }}
                  />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: selectedReporter.status === 'Approved' ? '#10b981' : selectedReporter.status === 'Pending' ? '#4f46e5' : selectedReporter.status === 'Rejected' ? '#f59e0b' : '#ef4444',
                    background: selectedReporter.status === 'Approved' ? '#ecfdf5' : selectedReporter.status === 'Pending' ? '#eeebff' : '#fef2f2',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedReporter.status === 'Approved' ? '#a7f3d0' : selectedReporter.status === 'Pending' ? '#cbd5e1' : '#fee2e2'}`,
                  }}>
                    {selectedReporter.status}
                  </span>
                </div>
                
                <div className={styles.dossierGrid} style={{ flex: 1, fontSize: '13.5px', rowGap: '16px', columnGap: '24px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Reporter Full Name</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '15px' }}>{selectedReporter.fullName}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Father/Husband Name</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '15px' }}>{selectedReporter.fatherHusbandName || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Official Reporter ID</span>
                    <span style={{ fontWeight: 750, color: '#4f46e5', fontFamily: 'monospace', fontSize: '14px' }}>{selectedReporter.reporterCode || 'No ID Assigned'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Blood Group</span>
                    <span style={{ fontWeight: 750, color: '#e11d48' }}>{selectedReporter.bloodGroup || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Email Address</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.email}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Mobile Number</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.mobile}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Aadhaar Card Number</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontFamily: 'monospace' }}>{selectedReporter.aadhaarNumber || 'Not Uploaded'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>PO + PS Info & Area</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.poPs} • Block: {selectedReporter.block}, Dist: {selectedReporter.district}, {selectedReporter.state}</span>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Full Residential Address</span>
                    <span style={{ fontWeight: 700, color: '#1e293b', lineHeight: '1.4' }}>{selectedReporter.fullAddress}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <h4 style={{ 
                fontSize: '13.5px', 
                fontWeight: 800, 
                color: '#4f46e5', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '10px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-file-signature"></i>
                <span>Uploaded Identity & Educational Credentials</span>
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {/* Aadhaar Card (Front) Card */}
                {selectedReporter.aadhaarUrl ? (
                  <a 
                    href={selectedReporter.aadhaarUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Aadhaar Card (Front)</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Aadhaar Card (Front)</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Aadhaar Card (Back) Card */}
                {selectedReporter.aadhaarBackUrl ? (
                  <a 
                    href={selectedReporter.aadhaarBackUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Aadhaar Card (Back)</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Aadhaar Card (Back)</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* PAN Card Card */}
                {selectedReporter.panUrl ? (
                  <a 
                    href={selectedReporter.panUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f0f9ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>PAN Card</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>PAN Card</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Voter ID Card Card */}
                {selectedReporter.voterIdUrl ? (
                  <a 
                    href={selectedReporter.voterIdUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-address-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Voter ID Card</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-address-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Voter ID Card</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Educational Certificates Card */}
                {selectedReporter.educationUrl ? (
                  <a 
                    href={selectedReporter.educationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fdf2f8',
                      color: '#db2777',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Educational Certificates</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Education Certificates</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Introduction Video Section */}
              {selectedReporter.videoUrl && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ 
                    fontSize: '13.5px', 
                    fontWeight: 800, 
                    color: '#4f46e5', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '1px solid #f1f5f9', 
                    paddingBottom: '10px', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-video"></i>
                    <span>Reporter Video Introduction</span>
                  </h4>
                  <div style={{ 
                    maxWidth: '520px', 
                    margin: '0 auto', 
                    border: '4px solid #f1f5f9', 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    background: '#0f172a',
                    boxShadow: '0 12px 24px -8px rgba(15, 23, 42, 0.2)' 
                  }}>
                    <video controls src={selectedReporter.videoUrl} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              )}

              {/* Already Approved Details */}
              {selectedReporter.status === 'Approved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                  {selectedReporter.joiningLetter && (
                    <div style={{ 
                      background: '#ecfdf5', 
                      border: '1px solid #a7f3d0', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: '#d1fae5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}>
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', display: 'block', marginBottom: '2px' }}>Verified & Active Reporter</span>
                        <a 
                          href={selectedReporter.joiningLetter} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            fontSize: '13.5px', 
                            color: '#047857', 
                            fontWeight: 700, 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          <span>View Official Signed Joining Letter</span>
                          <i className="fas fa-external-link-alt" style={{ fontSize: '11px' }}></i>
                        </a>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSuspendReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                      }}
                      disabled={isSuspending}
                    >
                      <i className="fas fa-ban"></i> 
                      <span>{isSuspending ? 'Blocking Account...' : 'Block / Suspend Reporter Profile'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Already Rejected Details */}
              {selectedReporter.status === 'Rejected' && selectedReporter.rejectionReason && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fee2e2', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)',
                  borderTop: '1px solid #f1f5f9',
                  marginTop: '24px',
                  paddingTop: '20px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    <i className="fas fa-times-circle"></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: '2px' }}>KYC Submission Rejected</span>
                    <span style={{ fontSize: '13.5px', color: '#7f1d1d', fontWeight: 500 }}>
                      Reason for disapproval: <b style={{ fontWeight: 700 }}>{selectedReporter.rejectionReason}</b>
                    </span>
                  </div>
                </div>
              )}

              {/* Already Suspended Details */}
              {selectedReporter.status === 'Suspended' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                  <div style={{ 
                    background: '#fef2f2', 
                    border: '1px solid #fee2e2', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.05)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: '2px' }}>Reporter Account Blocked / Suspended</span>
                      <span style={{ fontSize: '13.5px', color: '#7f1d1d', fontWeight: 500 }}>
                        This profile is currently blocked from writing articles, submitting news, and using their dashboard.
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleDeleteReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                      }}
                      disabled={isDeleting || isReactivating}
                    >
                      <i className="fas fa-trash-alt"></i> 
                      <span>{isDeleting ? 'Deleting Profile...' : 'Delete Profile'}</span>
                    </button>

                    <button 
                      onClick={handleReactivateReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                      }}
                      disabled={isReactivating || isDeleting}
                    >
                      <i className="fas fa-check-circle"></i> 
                      <span>{isReactivating ? 'Unblocking Account...' : 'Unblock & Reactivate Profile'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Review */}
              {selectedReporter.status === 'Pending' && !showRejectForm && !showApproveForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  gap: '16px', 
                  justifyContent: 'flex-end',
                  marginTop: '12px'
                }}>
                  <button 
                    onClick={() => setShowRejectForm(true)} 
                    style={{
                      background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                      border: '1px solid #fca5a5',
                      color: '#b91c1c',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-ban"></i> 
                    <span>Disapprove / Reject KYC</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowApproveForm(true)} 
                    style={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px', 
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', 
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                    }}
                  >
                    <i className="fas fa-check-double"></i> 
                    <span>Approve & Sign Contract</span>
                  </button>
                </div>
              )}

              {/* Rejection Form Dialog */}
              {showRejectForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-exclamation-circle" style={{ color: '#dc2626', fontSize: '18px' }}></i>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Rejection Statement / Reason
                    </label>
                  </div>
                  
                  <textarea 
                    className={styles.formTextarea} 
                    style={{ 
                      minHeight: '100px',
                      borderRadius: '12px',
                      border: '1px solid #fca5a5',
                      background: '#fff8f8',
                      padding: '14px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific details about why the KYC is rejected (e.g. invalid Aadhaar photo, unclear video) so the reporter can re-upload correct information..."
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setShowRejectForm(false)} 
                      style={{
                        padding: '10px 20px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRejectKYC} 
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                      }}
                      disabled={isRejecting}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Reject & Notify'}
                    </button>
                  </div>
                </div>
              )}

              {/* Approval Form (PDF Upload) Dialog */}
              {showApproveForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-file-signature" style={{ color: '#10b981', fontSize: '18px' }}></i>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Upload Official Joining Letter PDF
                    </label>
                  </div>

                  <div style={{
                    border: '2px dashed #a7f3d0',
                    borderRadius: '16px',
                    padding: '24px',
                    background: '#f0fdf4',
                    textAlign: 'center',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => setJoiningLetterFile(e.target.files?.[0] || null)} 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                    <div style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px' }}>
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                    {joiningLetterFile ? (
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', display: 'block' }}>
                          Selected: {joiningLetterFile.name}
                        </span>
                        <span style={{ fontSize: '12px', color: '#059669', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fas fa-check-circle"></i> File loaded and ready for publish
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151', display: 'block' }}>
                          Click here or drag-and-drop the signing contract
                        </span>
                        <span style={{ fontSize: '12.5px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                          Only PDF documents are supported for official letters
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => setShowApproveForm(false)} 
                      style={{
                        padding: '10px 20px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleApproveKYC} 
                      style={{ 
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                      }}
                      disabled={isApproving}
                    >
                      {isApproving ? 'Uploading Contract...' : 'Confirm Approve & Publish'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Chat Workspace (40% width, only visible when open) */}
            {isAdminChatOpen && (
              <div style={{
                width: '40%',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#f8fafc',
                borderLeft: '1px solid #e2e8f0',
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '16px 24px',
                  background: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: selectedReporter.status === 'Approved' ? '#10b981' : selectedReporter.status === 'Pending' ? '#3b82f6' : '#94a3b8',
                    }} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                        Support Channel
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        Direct line to {selectedReporter.fullName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const messages = await getReporterMessages(selectedReporter.id);
                      setAdminChatMessages(messages);
                      await markReporterMessagesAsRead(selectedReporter.id, 'Admin');
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#64748b',
                      transition: 'all 0.2s',
                    }}
                    title="Refresh Chat"
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>

                {/* Chat Messages Body */}
                <div 
                  id="adminChatMessagesBody"
                  style={{
                    flexGrow: 1,
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#f8fafc',
                  }}
                >
                  {adminChatMessages.length === 0 ? (
                    <div style={{
                      margin: 'auto',
                      textAlign: 'center',
                      padding: '0 20px',
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#eeebff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        margin: '0 auto 16px auto',
                      }}>
                        <i className="fas fa-comments"></i>
                      </div>
                      <h5 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                        No Messages Yet
                      </h5>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Send a message to the reporter to initiate the conversation regarding their KYC or reports.
                      </p>
                    </div>
                  ) : (
                    adminChatMessages.map((msg) => {
                      const isAdmin = msg.sender === 'Admin';
                      return (
                        <div 
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdmin ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isAdmin ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#ffffff',
                            color: isAdmin ? '#ffffff' : '#1e293b',
                            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                            border: isAdmin ? 'none' : '1px solid #e2e8f0',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}>
                            {msg.message}
                          </div>
                          <span style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '4px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isAdmin && (
                              <i 
                                className={`fas ${msg.isRead ? 'fa-check-double' : 'fa-check'}`}
                                style={{ color: msg.isRead ? '#10b981' : '#cbd5e1', fontSize: '9px' }}
                              />
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input Footer */}
                <form 
                  onSubmit={handleSendAdminChatMessage}
                  style={{
                    padding: '16px 20px',
                    background: '#ffffff',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSendingAdminMessage}
                    style={{
                      flexGrow: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      background: '#f8fafc',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim() || isSendingAdminMessage}
                    style={{
                      background: adminChatInput.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f1f5f9',
                      color: adminChatInput.trim() ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '12px',
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      cursor: adminChatInput.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      boxShadow: adminChatInput.trim() ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    )}

    </div>
  );
}
