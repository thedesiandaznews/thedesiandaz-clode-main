'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { verifyAdminLogin } from '@/actions/settings';

export default function AdminLogin() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check credentials against the database securely
    const result = await verifyAdminLogin(userId, password);

    if (result.success) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      router.push('/admin');
    } else {
      setError('Invalid ID or Password. Check your credentials.');
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginBox}>
        <div className={styles.loginTitle}>
          <span style={{ color: '#CC2200' }}>Admin</span> Portal
        </div>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Admin ID</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. admin"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input 
              type="password" 
              className={styles.formInput} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
