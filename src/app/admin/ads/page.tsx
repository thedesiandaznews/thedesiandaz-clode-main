import React from 'react';
import { getAdCategories } from '@/actions/ads';
import { getAdClients } from '@/actions/client-ads';
import AdminAdsDashboardClient from './AdminAdsDashboardClient';
import styles from '../admin.module.css';


export default async function AdsManagementPage() {
  const categories = await getAdCategories();
  const clients = await getAdClients();

  // Ensure dates are correctly typed/serialized for Client Component
  const serializedCategories = categories.map(cat => ({
    ...cat,
    createdAt: new Date(cat.createdAt),
    updatedAt: new Date(cat.updatedAt),
    banners: cat.banners.map(b => ({
      ...b,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt)
    }))
  }));

  const serializedClients = clients.map(client => ({
    ...client,
    createdAt: new Date(client.createdAt),
    updatedAt: new Date(client.updatedAt),
    ads: client.ads.map(ad => ({
      ...ad,
      startDate: ad.startDate ? new Date(ad.startDate) : null,
      endDate: ad.endDate ? new Date(ad.endDate) : null,
      createdAt: new Date(ad.createdAt),
      updatedAt: new Date(ad.updatedAt)
    }))
  }));

  return (
    <div className={styles.contentArea}>
      <div className={styles.tableHeader}>
        <div>
          <h1 className={styles.tableTitle}>Ads & Monetization Center</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Manage simple ad slots or dynamic scheduled client campaigns with real-time analytics tracking.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '28px' }}>
        <AdminAdsDashboardClient 
          initialCategories={serializedCategories} 
          initialClients={serializedClients}
        />
      </div>
    </div>
  );
}
