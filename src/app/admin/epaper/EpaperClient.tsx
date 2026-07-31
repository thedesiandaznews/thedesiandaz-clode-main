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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    pdfUrl: '',
    title: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pdfUrl && !selectedFile) {
      alert('Please upload a PDF file or paste a direct PDF URL first.');
      return;
    }
    setLoading(true);
    
    try {
      if (selectedFile) {
        // Single-request upload and save directly via API route (bypasses Server Actions payload overhead)
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('date', formData.date);
        uploadFormData.append('title', formData.title);

        const response = await fetch('/api/epaper/upload', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'API upload and save failed');
        }
      } else {
        // Save URL string via Server Action
        const submissionData = {
          date: formData.date,
          pdfUrl: formData.pdfUrl,
          title: formData.title,
          thumbnailUrl: '',
          pages: '[]'
        };

        const res = await addEpaper(submissionData);
        if (!res.success) {
          throw new Error(res.message || 'Failed to save E-Paper link');
        }
      }

      alert('E-Paper saved successfully!');
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert('Failed to save E-Paper: ' + (err.message || 'An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>PDF File or Direct URL</label>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedFile(file);
                  setFormData({ ...formData, pdfUrl: '' }); // Clear manual url input if file selected
                }}
                style={{ fontSize: '12px', marginBottom: '8px' }}
                disabled={loading}
              />
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>— OR —</div>
              <input 
                type="text"
                className={styles.formInput}
                placeholder="Paste direct PDF URL (e.g. Google Drive, Dropbox link)"
                value={formData.pdfUrl}
                onChange={e => {
                  setFormData({ ...formData, pdfUrl: e.target.value });
                  setSelectedFile(null); // Clear selected file if manual url typed
                }}
                disabled={loading}
              />
              {(selectedFile || formData.pdfUrl) && (
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '6px', wordBreak: 'break-all' }}>
                  Selected: {selectedFile ? `File: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)` : (formData.pdfUrl.startsWith('data:') ? 'Base64 Uploaded File' : formData.pdfUrl)}
                </div>
              )}
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
                        setSelectedFile(null);
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
