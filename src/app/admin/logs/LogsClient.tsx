'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';

export default function LogsClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Filter lists
  const roles = [
    'ALL',
    'BLOCK_CORRESPONDENT',
    'DISTRICT_CORRESPONDENT',
    'STATE_CORRESPONDENT',
    'COMPANY_ADMIN',
    'PRINT_ADMIN',
    'SUPER_ADMIN',
    'SYSTEM'
  ];

  const actions = [
    'ALL',
    'Login',
    'Logout',
    'KYC Submission',
    'KYC Approval',
    'KYC Rejection',
    'News Submission',
    'News Review',
    'News Approval',
    'News Rejection',
    'Correction Requested',
    'Website Publishing',
    'Print Publishing'
  ];

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.remarks && log.remarks.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = selectedRole === 'ALL' || log.role === selectedRole;
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesRole && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Login':
      case 'Logout':
        return { bg: '#e0f2fe', text: '#0369a1' }; // Blue
      case 'KYC Submission':
      case 'News Submission':
        return { bg: '#fef3c7', text: '#d97706' }; // Amber
      case 'KYC Approval':
      case 'News Approval':
      case 'Website Publishing':
      case 'Print Publishing':
        return { bg: '#dcfce7', text: '#15803d' }; // Green
      case 'KYC Rejection':
      case 'News Rejection':
        return { bg: '#fee2e2', text: '#b91c1c' }; // Red
      case 'Correction Requested':
      case 'News Review':
        return { bg: '#f3e8ff', text: '#6b21a8' }; // Purple
      default:
        return { bg: '#f1f5f9', text: '#475569' }; // Gray
    }
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-history" style={{ color: '#6366f1' }}></i>
            <span>System Activity Logs</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Audit logins, news editorial stages, database changes, and publisher approvals across the system hierarchy.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Search */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Search Logs
          </label>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search by name, email, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filter by User Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#1e293b',
              outline: 'none'
            }}
          >
            {roles.map(r => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Filter by Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#1e293b',
              outline: 'none'
            }}
          >
            {actions.map(a => (
              <option key={a} value={a}>
                {a === 'ALL' ? 'All Actions' : a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                <th style={{ padding: '14px 18px', fontWeight: 'bold' }}>Timestamp / IP</th>
                <th style={{ padding: '14px 18px', fontWeight: 'bold' }}>Actor Details</th>
                <th style={{ padding: '14px 18px', fontWeight: 'bold' }}>Role</th>
                <th style={{ padding: '14px 18px', fontWeight: 'bold' }}>Action</th>
                <th style={{ padding: '14px 18px', fontWeight: 'bold' }}>Details / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 40px', color: '#94a3b8' }}>
                    <i className="fas fa-history" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px', display: 'block' }}></i>
                    <span style={{ fontWeight: 700, color: '#475569', fontSize: '14px' }}>No matching activity logs found.</span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const colors = getActionBadgeColor(log.action);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                      {/* Timestamp & IP */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 650, color: '#1e293b' }}>
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                          🌐 {log.ipAddress}
                        </div>
                      </td>

                      {/* Actor Details */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 750, color: '#0f172a' }}>{log.userName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{log.userEmail}</div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '3px 8px',
                          background: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 750
                        }}>
                          {log.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: colors.bg,
                          color: colors.text,
                          borderRadius: '20px',
                          fontSize: '11.5px',
                          fontWeight: 800
                        }}>
                          {log.action}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', color: '#475569', lineHeight: '1.4' }}>
                        {log.remarks || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
