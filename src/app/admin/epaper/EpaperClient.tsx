'use client';

import React, { useState } from 'react';
import { addEpaper, deleteEpaper } from '@/actions/epaper';
import { uploadFileAction } from '@/actions/upload';
import styles from '../admin.module.css';

export default function EpaperClient({ initialEpapers }: { initialEpapers: any[] }) {
  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [epapers, setEpapers] = useState(initialEpapers);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    pdfUrl: '',
    title: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdfUrl) {
      alert('Please upload a PDF file first.');
      return;
    }
    setLoading(true);
    
    const submissionData = {
      date: formData.date,
      pdfUrl: formData.pdfUrl,
      title: formData.title,
      thumbnailUrl: '',
      pages: '[]'
    };

    const res = await addEpaper(submissionData);
    if (res.success) {
      alert('E-Paper saved successfully!');
      window.location.reload();
    } else {
      alert('Error: ' + res.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await deleteEpaper(id);
    if (res.success) {
      setEpapers(epapers.filter(p => p.id !== id));
    }
  };

  return (
    <div className={styles.adminPage}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>E-Paper Management</h1>
          <p className={styles.pageSubtitle} style={{ margin: '4px 0 0' }}>Upload and manage daily E-Paper PDF links</p>
        </div>
      </header>

      <div className={styles.epaperGrid}>
        {/* Form */}
        {/* Form */}
        <section className={styles.card} style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', fontWeight: 700 }}>Add / Update E-Paper</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Publication Date</label>
              <input 
                type="date" 
                className={styles.formInput} 
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>PDF File (High Quality)</label>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const uploadFormData = new FormData();
                  uploadFormData.append('file', file);
                  const result = await uploadFileAction(uploadFormData);
                  if (!result.success) {
                    alert('PDF upload failed: ' + result.message);
                    return;
                  }
                  setFormData({ ...formData, pdfUrl: result.url || '' });
                }}
                style={{ fontSize: '12px', marginBottom: '8px' }}
              />
              {formData.pdfUrl && <div style={{ fontSize: '10px', color: '#10b981' }}>Uploaded: {formData.pdfUrl}</div>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Title (Optional)</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g. Ranchi Edition"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Saving...' : 'Save E-Paper (PDF)'}
            </button>
          </form>
        </section>

        {/* List */}
        <section className={styles.card} style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ fontWeight: 700 }}>Available E-Papers</h2>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.premiumTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Links</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {epapers.length > 0 ? epapers.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.date).toLocaleDateString()}</td>
                    <td>{p.title || '-'}</td>
                    <td>
                      {p.pdfUrl && <a href={p.pdfUrl} target="_blank" style={{ color: 'var(--blue)', fontSize: '12px', marginRight: '10px' }}>PDF</a>}
                    </td>
                    <td>
                      <button onClick={() => {
                        setFormData({
                          date: new Date(p.date).toISOString().split('T')[0],
                          pdfUrl: p.pdfUrl || '',
                          title: p.title || ''
                        });
                        window.scrollTo(0, 0);
                      }} style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', marginRight: '10px' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button onClick={() => handleDelete(p.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No E-Papers uploaded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
