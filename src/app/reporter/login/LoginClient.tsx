'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../reporter.module.css';
import { loginReporter } from '@/actions/reporter';

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const isReporterLoggedIn = localStorage.getItem('reporterId');
    if (isReporterLoggedIn) {
      router.push('/correspondent/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await loginReporter(email, password);
      
      if (res.success && res.reporter) {
        localStorage.setItem('reporterId', res.reporter.id);
        localStorage.setItem('reporterName', res.reporter.fullName);
        localStorage.setItem('reporterEmail', res.reporter.email);
        localStorage.setItem('reporterStatus', res.reporter.status);
        
        router.push('/correspondent/dashboard');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.reporterContainer}>
      <div className={`${styles.glassCard} ${styles.loginCard}`}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c' }}>DESI ANDAZ</span>
          </Link>
        </div>

        <h1 className={styles.cardTitle}>
          संवाददाता <span className={styles.highlightText}>न्यूज़रूम</span>
        </h1>
        <p className={styles.cardSubtitle}>
          Sign in to submit reports and manage your credentials
        </p>

        {error && (
          <div 
            style={{ 
              background: '#fee2e2', 
              border: '1px solid #fca5a5', 
              color: '#b91c1c', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              marginBottom: '20px', 
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input 
              type="email" 
              className={styles.input} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@desiandaz.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={styles.btnPrimary} 
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={styles.spinner}></span> Connecting...
              </div>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i> Enter Newsroom
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          Don't have a correspondent account?{' '}
          <Link href="/correspondent/register" style={{ color: '#ea580c', fontWeight: '700', textDecoration: 'none' }}>
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
}
