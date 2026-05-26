'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../community.module.css';
import { getContributorById, getContributorSubmissions, getSubmissionMessages, addSubmissionMessage, markMessagesAsRead } from '@/actions/community';

export default function ContributorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chat Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('contributorAuth');
    if (!authData) {
      router.push('/anonymous/login');
      return;
    }
    const { id } = JSON.parse(authData);
    loadData(id);
  }, []);

  const loadData = async (id: string) => {
    setIsLoading(true);
    const profRes = await getContributorById(id);
    if (profRes.success) setProfile(profRes.contributor);
    
    const subRes = await getContributorSubmissions(id);
    if (subRes.success) setSubmissions(subRes.submissions);
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('contributorAuth');
    router.push('/anonymous/login');
  };

  const openComplaintView = async (sub: any) => {
    setSelectedSubmission(sub);
    setViewModalOpen(true);
    setMessages([]);
    
    // Load messages
    const res = await getSubmissionMessages(sub.id);
    if (res.success) {
      setMessages(res.messages);
    }
    
    // Mark messages as read in background
    if (sub._count?.messages > 0) {
      markMessagesAsRead(sub.id, 'Contributor').then(() => {
        // Update local state to hide badge
        const updatedSubs = submissions.map(s => s.id === sub.id ? { ...s, _count: { messages: 0 } } : s);
        setSubmissions(updatedSubs);
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSubmission) return;
    
    setIsSending(true);
    const res = await addSubmissionMessage(selectedSubmission.id, 'Contributor', newMessage);
    if (res.success) {
      setMessages([...messages, res.message]);
      setNewMessage('');
      // Update local submission status visually
      const updatedSubs = submissions.map(s => s.id === selectedSubmission.id ? { ...s, status: 'Verification' } : s);
      setSubmissions(updatedSubs);
    } else {
      alert('Failed to send message.');
    }
    setIsSending(false);
  };

  if (isLoading) return <div style={{ padding: '60px', textAlign: 'center', color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>Loading Secure Dashboard...</div>;
  if (!profile) return null;

  return (
    <div className={styles.page} style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <div className={styles.inner} style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 700, color: '#fff' }}>Anonymous Dashboard</h1>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#9ca3af', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#9ca3af'}>Logout</button>
        </div>

        {/* Anonymous ID Card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '30px', borderRadius: '16px', marginBottom: '30px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '120px', color: 'rgba(239, 68, 68, 0.05)', zIndex: 0 }}>
            <i className="fas fa-fingerprint"></i>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '14px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 'bold' }}>Your Secure Contributor ID</div>
            <div style={{ fontSize: 'clamp(24px, 5vw, 42px)', fontWeight: '900', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', marginBottom: '16px', textShadow: '0 2px 10px rgba(220, 38, 38, 0.5)' }}>
              {profile.contributorId || 'GENERATING...'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '99px', fontSize: '13px', fontWeight: 'bold' }}>
              <i className="fas fa-shield-check"></i> Your identity remains strictly protected.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#3b82f6' }}>{submissions.length}</div>
            <div style={{ fontSize: '14px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Total Reports</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '40px' }}>
          <Link href="/anonymous/dashboard/submit" style={{ width: '100%', padding: '20px', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)', color: '#fff', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none', border: 'none', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)' }}>
            <i className="fas fa-camera"></i> Report a New Incident
          </Link>
        </div>

        {/* Submissions List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '20px', margin: 0, color: '#fff' }}>Complaint Tracking</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#111827', borderRadius: '12px', color: '#9ca3af', border: '1px dashed #374151' }}>
            You haven't submitted any reports yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submissions.map(sub => (
              <div key={sub.id} style={{ background: '#111827', border: '1px solid #1f2937', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>{sub.title}</h3>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>{new Date(sub.createdAt).toLocaleString()} • {sub.category}</div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#d1d5db', maxWidth: '600px', lineHeight: '1.5' }}>{sub.description.substring(0, 100)}...</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <span style={{ 
                    display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                    background: sub.status === 'Approved' ? 'rgba(16,185,129,0.1)' : sub.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: sub.status === 'Approved' ? '#10b981' : sub.status === 'Rejected' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${sub.status === 'Approved' ? 'rgba(16,185,129,0.2)' : sub.status === 'Rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`
                  }}>
                    {sub.status === 'Pending' ? 'In Review' : sub.status}
                  </span>
                  
                  <button onClick={() => openComplaintView(sub)} style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                    <i className="fas fa-comment-alt"></i> View & Chat
                    {sub._count?.messages > 0 && (
                      <span style={{ background: '#3b82f6', color: '#fff', fontSize: '11px', padding: '2px 6px', borderRadius: '99px', marginLeft: 'auto' }}>
                        {sub._count.messages}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Complaint View & Chat Modal */}
      {viewModalOpen && selectedSubmission && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111827', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid #374151', overflow: 'hidden' }}>
            
            <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#fff' }}>Complain Follow-up</h2>
              </div>
              <button onClick={() => setViewModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Original Complaint Details */}
              <div style={{ background: '#0a0a0a', padding: '16px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '24px' }}>
                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase' }}>Original Report • {new Date(selectedSubmission.createdAt).toLocaleDateString()}</span>
                <h3 style={{ fontSize: '16px', color: '#fff', margin: '8px 0' }}>{selectedSubmission.title}</h3>
                <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: 1.5, margin: 0 }}>{selectedSubmission.description}</p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
                  <i className="fas fa-map-marker-alt"></i> {selectedSubmission.address}
                </div>
              </div>

              {/* Chat History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', padding: '20px' }}>No messages yet. Start a conversation with the Admin.</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'Contributor' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '80%', 
                        padding: '12px 16px', 
                        borderRadius: '16px',
                        borderBottomRightRadius: msg.sender === 'Contributor' ? '4px' : '16px',
                        borderBottomLeftRadius: msg.sender === 'Admin' ? '4px' : '16px',
                        background: msg.sender === 'Contributor' ? '#2563eb' : '#1f2937',
                        color: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: msg.sender === 'Contributor' ? '#bfdbfe' : '#9ca3af', marginBottom: '4px', fontWeight: 'bold' }}>
                          {msg.sender === 'Contributor' ? 'You' : 'News Desk Admin'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{msg.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Chat Input */}
            <div style={{ padding: '16px', background: '#1f2937', borderTop: '1px solid #374151', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message to admin..." 
                style={{ flex: 1, padding: '12px 16px', borderRadius: '99px', border: '1px solid #4b5563', background: '#111827', color: '#fff', outline: 'none', fontSize: '14px' }}
              />
              <button 
                onClick={sendMessage}
                disabled={isSending || !newMessage.trim()}
                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '99px', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', opacity: isSending || !newMessage.trim() ? 0.6 : 1 }}
              >
                <i className="fas fa-paper-plane"></i> {isSending ? '...' : 'Send'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
