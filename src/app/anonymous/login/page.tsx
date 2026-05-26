'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginContributor } from '@/actions/community';
import styles from '../join/join.module.css'; // Reusing styles from join page

export default function CommunityLogin() {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile || !password) {
      setError('Please enter both mobile number and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginContributor(mobile, password);
      
      if (res.success && res.contributor) {
        // Mock authentication state (localStorage for demo purposes)
        // In a real app, use NextAuth, JWT cookies, or Supabase Auth
        localStorage.setItem('contributorAuth', JSON.stringify({
          id: res.contributor.id,
          fullName: res.contributor.fullName,
          status: res.contributor.status
        }));
        
        router.push('/anonymous/dashboard');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page} style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className={styles.container} style={{ maxWidth: '400px', width: '100%', background: '#ffffff', borderRadius: '24px', padding: '40px 30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', color: '#2563eb', marginBottom: '16px', fontSize: '28px' }}>
            <i className="fas fa-fingerprint"></i>
          </div>
          <h2 className={styles.title} style={{ color: '#0f172a', fontSize: '28px', marginBottom: '8px', fontWeight: 'bold' }}>Welcome Back</h2>
          <p className={styles.subtitle} style={{ color: '#475569', fontSize: '15px' }}>Login to the Secure Anonymous Dashboard</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
            <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Mobile Number</label>
            <input 
              type="tel" 
              className={styles.input} 
              placeholder="Enter 10-digit mobile" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              maxLength={10}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '30px' }}>
            <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Secure Password</label>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={isLoading} style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#fff', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }} onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'} onMouseOut={e => e.currentTarget.style.background = '#2563eb'}>
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          Don't have an Anonymous ID? <br/>
          <Link href="/anonymous/join" style={{ color: '#2563eb', fontWeight: 'bold', display: 'inline-block', marginTop: '8px', textDecoration: 'none' }}>
            Get one here
          </Link>
        </p>
      </div>
    </div>
  );
}
