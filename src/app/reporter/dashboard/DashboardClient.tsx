'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../reporter.module.css';
import { getReporterById, getReporterStats, getReporterArticles, submitReporterArticle, updateReporterArticle, updateReporterProfilePicture, getActiveReporterInBlock } from '@/actions/reporter';
import { getCategories } from '@/actions/categories';
import { uploadFileAction } from '@/actions/upload';
import { getReporterMessages, sendReporterMessage, markReporterMessagesAsRead, getUnreadMessageCount } from '@/actions/chat';
import { stateDistricts, allStates } from '@/lib/localization';
import RichTextEditor from '@/components/RichTextEditor';

export default function DashboardClient() {
  const router = useRouter();
  const [reporter, setReporter] = useState<any>(null);
  const [stats, setStats] = useState({ totalArticles: 0, publishedArticles: 0, pendingArticles: 0, draftArticles: 0, totalViews: 0 });
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBlockReporter, setActiveBlockReporter] = useState<any>(null);

  // Profile Picture Crop States
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0 });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [cropFitDim, setCropFitDim] = useState({ w: 280, h: 280 });

  // News Submission Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  // Form State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState('');
  const [newsAdditionalCategories, setNewsAdditionalCategories] = useState<string[]>([]);
  const [newsState, setNewsState] = useState('Jharkhand');
  const [newsDistrict, setNewsDistrict] = useState('Ranchi');
  const [newsContent, setNewsContent] = useState('');
  const [newsImageUrl, setNewsImageUrl] = useState('');
  const [newsUploadStatus, setNewsUploadStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  // Direct Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Poll for new messages every 4 seconds
  useEffect(() => {
    if (!reporter?.id) return;

    const fetchChatData = async () => {
      try {
        const count = await getUnreadMessageCount(reporter.id, 'Reporter');
        setUnreadMessages(count);

        if (isChatOpen) {
          const messages = await getReporterMessages(reporter.id);
          setChatMessages(messages);
          await markReporterMessagesAsRead(reporter.id, 'Reporter');
          setUnreadMessages(0);
        }
      } catch (e) {
        console.error('Error polling chat messages:', e);
      }
    };

    fetchChatData();
    const interval = setInterval(fetchChatData, 4000);
    return () => clearInterval(interval);
  }, [reporter?.id, isChatOpen]);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    if (isChatOpen) {
      const chatBody = document.getElementById('chatMessagesBody');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
  }, [chatMessages, isChatOpen]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !reporter?.id || isSendingMessage) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      reporterId: reporter.id,
      sender: 'Reporter',
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendReporterMessage(reporter.id, 'Reporter', text);
      if (res.success && res.message) {
        setChatMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Draft State
  const [draftExists, setDraftExists] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Auto-Save draft loop
  useEffect(() => {
    if (!isModalOpen || editingArticle || !reporter?.id) return;

    const interval = setInterval(() => {
      if (!newsTitle.trim() && !newsContent.trim()) return;

      setAutoSaveStatus('saving');
      
      const draft = {
        title: newsTitle,
        categoryId: newsCategory,
        additionalCategoryIds: newsAdditionalCategories,
        state: newsState,
        district: newsDistrict,
        content: newsContent,
        imageUrl: newsImageUrl,
        uploadStatus: newsUploadStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      localStorage.setItem(`desiandaz-reporter-draft-${reporter.id}`, JSON.stringify(draft));
      
      setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 600);

    }, 10000);

    return () => clearInterval(interval);
  }, [isModalOpen, editingArticle, newsTitle, newsCategory, newsState, newsDistrict, newsContent, newsImageUrl, newsUploadStatus, reporter?.id]);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const imageSrc = reader.result as string;
        setCropImageSrc(imageSrc);
        setCropZoom(1);
        setCropOffset({ x: 0, y: 0 });
        setIsCropModalOpen(true);

        const tempImg = new Image();
        tempImg.src = imageSrc;
        tempImg.onload = () => {
          const ratio = tempImg.naturalWidth / tempImg.naturalHeight;
          if (ratio > 1) {
            setCropFitDim({ w: 280 * ratio, h: 280 });
          } else {
            setCropFitDim({ w: 280, h: 280 / ratio });
          }
        };
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    setDragStartCrop({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    setCropOffset({
      x: e.clientX - dragStartCrop.x,
      y: e.clientY - dragStartCrop.y
    });
  };

  const handleMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDraggingCrop(true);
      setDragStartCrop({
        x: e.touches[0].clientX - cropOffset.x,
        y: e.touches[0].clientY - cropOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingCrop || e.touches.length !== 1) return;
    setCropOffset({
      x: e.touches[0].clientX - dragStartCrop.x,
      y: e.touches[0].clientY - dragStartCrop.y
    });
  };

  const handleTouchEnd = () => {
    setIsDraggingCrop(false);
  };

  const handleSaveAvatar = async () => {
    if (!cropImageSrc || !reporter?.id) return;
    setIsUploadingAvatar(true);

    try {
      const img = new Image();
      img.src = cropImageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get context');

      ctx.clearRect(0, 0, 300, 300);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);

      ctx.translate(150, 150);
      const scaleFactor = 300 / 280;
      ctx.translate(cropOffset.x * scaleFactor, cropOffset.y * scaleFactor);
      ctx.scale(cropZoom, cropZoom);

      const ratio = img.naturalWidth / img.naturalHeight;
      let canvasFitW = 300;
      let canvasFitH = 300;
      if (ratio > 1) {
        canvasFitH = 300;
        canvasFitW = 300 * ratio;
      } else {
        canvasFitW = 300;
        canvasFitH = 300 / ratio;
      }

      ctx.drawImage(img, -canvasFitW / 2, -canvasFitH / 2, canvasFitW, canvasFitH);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Crop failed.');
          setIsUploadingAvatar(false);
          return;
        }

        const croppedFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('image', croppedFile);
        formData.append('folder', 'profile');

        const uploadRes = await uploadFileAction(formData);
        if (uploadRes.success && uploadRes.url) {
          const saveRes = await updateReporterProfilePicture(reporter.id, uploadRes.url);
          if (saveRes.success) {
            setReporter((prev: any) => ({ ...prev, photoUrl: uploadRes.url }));
            setIsCropModalOpen(false);
            alert('Profile picture updated successfully!');
          } else {
            alert('Failed to save URL: ' + saveRes.message);
          }
        } else {
          alert('Upload failed: ' + uploadRes.message);
        }
        setIsUploadingAvatar(false);
      }, 'image/jpeg', 0.9);

    } catch (err: any) {
      alert('Error cropping image: ' + err.message);
      setIsUploadingAvatar(false);
    }
  };

  const fetchFreshData = useCallback(async (reporterId: string) => {
    try {
      const profile = await getReporterById(reporterId);
      if (profile) {
        setReporter(profile);
        localStorage.setItem('reporterStatus', profile.status);

        // Fetch if there is already an active reporter in their block
        const activeRep = await getActiveReporterInBlock(profile.block, profile.district, profile.state, profile.id);
        setActiveBlockReporter(activeRep);

        if (profile.status === 'Approved') {
          const [s, a, c] = await Promise.all([
            getReporterStats(reporterId),
            getReporterArticles(reporterId),
            getCategories()
          ]);
          setStats(s);
          setArticles(a);
          setCategories(c);
        }
      } else {
        // Redirection if session corrupt
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const reporterId = localStorage.getItem('reporterId');
    if (!reporterId) {
      router.push('/correspondent/login');
      return;
    }

    fetchFreshData(reporterId);
  }, [router, fetchFreshData]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/correspondent/login');
  };

  const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewsUploadStatus('uploading');

      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'news');

        const res = await uploadFileAction(formData);
        if (res.success && res.url) {
          setNewsImageUrl(res.url);
          setNewsUploadStatus('success');
        } else {
          setNewsUploadStatus('idle');
          alert('Upload failed: ' + (res.message || 'Unknown error'));
        }
      } catch (err) {
        setNewsUploadStatus('idle');
        console.error(err);
      }
    }
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setNewsState(selectedState);
    const districts = stateDistricts[selectedState];
    if (districts && districts.length > 0) {
      setNewsDistrict(districts[0]);
    }
  };

  const handleOpenCompose = (article: any = null) => {
    if (article) {
      setEditingArticle(article);
      setNewsTitle(article.title);
      setNewsCategory(article.categoryId);
      // Wait, we don't fetch additionalCategories for the reporter table currently. 
      // But we can reset it to empty array or populate if available.
      setNewsAdditionalCategories(article.additionalCategories?.map((c: any) => c.id) || []);
      setNewsState(article.state);
      setNewsDistrict(article.district);
      setNewsContent(article.content);
      setNewsImageUrl(article.imageUrl || '');
      setNewsUploadStatus(article.imageUrl ? 'success' : 'idle');
      setDraftExists(false);
    } else {
      setEditingArticle(null);
      setNewsTitle('');
      setNewsCategory(categories[0]?.id || '');
      setNewsAdditionalCategories([]);
      setNewsState('Jharkhand');
      setNewsDistrict('Ranchi');
      setNewsContent('');
      setNewsImageUrl('');
      setNewsUploadStatus('idle');
      
      // Check for auto-saved draft
      if (reporter?.id) {
        const saved = localStorage.getItem(`desiandaz-reporter-draft-${reporter.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setDraftData(parsed);
            setDraftExists(true);
          } catch (e) {
            console.error(e);
          }
        } else {
          setDraftExists(false);
        }
      } else {
        setDraftExists(false);
      }
    }
    setIsModalOpen(true);
  };

  const handleRestoreDraft = () => {
    if (draftData) {
      setNewsTitle(draftData.title);
      setNewsCategory(draftData.categoryId || categories[0]?.id || '');
      setNewsAdditionalCategories(draftData.additionalCategoryIds || []);
      setNewsState(draftData.state || 'Jharkhand');
      setNewsDistrict(draftData.district || 'Ranchi');
      setNewsContent(draftData.content || '');
      setNewsImageUrl(draftData.imageUrl || '');
      setNewsUploadStatus(draftData.uploadStatus || 'idle');
      setDraftExists(false);
    }
  };

  const handleDiscardDraft = () => {
    if (reporter?.id) {
      localStorage.removeItem(`desiandaz-reporter-draft-${reporter.id}`);
      setDraftExists(false);
      setDraftData(null);
    }
  };

  const handleCloseCompose = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    setAutoSaveStatus('idle');
  };

  const handleSaveArticle = async (status: 'Draft' | 'Pending') => {
    if (!newsTitle.trim() || !newsCategory || !newsContent.trim()) {
      alert('Title, Category, and Content are required.');
      return;
    }

    setIsSubmittingNews(true);

    try {
      if (editingArticle) {
        // Edit existing article
        const res = await updateReporterArticle(editingArticle.id, reporter.id, {
          title: newsTitle.trim(),
          categoryId: newsCategory,
          additionalCategoryIds: newsAdditionalCategories,
          state: newsState,
          district: newsDistrict,
          content: newsContent.trim(),
          imageUrl: newsImageUrl || undefined,
          status
        });

        if (res.success) {
          if (reporter?.id) {
            localStorage.removeItem(`desiandaz-reporter-draft-${reporter.id}`);
          }
          alert(status === 'Pending' ? 'News submitted for review!' : 'Draft updated successfully.');
          handleCloseCompose();
          fetchFreshData(reporter.id);
        } else {
          alert('Error: ' + res.message);
        }
      } else {
        // Submit new article
        const res = await submitReporterArticle({
          title: newsTitle.trim(),
          categoryId: newsCategory,
          additionalCategoryIds: newsAdditionalCategories,
          state: newsState,
          district: newsDistrict,
          content: newsContent.trim(),
          imageUrl: newsImageUrl || undefined,
          reporterId: reporter.id,
          reporterName: reporter.fullName,
          status
        });

        if (res.success) {
          if (reporter?.id) {
            localStorage.removeItem(`desiandaz-reporter-draft-${reporter.id}`);
          }
          alert(status === 'Pending' ? 'News submitted for review!' : 'Draft saved.');
          handleCloseCompose();
          fetchFreshData(reporter.id);
        } else {
          alert('Error: ' + res.message);
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setIsSubmittingNews(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.reporterContainer}>
        <span className={styles.spinner} style={{ width: '48px', height: '48px' }}></span>
        <p style={{ marginTop: '16px', color: '#6b7280', fontWeight: '500' }}>Entering Newsroom Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      
      {/* Header Panel */}
      <header className={styles.dashboardHeader}>
        <Link href="/" className={styles.dashboardBrand}>
          <i className="fas fa-newspaper"></i> DESI ANDAZ <span className={styles.brandSubtitle}>संवाददाता पैनल</span>
        </Link>

        <div className={styles.profileMenu}>
          <div className={`${styles.reporterBadge} ${reporter.status === 'Approved' ? styles.badgeApproved : reporter.status === 'Pending' ? styles.badgePending : styles.badgeRejected}`}>
            <i className={`fas ${reporter.status === 'Approved' ? 'fa-check-circle' : reporter.status === 'Pending' ? 'fa-hourglass-half' : reporter.status === 'Suspended' ? 'fa-ban' : 'fa-times-circle'}`}></i>
            <span>{reporter.status} Status</span>
          </div>
          
          <div className={styles.userInfoWrapper}>
            <div className={styles.avatarContainer}>
              <img
                src={reporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                alt={reporter.fullName}
                className={styles.headerAvatar}
              />
              <span className={`${styles.statusDot} ${reporter.status === 'Approved' ? styles.dotApproved : reporter.status === 'Pending' ? styles.dotPending : styles.dotRejected}`}></span>
            </div>
            <span className={styles.reporterHeaderName}>{reporter.fullName}</span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <i className="fas fa-sign-out-alt"></i> <span className={styles.logoutBtnText}>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={styles.dashboardContent}>
        
        {activeBlockReporter && (
          <div className={`${styles.statusAlert}`} style={{ borderLeft: '5px solid #ea580c', background: '#fff7ed', display: 'flex', alignItems: 'start', gap: '16px', padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.05)', border: '1px solid #ffedd5' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '22px', color: '#ea580c', marginTop: '3px' }}></i>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h4 style={{ fontWeight: 800, margin: 0, fontSize: '15px', color: '#c2410c' }}>आपके प्रखंड में संवाददाता पहले से सक्रिय हैं!</h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                There is already an active (Approved) correspondent registered for block <strong style={{ color: '#1e293b' }}>{reporter.block}</strong> (District: {reporter.district}, {reporter.state}).
              </p>
              <div style={{ marginTop: '12px', padding: '12px 16px', background: '#ffedd5', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#7c2d12', border: '1px solid #fed7aa' }}>
                <div><strong style={{ fontWeight: 700 }}>Name:</strong> {activeBlockReporter.fullName} ({activeBlockReporter.reporterCode || 'No Code Assigned'})</div>
                <div><strong style={{ fontWeight: 700 }}>Email:</strong> {activeBlockReporter.email}</div>
                <div><strong style={{ fontWeight: 700 }}>Mobile:</strong> {activeBlockReporter.mobile}</div>
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#7c2d12', fontWeight: 600, lineHeight: '1.4' }}>
                Desi Andaz policy restricts registrations to exactly <strong>1 correspondent per block</strong>. Since your block has an active correspondent, your profile cannot be approved at this time. Please contact support/administration for help.
              </p>
            </div>
          </div>
        )}

        {/* Verification Context Alert */}
        {reporter.status === 'Pending' && (
          <div className={`${styles.statusAlert} ${styles.statusAlertPending}`}>
            <i className={`fas fa-hourglass-half ${styles.alertIcon}`}></i>
            <div className={styles.alertContent}>
              <h4>KYC Registration Under Review</h4>
              <p>Your Aadhaar identity and files are being audited by our Editorial Board. Your correspondent features and News submission composer will activate once your profile is verified and approved. We appreciate your patience!</p>
            </div>
          </div>
        )}

        {reporter.status === 'Rejected' && (
          <div className={`${styles.statusAlert} ${styles.statusAlertRejected}`}>
            <i className={`fas fa-exclamation-triangle ${styles.alertIcon}`}></i>
            <div className={styles.alertContent}>
              <h4>KYC Application Rejected</h4>
              <p>
                Reason: <b>{reporter.rejectionReason || 'Documents uploaded are unreadable or incorrect.'}</b>
              </p>
              <p style={{ marginTop: '10px' }}>Please contact editorial support to adjust your registration profiles.</p>
            </div>
          </div>
        )}

        {reporter.status === 'Suspended' && (
          <div className={`${styles.statusAlert} ${styles.statusAlertRejected}`} style={{ borderLeft: '5px solid #dc2626', background: '#fef2f2' }}>
            <i className={`fas fa-ban ${styles.alertIcon}`} style={{ color: '#dc2626' }}></i>
            <div className={styles.alertContent}>
              <h4 style={{ color: '#991b1b' }}>संवाददाता खाता निलंबित</h4>
              <p style={{ color: '#7f1d1d' }}>Your correspondent account has been suspended by the editorial board due to complaints or policy violations.</p>
              <p style={{ marginTop: '10px', fontWeight: 600, color: '#991b1b' }}>You are blocked from composing new articles, editing reports, or requesting reviews. Contact administration for details.</p>
            </div>
          </div>
        )}

        {reporter.status === 'Approved' && (
          <>
            {/* Stats Dashboard Grid */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIcon4}`}>
                  <i className="fas fa-file-alt"></i>
                </div>
                <div>
                  <div className={styles.statNumber}>{stats.totalArticles}</div>
                  <div className={styles.statLabel}>Total Reports</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIcon2}`}>
                  <i className="fas fa-check-circle"></i>
                </div>
                <div>
                  <div className={styles.statNumber}>{stats.publishedArticles}</div>
                  <div className={styles.statLabel}>Published</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIcon3}`}>
                  <i className="fas fa-clock"></i>
                </div>
                <div>
                  <div className={styles.statNumber}>{stats.pendingArticles}</div>
                  <div className={styles.statLabel}>Pending Reviews</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.statIcon1}`}>
                  <i className="fas fa-eye"></i>
                </div>
                <div>
                  <div className={styles.statNumber}>{stats.totalViews.toLocaleString()}</div>
                  <div className={styles.statLabel}>Total Views</div>
                </div>
              </div>
            </div>

            {/* Glowing Widget Panel & Article Tables */}
            <div className={styles.mainGrid}>
              
              {/* Left Column: Articles Table */}
              <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.tableTitle}>News Dashboard Workspace</h3>
                  <button onClick={() => handleOpenCompose()} className={styles.btnPrimary} style={{ padding: '10px 18px', fontSize: '13px' }}>
                    <i className="fas fa-plus"></i> Compose News
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.newsTable}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Views</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                            <i className="fas fa-folder-open" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                            No articles submitted yet. Click "Compose News" to write your first report!
                          </td>
                        </tr>
                      ) : (
                        articles.map((art) => (
                          <tr key={art.id}>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{art.title}</td>
                            <td>{art.category?.name || 'Uncategorized'}</td>
                            <td>{art.district}, {art.state}</td>
                            <td>{art.views.toLocaleString()}</td>
                            <td>
                              <span className={`${styles.reporterBadge} ${art.status === 'Published' ? styles.badgeApproved : art.status === 'Pending' ? styles.badgePending : styles.badgeRejected}`} style={{ display: 'inline-flex' }}>
                                {art.status}
                              </span>
                            </td>
                            <td>{new Date(art.createdAt).toLocaleDateString()}</td>
                            <td>
                              {art.status !== 'Published' ? (
                                <button 
                                  onClick={() => handleOpenCompose(art)} 
                                  className={styles.btnSecondary} 
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                              ) : (art.editCount || 0) < 3 ? (
                                <button 
                                  onClick={() => handleOpenCompose(art)} 
                                  className={styles.btnSecondary} 
                                  style={{ padding: '4px 8px', fontSize: '12px', color: '#ea580c', borderColor: '#ea580c' }}
                                >
                                  <i className="fas fa-edit"></i> Edit ({3 - (art.editCount || 0)} left)
                                </button>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '12px' }} title="No edits remaining">
                                  <i className="fas fa-lock"></i> Locked (0/3 Left)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Credentials & Documents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Glowing Joining Letter Download Box */}
                {reporter.joiningLetter ? (
                  <div className={styles.glowCard}>
                    <div className={styles.glowCardContent}>
                      <h4 className={styles.glowCardTitle}>
                        <i className="fas fa-file-signature" style={{ color: '#ea580c' }}></i>
                        Official Joining Letter
                      </h4>
                      <p className={styles.glowCardText}>
                        Your official Desi Andaz Newsroom Joining Letter has been verified and signed by the Chief Editor. Download it for your records.
                      </p>
                      <a 
                        href={reporter.joiningLetter} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={styles.btnPrimary} 
                        style={{ marginTop: '10px', textDecoration: 'none', textAlign: 'center' }}
                      >
                        <i className="fas fa-download"></i> Download Joining PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className={styles.statCard} style={{ background: '#f8fafc', borderStyle: 'dashed' }}>
                    <div className={`${styles.statIcon} ${styles.statIcon3}`}>
                      <i className="fas fa-file-invoice"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>Joining Letter Pending</div>
                      <div className={styles.statLabel}>Editorial signing in progress</div>
                    </div>
                  </div>
                )}

                {/* Profile Details & Avatar Card */}
                <div className={styles.statCard} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                  <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper} onClick={() => document.getElementById('avatarFileInput')?.click()} title="Click to change profile picture">
                      <img
                        src={reporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                        alt="Profile Avatar"
                        className={styles.avatarImage}
                      />
                      <div className={styles.avatarOverlay}>
                        <i className="fas fa-camera"></i>
                        <span>Change Photo</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      id="avatarFileInput"
                      style={{ display: 'none' }}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleAvatarFileSelect}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{reporter.fullName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>संवाददाता पहचान पत्र (ID): {reporter.reporterCode || reporter.id}</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    संवाददाता प्रोफ़ाइल विवरण (Correspondent Profile)
                  </h4>
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>ID:</span> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{reporter.reporterCode || reporter.id}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Email:</span> <span style={{ fontWeight: 600 }}>{reporter.email}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Phone:</span> <span style={{ fontWeight: 600 }}>{reporter.mobile}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Location:</span> <span style={{ fontWeight: 600 }}>{reporter.district}, {reporter.state}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontWeight: 500 }}>Blood Group:</span> <span style={{ fontWeight: 600 }}>{reporter.bloodGroup || 'N/A'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </main>

      {/* COMPPOSE / EDIT NEWS ARTICLE MODAL */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {editingArticle 
                  ? editingArticle.status === 'Published' 
                    ? 'Request Review & Edit Published News' 
                    : 'Edit Submitted Report' 
                  : 'Compose News Article'}
                {autoSaveStatus === 'saving' && (
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <span className={styles.spinner} style={{ width: '10px', height: '10px', borderWidth: '1.5px', borderTopColor: 'transparent' }}></span>
                    Saving...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span style={{ fontSize: '12px', color: '#10b981', marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    Draft Auto-Saved
                  </span>
                )}
              </h3>
              <button onClick={handleCloseCompose} className={styles.closeBtn}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalBody}>
              {draftExists && (
                <div style={{
                  background: 'rgba(234, 88, 12, 0.06)',
                  border: '1px dashed #ea580c',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  marginBottom: '20px',
                  animation: 'fadeIn 0.2s'
                }}>
                  <span style={{ color: '#c2410c', fontWeight: 600 }}>
                    <i className="fas fa-history" style={{ marginRight: '6px' }}></i>
                    Found an unsaved local draft ({draftData?.timestamp})
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={handleRestoreDraft}
                      className={styles.btnPrimary} 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Restore
                    </button>
                    <button 
                      type="button" 
                      onClick={handleDiscardDraft}
                      className={styles.btnSecondary} 
                      style={{ padding: '6px 12px', fontSize: '12px', background: '#fff' }}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {editingArticle && editingArticle.status === 'Published' && (
                  <div style={{
                    background: 'rgba(234, 88, 12, 0.05)',
                    border: '1px solid rgba(234, 88, 12, 0.2)',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13.5px',
                    color: '#c2410c'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                      <i className="fas fa-exclamation-circle" style={{ fontSize: '16px', color: '#ea580c' }}></i>
                      Edit Request Warning ({3 - (editingArticle.editCount || 0)}/3 Edits Remaining)
                    </div>
                    <p style={{ margin: 0, color: '#475569', lineHeight: '1.4' }}>
                      This article is currently live and <strong>Published</strong>. Saving changes will increase the edit counter and return the article to the pending editorial queue, temporarily hiding it from the public feed until re-approved.
                    </p>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Article Headline / Title</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="Enter comprehensive headline here..."
                    required
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Primary Category</label>
                    <select className={styles.select} value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    
                    {newsCategory && (
                      <div style={{ marginTop: '12px' }}>
                        <label className={styles.label} style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Additional Categories (Optional)</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                          {categories.filter(c => c.id !== newsCategory).map(c => (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={newsAdditionalCategories.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewsAdditionalCategories(prev => [...prev, c.id]);
                                  } else {
                                    setNewsAdditionalCategories(prev => prev.filter(id => id !== c.id));
                                  }
                                }}
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Featured Image Attachment (Thumbnail)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => document.getElementById('newsImageUpload')?.click()} 
                        className={styles.btnSecondary} 
                        style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                      >
                        <i className="fas fa-image"></i> Browse Image
                      </button>
                      
                      {newsUploadStatus === 'uploading' && <span className={styles.spinner} style={{ width: '16px', height: '16px' }}></span>}
                      {newsUploadStatus === 'success' && <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600 }}><i className="fas fa-check"></i> Attached</span>}

                      <input type="file" id="newsImageUpload" style={{ display: 'none' }} accept="image/*" onChange={handleNewsImageUpload} />
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>State</label>
                    <select className={styles.select} value={newsState} onChange={handleStateChange}>
                      {allStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>District / City</label>
                    <select className={styles.select} value={newsDistrict} onChange={(e) => setNewsDistrict(e.target.value)}>
                      {stateDistricts[newsState]?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Article Report Content</label>
                  <RichTextEditor 
                    value={newsContent}
                    onChange={(html) => setNewsContent(html)}
                    placeholder="Write the full report content here. Keep reports comprehensive and objective..."
                  />
                </div>

                <div className={styles.btnGroup} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '10px' }}>
                  <button type="button" className={styles.btnSecondary} onClick={handleCloseCompose} disabled={isSubmittingNews}>
                    Cancel
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      className={styles.btnSecondary} 
                      onClick={() => handleSaveArticle('Draft')}
                      disabled={isSubmittingNews}
                      style={{ color: '#ea580c', borderColor: '#ea580c' }}
                    >
                      Save as Draft
                    </button>
                    <button 
                      type="button" 
                      className={styles.btnPrimary} 
                      onClick={() => handleSaveArticle('Pending')}
                      disabled={isSubmittingNews}
                    >
                      {isSubmittingNews ? 'Submitting...' : 'Submit to Editorial'}
                    </button>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* PROFILE PHOTO CROP MODAL */}
      {isCropModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Crop Profile Picture</h3>
              <button onClick={() => setIsCropModalOpen(false)} className={styles.closeBtn} disabled={isUploadingAvatar}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.cropContainer}>
                
                <div 
                  className={styles.cropViewport}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {cropImageSrc && (
                    <img
                      src={cropImageSrc}
                      alt="Crop View"
                      className={styles.cropDragImage}
                      style={{
                        position: 'absolute',
                        width: `${cropFitDim.w}px`,
                        height: `${cropFitDim.h}px`,
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})`,
                        maxWidth: 'none',
                        maxHeight: 'none'
                      }}
                    />
                  )}
                  <div className={styles.cropMask}></div>
                </div>

                <div className={styles.cropZoomSection}>
                  <div className={styles.cropZoomLabel}>
                    <span>Zoom Scale</span>
                    <span>{Math.round(cropZoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className={styles.cropZoomSlider}
                    min="1"
                    max="3"
                    step="0.05"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  />
                </div>

                <div className={styles.btnGroup} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', width: '100%', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className={styles.btnSecondary} 
                    onClick={() => setIsCropModalOpen(false)} 
                    disabled={isUploadingAvatar}
                    style={{ padding: '10px 20px', flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnPrimary} 
                    onClick={handleSaveAvatar}
                    disabled={isUploadingAvatar}
                    style={{ padding: '10px 20px', flex: 1 }}
                  >
                    {isUploadingAvatar ? 'Saving...' : 'Crop & Save'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT CHAT WIDGET - FLOATING SUPPORT SYSTEM */}
      {reporter?.status === 'Approved' && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
          
          {/* Floating Circle Button */}
          {!isChatOpen && (
            <button 
              onClick={() => setIsChatOpen(true)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 8px 30px rgba(79, 70, 229, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(79, 70, 229, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(79, 70, 229, 0.4)';
              }}
            >
              <i className="fas fa-comments"></i>
              {/* Pulsing Badge */}
              {unreadMessages > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '3px 7px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                }}>
                  {unreadMessages}
                </span>
              )}
            </button>
          )}

          {/* Active Chat Window */}
          {isChatOpen && (
            <div style={{
              width: '380px',
              height: '520px',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              
              {/* Chat Header */}
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700
                    }}>
                      A
                    </div>
                    <span style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      background: '#10b981',
                      border: '2px solid #4f46e5',
                      borderRadius: '50%'
                    }}></span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 750, fontSize: '14.5px', display: 'block' }}>Super Admin Chat</span>
                    <span style={{ fontSize: '11px', opacity: 0.8, fontWeight: 500 }}>Desi Andaz Newsroom Support</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    cursor: 'pointer',
                    opacity: 0.8,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>

              {/* Chat Messages Body */}
              <div 
                id="chatMessagesBody"
                style={{
                  flex: 1,
                  padding: '20px',
                  background: '#f8fafc',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {chatMessages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#94a3b8',
                    margin: 'auto',
                    padding: '20px',
                    fontSize: '13px'
                  }}>
                    <i className="fas fa-comments" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                    <b>No messages yet</b>
                    <p style={{ marginTop: '4px', fontSize: '12px' }}>Start the conversation! Type a message below to chat with the Super Admin.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender === 'Reporter';
                    return (
                      <div 
                        key={msg.id}
                        style={{
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMe ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : '#ffffff',
                          color: isMe ? '#ffffff' : '#334155',
                          fontSize: '13px',
                          fontWeight: 500,
                          lineHeight: '1.4',
                          border: isMe ? 'none' : '1px solid #e2e8f0',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {msg.message}
                        </div>
                        <span style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                          marginTop: '4px',
                          fontWeight: 500
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Footer */}
              <form 
                onSubmit={handleSendChatMessage}
                style={{
                  padding: '12px 16px',
                  background: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}
              >
                <input 
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: 500,
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isSendingMessage}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: chatInput.trim() ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' : '#f1f5f9',
                    color: chatInput.trim() ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    cursor: chatInput.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
