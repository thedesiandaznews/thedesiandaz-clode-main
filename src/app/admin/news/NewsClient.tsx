'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { deleteNewsArticle, updateArticleStatus } from '@/actions/news';

export default function NewsClient({ initialNews, categories }: { initialNews: any[], categories: any[] }) {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logic
  const filteredNews = initialNews.filter(item => {
    if (filterCategory && item.category?.name !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteNewsArticle(id);
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const nextStatus: Record<string, string> = {
      'Draft': 'Pending',
      'Pending': 'Published',
      'Published': 'Draft'
    };
    await updateArticleStatus(id, nextStatus[currentStatus]);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>News Management</h1>
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
          transition: 'all 0.2s',
          textDecoration: 'none'
        }}>
          <i className="fas fa-plus"></i> Add New Record
        </Link>
      </div>

      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.05)'
      }}>
        {/* Modern Interactive Filters */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search news titles..." 
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '13px',
                background: '#f8fafc',
                transition: 'all 0.2s'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '13px',
              background: '#f8fafc',
              minWidth: '160px',
              cursor: 'pointer'
            }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select 
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '13px',
              background: '#f8fafc',
              minWidth: '160px',
              cursor: 'pointer'
            }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Card Row News Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Title & Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Analytics & Views</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Reporter</th>
                <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    No news articles found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredNews.map((item) => (
                  <tr key={item.id} style={{
                    background: '#f8fafc',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)',
                    borderRadius: '8px'
                  }}>
                    <td style={{ padding: '14px 16px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', border: '1px solid #e2e8f0', borderRight: 'none' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', marginBottom: '4px' }}>{item.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          padding: '2px 6px',
                          background: '#e0f2fe',
                          color: '#0369a1',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '10.5px'
                        }}>
                          {item.category?.name || 'Uncategorized'}
                        </span>
                        <span>•</span>
                        <span>📍 {item.state}, {item.district}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fas fa-eye" style={{ color: '#10b981' }}></i> {item.views.toLocaleString()} Views
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                        📅 {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      <button 
                        onClick={() => handleStatusChange(item.id, item.status)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none' }}
                        title="Click to cycle status"
                      >
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: item.status === 'Published' ? '#ecfdf5' : item.status === 'Pending' ? '#fff7ed' : '#f1f5f9',
                          color: item.status === 'Published' ? '#16a34a' : item.status === 'Pending' ? '#ea580c' : '#475569',
                          border: `1px solid ${item.status === 'Published' ? '#16a34a30' : item.status === 'Pending' ? '#ea580c30' : '#47556930'}`,
                          transition: 'all 0.2s'
                        }}>
                          {item.status}
                        </span>
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                      {item.reporter}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        <Link
                          href={`/admin/news/edit/${item.id}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            padding: '6px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          title="Edit News Record"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.title)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '6px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          title="Delete News Record"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
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
