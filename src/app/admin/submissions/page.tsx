'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../admin.module.css';
import { getAllSubmissions, updateSubmissionStatus, deleteSubmission, getSubmissionMessages, addSubmissionMessage, markMessagesAsRead } from '@/actions/community';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for Viewing Complaint & Chat
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const subRes = await getAllSubmissions();
    if (subRes.success) setSubmissions(subRes.submissions);
    setIsLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (confirm(`Change status to ${newStatus}?`)) {
      const res = await updateSubmissionStatus(id, newStatus);
      if (res.success) {
        loadData();
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this complain? This action cannot be undone.')) {
      const res = await deleteSubmission(id);
      if (res.success) {
        alert('Complain deleted successfully!');
        loadData();
        if (selectedSubmission?.id === id) setViewModalOpen(false);
      } else {
        alert(res.message);
      }
    }
  };

  const openViewModal = async (submission: any) => {
    setSelectedSubmission(submission);
    setViewModalOpen(true);
    setMessages([]);
    
    // Load messages
    const res = await getSubmissionMessages(submission.id);
    if (res.success) {
      setMessages(res.messages);
    }
    
    // Mark messages as read in background
    if (submission._count?.messages > 0) {
      markMessagesAsRead(submission.id, 'Admin').then(() => {
        // Update local state to hide badge
        const updatedSubs = submissions.map(s => s.id === submission.id ? { ...s, _count: { messages: 0 } } : s);
        setSubmissions(updatedSubs);
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSubmission) return;
    
    setIsSending(true);
    const res = await addSubmissionMessage(selectedSubmission.id, 'Admin', newMessage);
    if (res.success) {
      setMessages([...messages, res.message]);
      setNewMessage('');
      
      // Update local submission status visually to 'In progress' since admin replied
      const updatedSubs = submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'In progress' } : s);
      setSubmissions(updatedSubs);
      
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      alert('Failed to send message.');
    }
    setIsSending(false);
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-bullhorn" style={{ color: '#ef4444' }}></i>
            <span>Citizen Reports Queue</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Audit community submissions, fact-check local complaints, verify evidences, and coordinate follow-up messaging.
          </p>
        </div>
        <button 
          onClick={loadData} 
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            color: '#334155',
            padding: '10px 20px',
            fontSize: '13.5px',
            fontWeight: 700,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#94a3b8';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <i className="fas fa-sync-alt"></i> Refresh Queue
        </button>
      </div>

      <div style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
        {isLoading ? (
          <div style={{ 
            padding: '80px 40px', 
            textAlign: 'center', 
            color: '#64748b',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)'
          }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Establishing secure connection...</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Establishing link to anonymous whistleblower submissions database...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ 
            padding: '60px 40px', 
            textAlign: 'center', 
            color: '#64748b',
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }}>
              <i className="fas fa-inbox"></i>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, display: 'block', color: '#475569' }}>No reports pending</span>
            <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>There are currently no community submissions or complaints waiting in the moderation queue.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Submission Details</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Contributor Account</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Reported Location</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Visual Evidences</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Evaluation Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  let mediaUrls = [];
                  try {
                    mediaUrls = s.mediaUrls ? JSON.parse(s.mediaUrls) : [];
                  } catch(e) {}

                  return (
                    <tr key={s.id} style={{
                      background: s.isGroundAlert ? 'linear-gradient(90deg, #fff5f5 0%, #ffffff 100%)' : '#ffffff',
                      boxShadow: s.isGroundAlert ? '0 4px 12px rgba(239, 68, 68, 0.08)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                    }}>
                      <td style={{ 
                        padding: '16px 16px', 
                        borderTopLeftRadius: '12px', 
                        borderBottomLeftRadius: '12px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        maxWidth: '280px'
                      }}>
                        {s.isGroundAlert && (
                          <span style={{ 
                            fontSize: '10px', 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                            color: '#fff', 
                            padding: '3px 8px', 
                            borderRadius: '6px', 
                            textTransform: 'uppercase', 
                            fontWeight: 800, 
                            marginBottom: '8px', 
                            display: 'inline-block',
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)' 
                          }}>
                            <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }}></i> Ground Alert
                          </span>
                        )}
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '14.5px', lineHeight: '1.4' }}>{s.title}</div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                          {s.description}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <span style={{ 
                            background: s.isGroundAlert ? 'rgba(239, 68, 68, 0.08)' : '#eff6ff', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '11px', 
                            color: s.isGroundAlert ? '#b91c1c' : '#2563eb', 
                            fontWeight: 700,
                            border: `1px solid ${s.isGroundAlert ? '#fca5a550' : '#bfdbfe'}`
                          }}>
                            <i className="fas fa-tag" style={{ marginRight: '4px' }}></i> {s.category}
                          </span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 16px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: s.isGroundAlert ? '#fee2e2' : '#f8fafc',
                            color: s.isGroundAlert ? '#ef4444' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            border: `1px solid ${s.isGroundAlert ? '#fca5a5' : '#cbd5e1'}`
                          }}>
                            <i className="fas fa-user-secret"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'monospace', color: '#4f46e5' }}>
                              {s.contributor?.contributorId || 'DELETED'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                              Trust: <span style={{ color: (s.contributor?.trustScore || 0) > 70 ? '#10b981' : (s.contributor?.trustScore || 0) < 30 ? '#ef4444' : '#f59e0b', fontWeight: 800 }}>{s.contributor?.trustScore || 0}/100</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 16px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', lineHeight: '1.4' }}>{s.address}</div>
                        {s.lat && s.lng && (
                          <a 
                            href={`https://maps.google.com/?q=${s.lat},${s.lng}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              fontSize: '11.5px', 
                              color: '#059669', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              marginTop: '6px',
                              textDecoration: 'none',
                              fontWeight: 700
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <i className="fas fa-map-marker-alt"></i> View on Map
                          </a>
                        )}
                      </td>
                      <td style={{ 
                        padding: '16px 16px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle'
                      }}>
                        {mediaUrls.length > 0 ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {mediaUrls.slice(0, 3).map((url: string, i: number) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
                                <img 
                                  src={url} 
                                  alt="media" 
                                  style={{ 
                                    width: '42px', 
                                    height: '42px', 
                                    objectFit: 'cover', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                                  }} 
                                />
                              </a>
                            ))}
                            {mediaUrls.length > 3 && (
                              <div style={{ width: '42px', height: '42px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#475569' }}>
                                +{mediaUrls.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>No assets</span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '16px 16px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: s.status === 'Approved' ? '#ecfdf5' : s.status === 'Rejected' ? '#fef2f2' : s.status === 'In progress' ? '#eff6ff' : '#fff7ed',
                          color: s.status === 'Approved' ? '#16a34a' : s.status === 'Rejected' ? '#ef4444' : s.status === 'In progress' ? '#2563eb' : '#d97706',
                          border: `1px solid ${s.status === 'Approved' ? '#16a34a30' : s.status === 'Rejected' ? '#ef444430' : s.status === 'In progress' ? '#2563eb30' : '#d9770630'}`
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ 
                        padding: '16px 16px', 
                        borderTopRightRadius: '12px', 
                        borderBottomRightRadius: '12px', 
                        border: s.isGroundAlert ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                        borderLeft: 'none',
                        verticalAlign: 'middle',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px' }}>
                          <button 
                            onClick={() => openViewModal(s)}
                            style={{ 
                              padding: '8px 12px', 
                              fontSize: '12px', 
                              width: '100%', 
                              justifyContent: 'center', 
                              position: 'relative', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.15)'
                            }}
                          >
                            <i className="fas fa-eye"></i> Audit & Chat
                            {s._count?.messages > 0 && (
                              <span style={{ 
                                background: '#ffffff', 
                                color: '#4f46e5', 
                                fontSize: '10px', 
                                padding: '1px 6px', 
                                borderRadius: '99px', 
                                fontWeight: 800, 
                                marginLeft: '4px' 
                              }}>
                                {s._count.messages}
                              </span>
                            )}
                          </button>
                          
                          <select 
                            value={s.status}
                            onChange={(e) => handleStatusChange(s.id, e.target.value)}
                            style={{ 
                              padding: '6px 8px', 
                              borderRadius: '8px', 
                              border: '1px solid #cbd5e1', 
                              fontSize: '12px', 
                              cursor: 'pointer', 
                              background: '#f8fafc', 
                              color: '#334155',
                              fontWeight: 600,
                              outline: 'none',
                              width: '100%' 
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In progress">In progress</option>
                            <option value="Verification">Verification</option>
                            <option value="Support">Support</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Reject</option>
                          </select>

                          <button 
                            onClick={() => handleDelete(s.id)}
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '12px', 
                              width: '100%', 
                              justifyContent: 'center', 
                              background: 'transparent', 
                              color: '#ef4444', 
                              border: '1px solid #fca5a5', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              transition: 'all 0.2s',
                              fontWeight: 600
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <i className="fas fa-trash-alt"></i> Delete Complain
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Complain & Chat Modal */}
      {viewModalOpen && selectedSubmission && (
        <div className={styles.adminModalBackdrop} style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}>
          <div className={styles.adminModalContent} style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            width: '100%', 
            maxWidth: '850px', 
            height: '85vh', 
            display: 'flex', 
            flexDirection: 'row', 
            overflow: 'hidden',
          }}>
            
            {/* Left Panel: Complaint Details */}
            <div style={{ width: '50%', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
              <div style={{ 
                padding: '24px', 
                borderBottom: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: selectedSubmission.isGroundAlert ? 'linear-gradient(90deg, #fff5f5 0%, #f8fafc 100%)' : '#f8fafc' 
              }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    Complain Details
                  </h2>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                    Story ID: #{selectedSubmission.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                {selectedSubmission.isGroundAlert && (
                  <span style={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    color: '#fff', 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)' 
                  }}>
                    URGENT
                  </span>
                )}
              </div>
              
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800, letterSpacing: '0.5px' }}>Complain Headline</h3>
                  <p style={{ fontSize: '16px', color: '#0f172a', margin: 0, fontWeight: 750, lineHeight: '1.4' }}>{selectedSubmission.title}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>Category</h3>
                  <span style={{ 
                    background: selectedSubmission.isGroundAlert ? 'rgba(239, 68, 68, 0.08)' : '#eff6ff', 
                    color: selectedSubmission.isGroundAlert ? '#b91c1c' : '#2563eb', 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    border: `1px solid ${selectedSubmission.isGroundAlert ? '#fca5a550' : '#bfdbfe'}` 
                  }}>
                    {selectedSubmission.category}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>Story Description</h3>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#334155', 
                    margin: 0, 
                    lineHeight: 1.6, 
                    whiteSpace: 'pre-wrap', 
                    background: '#ffffff', 
                    border: '1px solid #e2e8f0', 
                    padding: '16px', 
                    borderRadius: '12px',
                    fontFamily: 'Georgia, Cambria, serif' 
                  }}>
                    {selectedSubmission.description}
                  </div>
                </div>
                <div>
                  <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800, letterSpacing: '0.5px' }}>Location</h3>
                  <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                    <i className="fas fa-map-marker-alt" style={{ color: '#ef4444', marginRight: '6px' }}></i>{selectedSubmission.address}
                  </p>
                </div>
                <div>
                  <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 800, letterSpacing: '0.5px' }}>Whistleblower Account</h3>
                  <p style={{ fontSize: '14px', color: '#4f46e5', margin: 0, fontWeight: 800, fontFamily: 'monospace', background: '#eeebff', padding: '4px 10px', borderRadius: '6px', width: 'fit-content' }}>
                    <i className="fas fa-user-secret" style={{ marginRight: '6px' }}></i>{selectedSubmission.contributor?.contributorId || 'DELETED'}
                  </p>
                </div>
                {selectedSubmission.mediaUrls && JSON.parse(selectedSubmission.mediaUrls).length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>Evidence Assets</h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {JSON.parse(selectedSubmission.mediaUrls).map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          <img 
                            src={url} 
                            alt="Evidence" 
                            style={{ 
                              width: '80px', 
                              height: '80px', 
                              objectFit: 'cover', 
                              borderRadius: '10px', 
                              border: '2px solid #ffffff', 
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' 
                            }} 
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Panel: Chat Interface */}
            <div style={{ width: '50%', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-comments" style={{ color: '#3b82f6' }}></i>
                  <span>Auditor Chat Box</span>
                </h2>
                <button 
                  onClick={() => setViewModalOpen(false)} 
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '14px', 
                    color: '#64748b', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '40px', padding: '0 20px' }}>
                    <i className="fas fa-comment-dots" style={{ fontSize: '32px', marginBottom: '12px', color: '#cbd5e1' }}></i>
                    <p style={{ fontWeight: 700, color: '#64748b', margin: 0 }}>No messages yet.</p>
                    <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>Request additional evidences or dispatch status updates to contributor drafts.</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'Admin' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '85%', 
                        padding: '12px 16px', 
                        borderRadius: '16px',
                        borderBottomRightRadius: msg.sender === 'Admin' ? '4px' : '16px',
                        borderBottomLeftRadius: msg.sender === 'Contributor' ? '4px' : '16px',
                        background: msg.sender === 'Admin' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#ffffff',
                        color: msg.sender === 'Admin' ? '#ffffff' : '#1e293b',
                        border: msg.sender === 'Contributor' ? '1px solid #e2e8f0' : 'none',
                        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.03)'
                      }}>
                        <div style={{ fontSize: '10.5px', color: msg.sender === 'Admin' ? '#93c5fd' : '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>
                          {msg.sender === 'Admin' ? 'Official Auditor' : 'Contributor'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div style={{ fontSize: '13.5px', lineHeight: 1.4, fontWeight: 500 }}>{msg.message}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div style={{ padding: '16px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type follow-up statement..." 
                  style={{ 
                    flex: 1, 
                    padding: '12px 18px', 
                    borderRadius: '99px', 
                    border: '1px solid #cbd5e1', 
                    outline: 'none', 
                    fontSize: '13.5px', 
                    background: '#f8fafc',
                    color: '#1e293b',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                />
                <button 
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                    color: '#ffffff', 
                    border: 'none', 
                    padding: '0 24px', 
                    borderRadius: '99px', 
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    opacity: isSending || !newMessage.trim() ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                  <span>Send</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
