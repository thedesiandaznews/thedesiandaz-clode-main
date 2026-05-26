'use client';

import React from 'react';
import styles from './admin.module.css';
import { wipeAdminMockData } from '@/actions/news';

export default function DashboardClient() {
  const handleClear = async () => {
    if(confirm('Are you sure you want to delete all database articles? This action cannot be undone.')) {
      await wipeAdminMockData();
    }
  };

  return (
    <button onClick={handleClear} className={styles.btnDanger}>
      <i className="fas fa-trash-alt"></i> Reset Data
    </button>
  );
}
