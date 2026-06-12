'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';
import { moderateArticle } from '@/actions/reporter';

export default function NewsModerationClient({ initialArticles }: { initialArticles: any[] }) {
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenReview = (art: any) => {
    setSelectedArticle(art);
  };

  const handleCloseReview = () => {
    setSelectedArticle(null);
  };

  const handleModerate = async (action: 'Approve' | 'Reject') => {
    if (!selectedArticle) return;
    setIsProcessing(true);

    try {
      const res = await moderateArticle(selectedArticle.id, action);
      if (res.success) {
        alert(action === 'Approve' ? 'Article published successfully!' : 'Article returned to correspondent drafts.');
        
        // Remove from current local pending list
        setArticles(prev => prev.filter(a => a.id !== selectedArticle.id));
        handleCloseReview();
      } else {
        alert('Action failed: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-shield-alt" style={{ color: '#ef4444' }}></i>
            <span>News Moderation Queue</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Audit correspondent submissions, edit credentials, fact-check stories, and authorize global publishings.
          </p>
        </div>
      </div>

      <div style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
        <div style={{ 
          background: '#ffffff', 
          padding: '16px 24px', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }}></span>
            <span>Pending Review Queue</span>
          </div>
          <span style={{ 
            background: '#eeebff', 
            color: '#4f46e5', 
            fontSize: '12px', 
            fontWeight: 800, 
            padding: '4px 12px', 
            borderRadius: '20px' 
          }}>
            {articles.length} articles waiting
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Submission Title & Details</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>संवाददाता का नाम</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Region</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Submission Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
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
                      <i className="fas fa-check-double" style={{ color: '#10b981' }}></i>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, display: 'block', color: '#475569' }}>All clear!</span>
                    <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>There are currently no reports in the moderation queue awaiting review.</span>
                  </td>
                </tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id} style={{
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                  }}>
                    <td style={{ 
                      padding: '16px 16px', 
                      borderTopLeftRadius: '12px', 
                      borderBottomLeftRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      borderRight: 'none',
                      verticalAlign: 'middle',
                      maxWidth: '380px'
                    }}>
                      <div style={{ fontWeight: 750, color: '#1e293b', fontSize: '14.5px', marginBottom: '6px', lineHeight: '1.4' }}>
                        {art.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                        <span style={{
                          padding: '2px 6px',
                          background: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          ID: #{art.id.slice(-6).toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>📍 {art.district}</span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none', 
                      borderRight: 'none',
                      verticalAlign: 'middle',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                      }}>
                        {art.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none', 
                      borderRight: 'none',
                      verticalAlign: 'middle',
                      color: '#475569',
                      fontWeight: 700
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}>
                          {art.reporter.charAt(0).toUpperCase()}
                        </div>
                        <span>{art.reporter}</span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none', 
                      borderRight: 'none',
                      verticalAlign: 'middle',
                      color: '#475569',
                      fontWeight: 600
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-map-marker-alt" style={{ color: '#f43f5e', fontSize: '13px' }}></i>
                        <span>{art.district}, {art.state}</span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none', 
                      borderRight: 'none',
                      verticalAlign: 'middle',
                      color: '#64748b',
                      fontSize: '13px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="far fa-calendar-alt" style={{ color: '#94a3b8' }}></i>
                        <span>{new Date(art.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      borderTopRightRadius: '12px', 
                      borderBottomRightRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none',
                      verticalAlign: 'middle',
                      textAlign: 'center'
                    }}>
                      <button 
                        onClick={() => handleOpenReview(art)} 
                        style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = '#1e293b';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                          e.currentTarget.style.color = '#334155';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                        }}
                      >
                        <i className="fas fa-clipboard-list"></i>
                        <span>Audit Article</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVIEW REPORT OVERLAY MODAL */}
      {selectedArticle && (
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
            maxWidth: '900px',
            overflow: 'hidden',
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
                  <i className="fas fa-shield-alt" style={{ color: '#4f46e5' }}></i>
                  <span>Editorial Review & Moderation</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Evaluate story content accuracy, check image assets, and approve for site-wide broadcasting.
                </p>
              </div>
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

            {/* Modal Body */}
            <div style={{ padding: '32px', flexGrow: 1, maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Category tag and Headline */}
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  marginBottom: '12px'
                }}>
                  {selectedArticle.category?.name || 'Uncategorized'}
                </span>
                
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', lineHeight: '1.35', margin: 0, letterSpacing: '-0.5px' }}>
                  {selectedArticle.title}
                </h1>
              </div>

              {/* Dossier Meta Info Panel */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px', 
                background: '#f8fafc', 
                padding: '16px 20px', 
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '13px' }}>
                  <span style={{ display: 'block', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>संवाददाता प्रोफ़ाइल</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-user-circle" style={{ color: '#4f46e5' }}></i>
                    {selectedArticle.reporter}
                  </span>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <span style={{ display: 'block', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Story Location</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-map-marker-alt" style={{ color: '#f43f5e' }}></i>
                    {selectedArticle.district}, {selectedArticle.state}
                  </span>
                </div>
                <div style={{ fontSize: '13px' }}>
                  <span style={{ display: 'block', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Submission Date</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="far fa-calendar-alt" style={{ color: '#10b981' }}></i>
                    {new Date(selectedArticle.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Featured Image */}
              {selectedArticle.imageUrl && (
                <div>
                  <h4 style={{ 
                    fontSize: '13.5px', 
                    fontWeight: 800, 
                    color: '#4f46e5', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '1px solid #f1f5f9', 
                    paddingBottom: '10px', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-image"></i>
                    <span>Featured Image Asset</span>
                  </h4>
                  <div style={{ 
                    border: '4px solid #f1f5f9', 
                    borderRadius: '16px', 
                    overflow: 'hidden', 
                    maxHeight: '380px', 
                    background: '#f8fafc',
                    boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.08)'
                  }}>
                    <img 
                      src={selectedArticle.imageUrl} 
                      alt="Featured Attachments" 
                      style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', display: 'block' }} 
                    />
                  </div>
                </div>
              )}

              {/* Story Content Wrapper */}
              <div>
                <h4 style={{ 
                  fontSize: '13.5px', 
                  fontWeight: 800, 
                  color: '#4f46e5', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  borderBottom: '1px solid #f1f5f9', 
                  paddingBottom: '10px', 
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fas fa-paragraph"></i>
                  <span>Article Copy / Text Content</span>
                </h4>
                
                <div 
                  style={{ 
                    background: '#fafaf9', 
                    border: '1px solid #e7e5e4', 
                    borderRadius: '16px', 
                    padding: '28px', 
                    fontSize: '15px', 
                    color: '#292524', 
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    minHeight: '220px',
                    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)'
                  }}
                >
                  {selectedArticle.content}
                </div>
              </div>

              {/* Moderation Controls */}
              <div style={{ 
                borderTop: '1px solid #f1f5f9', 
                paddingTop: '24px', 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                marginTop: '12px'
              }}>
                <button 
                  onClick={() => handleModerate('Reject')} 
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
                  disabled={isProcessing}
                >
                  <i className="fas fa-reply"></i>
                  <span>{isProcessing ? 'Processing...' : 'Reject & Return to Drafts'}</span>
                </button>
                <button 
                  onClick={() => handleModerate('Approve')} 
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
                  disabled={isProcessing}
                >
                  <i className="fas fa-globe"></i>
                  <span>{isProcessing ? 'Processing...' : 'Approve & Publish Live'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
