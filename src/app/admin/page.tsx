import React from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import { getDashboardStats, getNewsArticles, wipeAdminMockData } from '@/actions/news';
import DashboardClient from './DashboardClient'; // For client iteractivity like reset

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  // Get 5 most recent
  const recentNews = await getNewsArticles({ limit: 5 });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Dashboard Overview</h1>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/admin/news/add" style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}>
            <i className="fas fa-plus"></i> Submit News
          </Link>
          <DashboardClient />
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* TOTAL ARTICLES CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '8px' }}>Total Articles</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.totalArticles}</div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fas fa-newspaper"></i>
          </div>
        </div>

        {/* TOTAL VIEWS CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '8px' }}>Total Views</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.totalViews.toLocaleString()}</div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fas fa-eye"></i>
          </div>
        </div>

        {/* ACTIVE REPORTERS CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '8px' }}>सक्रिय संवाददातागण (Correspondents)</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.activeReporters}</div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#f5f3ff',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fas fa-user-tie"></i>
          </div>
        </div>

        {/* PENDING APPROVALS CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '8px' }}>Pending Approvals</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stats.pendingApprovals > 0 ? '#ea580c' : '#0f172a' }}>{stats.pendingApprovals}</div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: stats.pendingApprovals > 0 ? '#fff7ed' : '#f8fafc',
            color: stats.pendingApprovals > 0 ? '#ea580c' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fas fa-clock"></i>
          </div>
        </div>

        {/* PUBLISHED TODAY CARD */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.75px', marginBottom: '8px' }}>Published Today</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.todayPublished}</div>
          </div>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#fef2f2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            <i className="fas fa-calendar-check"></i>
          </div>
        </div>

      </div>

      {/* Premium Recent Activity list */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.05)'
      }}>
        <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-history" style={{ color: '#ef4444' }}></i> Recent Activity
          </div>
          <Link href="/admin/news" style={{
            padding: '8px 16px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none'
          }}>
            View All
          </Link>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Title</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>संवाददाता</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentNews.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    No recent news articles found.
                  </td>
                </tr>
              ) : (
                recentNews.map((item) => (
                  <tr key={item.id} style={{
                    background: '#f8fafc',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                    borderRadius: '8px'
                  }}>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#1e293b', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', border: '1px solid #e2e8f0', borderRight: 'none' }}>
                      {item.title}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      <span style={{
                        padding: '3px 8px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        color: '#334155'
                      }}>
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      {item.reporter}
                    </td>
                    <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: item.status === 'Published' ? '#ecfdf5' : item.status === 'Pending' ? '#fff7ed' : '#f1f5f9',
                        color: item.status === 'Published' ? '#16a34a' : item.status === 'Pending' ? '#ea580c' : '#475569',
                        border: `1px solid ${item.status === 'Published' ? '#16a34a30' : item.status === 'Pending' ? '#ea580c30' : '#47556930'}`
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                      {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

