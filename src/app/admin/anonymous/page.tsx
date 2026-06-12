'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { getAllContributors, updateContributorStatus } from '@/actions/community';

export default function AdminContributorsPage() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContributors();
  }, []);

  const loadContributors = async () => {
    setIsLoading(true);
    const res = await getAllContributors();
    if (res.success) {
      setContributors(res.contributors);
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (confirm(`Change contributor status to ${newStatus}?`)) {
      const res = await updateContributorStatus(id, newStatus);
      if (res.success) {
        loadContributors();
      } else {
        alert('Update failed');
      }
    }
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-user-secret" style={{ color: '#ef4444' }}></i>
            <span>Anonymous Contributors</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Manage secure community reporting accounts and audit active whistleblower authorizations.
          </p>
        </div>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
        color: '#92400e', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        marginBottom: '28px', 
        fontSize: '13.5px', 
        border: '1px solid #fde68a',
        boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0
        }}>
          <i className="fas fa-shield-alt"></i>
        </div>
        <div>
          <span style={{ fontWeight: 800, display: 'block', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', color: '#b45309' }}>Privacy Lock Active</span>
          <span style={{ fontWeight: 600 }}>
            Full Names and Mobile Numbers are fully encrypted and completely hidden from Admin view to protect Whistleblowers. Identify users strictly by their secure <b>Contributor ID</b>.
          </span>
        </div>
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
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Loading secure database...</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Decrypting records and establishing secure tunnel...</p>
          </div>
        ) : contributors.length === 0 ? (
          <div style={{ 
            padding: '60px 40px', 
            textAlign: 'center', 
            color: '#64748b',
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '12px' }}>
              <i className="fas fa-users-slash"></i>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, display: 'block', color: '#475569' }}>No contributors found</span>
            <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>There are currently no anonymous correspondent accounts recorded in the system.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Secure Contributor Info</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Location & GPS</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Status State</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributors.map((contributor) => (
                  <tr key={contributor.id} style={{
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
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {contributor.selfieUrl ? (
                          <img 
                            src={contributor.selfieUrl} 
                            alt="Profile" 
                            style={{ 
                              width: '42px', 
                              height: '42px', 
                              borderRadius: '50%', 
                              objectFit: 'cover',
                              border: '2px solid #e2e8f0',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)'
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            width: '42px', 
                            height: '42px', 
                            borderRadius: '50%', 
                            background: '#f8fafc', 
                            border: '1px solid #cbd5e1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#475569', 
                            fontSize: '18px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                          }}>
                            <i className="fas fa-user-secret"></i>
                          </div>
                        )}
                        <div>
                          <div style={{ 
                            fontWeight: 800, 
                            fontSize: '14.5px', 
                            color: '#4f46e5', 
                            fontFamily: 'monospace',
                            background: '#eeebff',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            width: 'fit-content',
                            marginBottom: '4px'
                          }}>
                            {contributor.contributorId || 'MIGRATING...'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Joined: {new Date(contributor.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
                      borderLeft: 'none', 
                      borderRight: 'none',
                      verticalAlign: 'middle'
                    }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px', marginBottom: '2px' }}>{contributor.district}, {contributor.state}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>{contributor.block || 'N/A'} • {contributor.area || 'N/A'}</div>
                      {contributor.locationLat && contributor.locationLng ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', color: '#4f46e5', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eeebff', padding: '2px 8px', borderRadius: '6px' }}>
                            <i className="fas fa-satellite"></i> GPS: {contributor.locationLat.toFixed(4)}, {contributor.locationLng.toFixed(4)}
                          </span>
                          <a 
                            href={`https://maps.google.com/?q=${contributor.locationLat},${contributor.locationLng}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              fontSize: '11.5px', 
                              color: '#059669', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              textDecoration: 'none', 
                              fontWeight: 700 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <i className="fas fa-map-marker-alt"></i> View on Map
                          </a>
                        </div>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fas fa-satellite-dish"></i> No GPS Data
                        </span>
                      )}
                    </td>

                    <td style={{ 
                      padding: '16px 16px', 
                      border: '1px solid #e2e8f0', 
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
                        background: contributor.status === 'Active' ? '#ecfdf5' : contributor.status === 'Suspended' ? '#fff7ed' : '#f1f5f9',
                        color: contributor.status === 'Active' ? '#16a34a' : contributor.status === 'Suspended' ? '#ea580c' : '#475569',
                        border: `1px solid ${contributor.status === 'Active' ? '#16a34a30' : contributor.status === 'Suspended' ? '#ea580c30' : '#47556930'}`
                      }}>
                        {contributor.status}
                      </span>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {contributor.status !== 'Active' && (
                          <button 
                            onClick={() => handleStatusUpdate(contributor.id, 'Active')} 
                            style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              padding: '8px 16px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#059669';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
                              e.currentTarget.style.color = '#059669';
                              e.currentTarget.style.borderColor = '#a7f3d0';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-check"></i> Activate
                          </button>
                        )}
                        {contributor.status !== 'Suspended' && (
                          <button 
                            onClick={() => handleStatusUpdate(contributor.id, 'Suspended')} 
                            style={{
                              background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                              border: '1px solid #fca5a5',
                              color: '#b91c1c',
                              padding: '8px 16px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#dc2626';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)';
                              e.currentTarget.style.color = '#b91c1c';
                              e.currentTarget.style.borderColor = '#fca5a5';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <i className="fas fa-ban"></i> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
