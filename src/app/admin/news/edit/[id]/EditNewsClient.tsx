'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../admin.module.css';
import { updateNewsArticle } from '@/actions/news';
import { uploadImage } from '@/actions/upload';
import { stateDistricts as statesAndDistricts } from '@/lib/localization';
const allStates = Object.keys(statesAndDistricts);

export default function EditNewsClient({ article, categories }: { article: any, categories: any[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: article.title,
    categoryId: article.categoryId,
    state: article.state || 'Jharkhand',
    district: article.district || 'Ranchi',
    reporter: article.reporter,
    content: article.content
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(article.imageUrl);

  // SEO States
  const [seoTitle, setSeoTitle] = useState(article.seoTitle || '');
  const [seoDesc, setSeoDesc] = useState(article.seoDesc || '');
  const [seoKeys, setSeoKeys] = useState(article.seoKeys || '');
  const [activeSeoTab, setActiveSeoTab] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');

  // Sync title with SEO Title on first type if SEO Title was empty
  useEffect(() => {
    if (formData.title && !article.seoTitle && !seoTitle) {
      setSeoTitle(formData.title.substring(0, 60));
    }
  }, [formData.title]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'state') {
        newData.district = statesAndDistricts[value][0] || '';
      }
      return newData;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) setImagePreview(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time SEO checklist auditor
  const auditSEO = () => {
    const checks = [];
    let score = 0;

    // 1. Title Checks
    if (seoTitle.length === 0) {
      checks.push({ status: 'error', text: 'Meta Title is missing' });
    } else if (seoTitle.length < 30) {
      checks.push({ status: 'warning', text: `Meta Title is too short (${seoTitle.length} chars). Ideal: 45-60.` });
      score += 20;
    } else if (seoTitle.length >= 45 && seoTitle.length <= 60) {
      checks.push({ status: 'success', text: 'Meta Title is perfectly optimized (45-60 chars)' });
      score += 40;
    } else if (seoTitle.length > 60) {
      checks.push({ status: 'warning', text: `Meta Title is too long (${seoTitle.length} chars) and will be truncated.` });
      score += 25;
    } else {
      checks.push({ status: 'success', text: 'Meta Title is a good length' });
      score += 35;
    }

    // 2. Description Checks
    if (seoDesc.length === 0) {
      checks.push({ status: 'error', text: 'Meta Description is missing' });
    } else if (seoDesc.length < 80) {
      checks.push({ status: 'warning', text: `Meta Description is too short (${seoDesc.length} chars). Ideal: 120-160.` });
      score += 20;
    } else if (seoDesc.length >= 120 && seoDesc.length <= 160) {
      checks.push({ status: 'success', text: 'Meta Description is perfectly optimized (120-160 chars)' });
      score += 40;
    } else if (seoDesc.length > 160) {
      checks.push({ status: 'warning', text: `Meta Description is too long (${seoDesc.length} chars) and will be truncated.` });
      score += 25;
    } else {
      checks.push({ status: 'success', text: 'Meta Description is a good length' });
      score += 35;
    }

    // 3. Keywords Checks
    const keysCount = seoKeys ? seoKeys.split(',').filter((k: string) => k.trim()).length : 0;
    if (keysCount === 0) {
      checks.push({ status: 'error', text: 'Focus keywords are missing' });
    } else if (keysCount < 3) {
      checks.push({ status: 'warning', text: `Add more focus keywords (${keysCount} added. Target at least 3).` });
      score += 10;
    } else {
      checks.push({ status: 'success', text: `Excellent keyword targeting (${keysCount} keywords set)` });
      score += 20;
    }

    return { checks, score };
  };

  const seoAudit = auditSEO();

  const getScoreColor = (score: number) => {
    if (score < 40) return '#ef4444'; // Red
    if (score < 75) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  const handleSubmit = async (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId) return alert('Title and Category are required');
    
    setIsSubmitting(true);

    let imageUrl = imagePreview || '';
    if (imageFile) {
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile);
      const uploadRes = await uploadImage(uploadFormData);
      if (uploadRes.success) {
        imageUrl = uploadRes.url!;
      } else {
        alert('Image upload failed: ' + uploadRes.message);
        setIsSubmitting(false);
        return;
      }
    }
    
    const res = await updateNewsArticle(article.id, {
      ...formData,
      status, 
      imageUrl: imageUrl || undefined,
      seoTitle: seoTitle || undefined,
      seoDesc: seoDesc || undefined,
      seoKeys: seoKeys || undefined
    });
    
    setIsSubmitting(false);

    if (res.success) {
      router.push('/admin/news');
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/news" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <i className="fas fa-arrow-left"></i> Back to News
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Edit News Article</h1>
        </div>
      </div>

      <div className={styles.twoColGrid}>
        {/* Left Column: Editor & SEO Suite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Content Box */}
          <div className={styles.tableContainer} style={{ padding: '32px', border: '1px solid #f3f4f6' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Article Title</label>
              <input 
                type="text" 
                name="title"
                className={styles.formInput} 
                placeholder="Enter comprehensive headline..." 
                style={{ fontSize: '18px', padding: '16px' }}
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Content (Rich Text Mock)</label>
              <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f3f4f6', padding: '10px 16px', display: 'flex', gap: '12px', borderBottom: '1px solid #d1d5db' }}>
                  <i className="fas fa-bold" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <i className="fas fa-italic" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <i className="fas fa-underline" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }}></div>
                  <i className="fas fa-list-ul" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <i className="fas fa-list-ol" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <i className="fas fa-link" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                  <i className="fas fa-image" style={{ cursor: 'pointer', color: '#4b5563' }}></i>
                </div>
                <textarea 
                  name="content"
                  className={styles.formTextarea} 
                  style={{ border: 'none', borderRadius: '0' }}
                  placeholder="Write the full report here..."
                  value={formData.content}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Yoast SEO Suite Card */}
          <div className={styles.tableContainer} style={{ padding: '32px', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: '#ecfdf5', color: '#059669', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '18px' }}>
                  <i className="fas fa-magic"></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Yoast Advanced SEO Optimizer</h3>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Tune article visual rendering in search engines and social feeds.</p>
                </div>
              </div>
              
              {/* Quality Audit Meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>SEO Score:</span>
                <div style={{ background: getScoreColor(seoAudit.score), color: '#fff', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}>
                  {seoAudit.score}/100
                </div>
              </div>
            </div>

            {/* Score progress bar */}
            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ width: `${seoAudit.score}%`, height: '100%', background: getScoreColor(seoAudit.score), borderRadius: '3px', transition: 'width 0.4s ease-out' }}></div>
            </div>

            {/* Preview and Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #f1f5f9', paddingBottom: '1px', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => setActiveSeoTab('google')}
                style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'google' ? 'var(--primary)' : '#64748b', borderBottom: activeSeoTab === 'google' ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fab fa-google" /> Google Search
              </button>
              <button 
                type="button"
                onClick={() => setActiveSeoTab('facebook')}
                style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'facebook' ? '#1877f2' : '#64748b', borderBottom: activeSeoTab === 'facebook' ? '3px solid #1877f2' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fab fa-facebook" /> Facebook Share
              </button>
              <button 
                type="button"
                onClick={() => setActiveSeoTab('twitter')}
                style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'twitter' ? '#000' : '#64748b', borderBottom: activeSeoTab === 'twitter' ? '3px solid #000' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fab fa-x-twitter" /> Twitter X
              </button>
            </div>

            {/* Google snippet simulator */}
            {activeSeoTab === 'google' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Snippet Simulator Preview</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button type="button" onClick={() => setPreviewDevice('mobile')} style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', background: previewDevice === 'mobile' ? '#e2e8f0' : 'transparent', border: 'none', cursor: 'pointer' }}><i className="fas fa-mobile-alt" /> Mobile</button>
                    <button type="button" onClick={() => setPreviewDevice('desktop')} style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', background: previewDevice === 'desktop' ? '#e2e8f0' : 'transparent', border: 'none', cursor: 'pointer' }}><i className="fas fa-desktop" /> Desktop</button>
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #dadce0', borderRadius: previewDevice === 'mobile' ? '12px' : '8px', padding: '12px', maxWidth: previewDevice === 'mobile' ? '360px' : '100%', fontFamily: 'arial, sans-serif', boxShadow: '0 1px 6px rgba(32,33,36,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>N</div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#202124', lineHeight: '1.2' }}>The Desi Andaz</div>
                      <div style={{ fontSize: '10px', color: '#5f6368', lineHeight: '1.2' }}>https://thedesiandaz.com <span style={{ color: '#70757a' }}>› news › ...</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: previewDevice === 'mobile' ? '18px' : '17px', color: '#1a0dab', lineHeight: '1.3', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {seoTitle || 'E.g., Article Title Headline | The Desi Andaz'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#4d5156', lineHeight: '1.4' }}>
                    <span style={{ color: '#70757a' }}>{new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })} — </span>
                    {seoDesc || 'Please enter a Meta Description in the inputs below to simulate Google search engine display snippet preview...'}
                  </div>
                </div>
              </div>
            )}

            {/* Facebook snippet simulator */}
            {activeSeoTab === 'facebook' && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Facebook Preview Card</span>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', maxWidth: '360px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  <div style={{ width: '100%', height: '180px', background: imagePreview ? `url(${imagePreview}) center/cover no-repeat` : '#f3f4f6', display: !imagePreview ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>
                    <i className="far fa-image" style={{ marginRight: '6px' }} /> Thumbnail image matches featured image
                  </div>
                  {imagePreview && (
                    <img src={imagePreview} alt="FB share" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '10px', background: '#f2f3f5' }}>
                    <div style={{ fontSize: '10px', color: '#606770', textTransform: 'uppercase' }}>thedesiandaz.com</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d2129', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {seoTitle || 'E.g., Article Title Headline'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#606770', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                      {seoDesc || 'Configure the Meta Description for optimal layout rendering.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Twitter snippet simulator */}
            {activeSeoTab === 'twitter' && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Twitter X Card Preview</span>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', background: '#fff', maxWidth: '340px', fontFamily: 'sans-serif' }}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Twitter share" style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '170px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>No Thumbnail Image Uploaded</div>
                  )}
                  <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#536471' }}>thedesiandaz.com</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f1419', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {seoTitle || 'E.g., Article Title Headline'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#536471', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                      {seoDesc || 'Configure description to catch reader attention on feeds.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className={styles.formLabel} style={{ margin: 0 }}>Custom SEO Meta Title</label>
                  <span style={{ fontSize: '11px', color: seoTitle.length >= 45 && seoTitle.length <= 60 ? '#10b981' : '#64748b', fontWeight: 600 }}>{seoTitle.length} chars (Ideal: 45-60)</span>
                </div>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={seoTitle} 
                  onChange={(e) => setSeoTitle(e.target.value)} 
                  placeholder="Leave empty to use main article title..." 
                />
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className={styles.formLabel} style={{ margin: 0 }}>Custom SEO Meta Description</label>
                  <span style={{ fontSize: '11px', color: seoDesc.length >= 120 && seoDesc.length <= 160 ? '#10b981' : '#64748b', fontWeight: 600 }}>{seoDesc.length} chars (Ideal: 120-160)</span>
                </div>
                <textarea 
                  className={styles.formInput} 
                  style={{ minHeight: '70px', padding: '10px' }}
                  value={seoDesc} 
                  onChange={(e) => setSeoDesc(e.target.value)} 
                  placeholder="Short, keyword-rich summaries..." 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Focus Keywords (Comma separated)</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={seoKeys} 
                  onChange={(e) => setSeoKeys(e.target.value)} 
                  placeholder="E.g., breaking news, bihar news, politics" 
                />
              </div>
            </div>

            {/* Checklist */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>SEO Checklist:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {seoAudit.checks.map((check, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                    <span style={{ color: check.status === 'success' ? '#10b981' : check.status === 'warning' ? '#eab308' : '#ef4444' }}>
                      <i className={check.status === 'success' ? 'fas fa-check-circle' : check.status === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-times-circle'} />
                    </span>
                    <span>{check.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className={styles.tableContainer} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Publishing Settings</h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button 
                disabled={isSubmitting}
                className={styles.btnSecondary} 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={(e) => handleSubmit(e, 'Draft')}
              >
                Save as Draft
              </button>
              <button 
                disabled={isSubmitting}
                className={styles.btnPrimary} 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={(e) => handleSubmit(e, 'Published')}
              >
                Update & Publish
              </button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select name="categoryId" className={styles.formSelect} value={formData.categoryId} onChange={handleInputChange}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>संवाददाता का नाम</label>
              <input type="text" name="reporter" className={styles.formInput} placeholder="संवाददाता का नाम..." value={formData.reporter} onChange={handleInputChange}/>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Current Status</label>
              <span className={`${styles.statusBadge} ${article.status === 'Published' ? styles.statusPublished : article.status === 'Pending' ? styles.statusPending : styles.statusDraft}`}>
                {article.status}
              </span>
            </div>
          </div>

          <div className={styles.tableContainer} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Localization</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>State</label>
              <select name="state" className={styles.formSelect} value={formData.state} onChange={handleInputChange}>
                {allStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>District / City</label>
              <select name="district" className={styles.formSelect} value={formData.district} onChange={handleInputChange}>
                {statesAndDistricts[formData.state]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.tableContainer} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Featured Image</h3>
            
            <div className={styles.imageUploadArea} onClick={() => document.getElementById('imageUpload')?.click()}>
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px' }}>Click to Change</div>
                </div>
              ) : (
                <>
                  <i className={`fas fa-cloud-upload-alt ${styles.imageUploadIcon}`}></i>
                  <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Click to browse image here</p>
                </>
              )}
            </div>
            <input type="file" id="imageUpload" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
