'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../reporter.module.css';
import { getReporterById, getReporterStats, getReporterArticles, submitReporterArticle, updateReporterArticle, updateReporterProfilePicture, getActiveReporterInBlock, getCorrespondentsForHierarchy, getArticlesForModeration, moderateArticle } from '@/actions/reporter';
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

  // Subordinate and Moderation states
  const [moderationArticles, setModerationArticles] = useState<any[]>([]);
  const [subordinateReporters, setSubordinateReporters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'news' | 'moderation' | 'reporters' | 'reports'>('news');

  // Moderation action states
  const [moderationRemarks, setModerationRemarks] = useState('');
  const [moderationActiveArticle, setModerationActiveArticle] = useState<any>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);

  // ID Card States
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

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
        const activeRep = await getActiveReporterInBlock(profile.block, profile.district, profile.state, profile.id, profile.role);
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

          if (profile.role === 'DISTRICT_CORRESPONDENT' || profile.role === 'STATE_CORRESPONDENT') {
            const [modArts, subs] = await Promise.all([
              getArticlesForModeration(profile.role, profile.state, profile.district),
              getCorrespondentsForHierarchy({
                state: profile.state,
                district: profile.role === 'DISTRICT_CORRESPONDENT' ? profile.district : undefined
              })
            ]);
            setModerationArticles(modArts);
            setSubordinateReporters(subs.filter((s: any) => s.id !== profile.id));
          }
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

  // ID Card Actions
  const handleDownloadIDCard = () => {
    setIsIDCardModalOpen(true);
  };

  const downloadCardImage = async () => {
    const cardElement = document.getElementById('desiandaz-id-card-element');
    if (!cardElement) return;
    
    setIsGeneratingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `TDA_ID_Card_${reporter?.reporterCode || 'correspondent'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
      alert('Failed to generate card image. Please try again.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const downloadCardPDF = async () => {
    const cardElement = document.getElementById('desiandaz-id-card-element');
    if (!cardElement) return;
    
    setIsGeneratingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
      pdf.save(`TDA_ID_Card_${reporter?.reporterCode || 'correspondent'}.pdf`);
    } catch (err) {
      console.error('Error generating card PDF:', err);
      alert('Failed to generate card PDF. Please try again.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Moderation Queue Actions
  const handleOpenModeration = (article: any) => {
    setModerationActiveArticle(article);
    setModerationRemarks('');
    setIsModerationModalOpen(true);
  };

  const handleCloseModeration = () => {
    setIsModerationModalOpen(false);
    setModerationActiveArticle(null);
  };

  const handleModerate = async (action: 'Approve' | 'Reject' | 'RequestCorrection') => {
    if (!moderationActiveArticle || isModerating) return;
    if ((action === 'Reject' || action === 'RequestCorrection') && !moderationRemarks.trim()) {
      alert('Remarks / comments are required for rejection or requesting corrections.');
      return;
    }

    setIsModerating(true);
    try {
      const res = await moderateArticle(
        moderationActiveArticle.id,
        action,
        moderationRemarks.trim(),
        reporter.role,
        reporter.id
      );

      if (res.success) {
        alert(`Article successfully moderated: ${action}`);
        handleCloseModeration();
        fetchFreshData(reporter.id);
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Moderation failed.');
    } finally {
      setIsModerating(false);
    }
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
        
        {activeBlockReporter && (() => {
          let hindiTitle = 'आपके प्रखंड में संवाददाता पहले से सक्रिय हैं!';
          let englishDesc = `There is already an active (Approved) correspondent registered for block ${reporter.block} (District: ${reporter.district}, ${reporter.state}).`;
          let policyDesc = `Desi Andaz policy restricts registrations to exactly 1 correspondent per block. Since your block has an active correspondent, your profile cannot be approved at this time.`;
          
          const roleLabel = 
            reporter.role === 'DISTRICT_CORRESPONDENT' ? 'District Correspondent' : 
            reporter.role === 'STATE_CORRESPONDENT' ? 'State Correspondent' : 
            reporter.role === 'DISTRICT_AD_INCHARGE' ? 'District Advertisement In-charge' : 
            reporter.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? 'Santhal Pargana Advertisement In-charge' : 
            reporter.role === 'STATE_AD_INCHARGE' ? 'State Advertisement In-charge' : 
            'Correspondent';

          const roleLabelHi = 
            reporter.role === 'DISTRICT_CORRESPONDENT' ? 'जिला संवाददाता' : 
            reporter.role === 'STATE_CORRESPONDENT' ? 'राज्य संवाददाता' : 
            reporter.role === 'DISTRICT_AD_INCHARGE' ? 'जिला विज्ञापन प्रभारी' : 
            reporter.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? 'संताल परगना विज्ञापन प्रभारी' : 
            reporter.role === 'STATE_AD_INCHARGE' ? 'राज्य विज्ञापन प्रभारी' : 
            'संवाददाता';

          if (['DISTRICT_CORRESPONDENT', 'DISTRICT_AD_INCHARGE'].includes(reporter.role)) {
            hindiTitle = `आपके जिला में इस पद (${roleLabelHi}) पर पहले से नियुक्ति है!`;
            englishDesc = `There is already an active (Approved) ${roleLabel} registered for district ${reporter.district} (${reporter.state}).`;
            policyDesc = `Desi Andaz policy restricts registrations to exactly 1 ${roleLabel} per district. Since your district has an active appointment for this role, your profile cannot be approved at this time.`;
          } else if (reporter.role === 'SANTHAL_PARGANA_AD_INCHARGE') {
            hindiTitle = `प्रमंडल स्तर पर इस पद (${roleLabelHi}) पर पहले से नियुक्ति है!`;
            englishDesc = `There is already an active (Approved) ${roleLabel} registered in this state.`;
            policyDesc = `Desi Andaz policy restricts registrations to exactly 1 ${roleLabel}. Since there is already an active assignment, your profile cannot be approved at this time.`;
          } else if (['STATE_CORRESPONDENT', 'STATE_AD_INCHARGE'].includes(reporter.role)) {
            hindiTitle = `आपके राज्य में इस पद (${roleLabelHi}) पर पहले से नियुक्ति है!`;
            englishDesc = `There is already an active (Approved) ${roleLabel} registered for state ${reporter.state}.`;
            policyDesc = `Desi Andaz policy restricts registrations to exactly 1 ${roleLabel} per state. Since your state has an active appointment for this role, your profile cannot be approved at this time.`;
          }

          return (
            <div className={`${styles.statusAlert}`} style={{ borderLeft: '5px solid #ea580c', background: '#fff7ed', display: 'flex', alignItems: 'start', gap: '16px', padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.05)', border: '1px solid #ffedd5' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '22px', color: '#ea580c', marginTop: '3px' }}></i>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '15px', color: '#c2410c' }}>{hindiTitle}</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                  {englishDesc}
                </p>
                <div style={{ marginTop: '12px', padding: '12px 16px', background: '#ffedd5', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#7c2d12', border: '1px solid #fed7aa' }}>
                  <div><strong style={{ fontWeight: 700 }}>Name:</strong> {activeBlockReporter.fullName} ({activeBlockReporter.reporterCode || 'No Code Assigned'})</div>
                  <div><strong style={{ fontWeight: 700 }}>Email:</strong> {activeBlockReporter.email}</div>
                  <div><strong style={{ fontWeight: 700 }}>Mobile:</strong> {activeBlockReporter.mobile}</div>
                </div>
                <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#7c2d12', fontWeight: 600, lineHeight: '1.4' }}>
                  {policyDesc} Please contact support/administration for help.
                </p>
              </div>
            </div>
          );
        })()}

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

            {/* Tab navigation for District/State roles */}
            {(reporter.role === 'DISTRICT_CORRESPONDENT' || reporter.role === 'STATE_CORRESPONDENT') && (
              <div style={{
                display: 'flex',
                gap: '12px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '2px',
                marginBottom: '24px',
                marginTop: '12px',
                overflowX: 'auto'
              }}>
                <button
                  onClick={() => setActiveTab('news')}
                  style={{
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    color: activeTab === 'news' ? '#ea580c' : '#64748b',
                    borderBottom: activeTab === 'news' ? '3px solid #ea580c' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fas fa-file-signature" style={{ marginRight: '8px' }}></i>
                  My News (अपना समाचार)
                </button>
                <button
                  onClick={() => setActiveTab('moderation')}
                  style={{
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    color: activeTab === 'moderation' ? '#ea580c' : '#64748b',
                    borderBottom: activeTab === 'moderation' ? '3px solid #ea580c' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i>
                  News Moderation Queue (समीक्षा सूची)
                  {moderationArticles.length > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 800
                    }}>{moderationArticles.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('reporters')}
                  style={{
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    color: activeTab === 'reporters' ? '#ea580c' : '#64748b',
                    borderBottom: activeTab === 'reporters' ? '3px solid #ea580c' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
                  {reporter.role === 'DISTRICT_CORRESPONDENT' ? 'Block Correspondents' : 'Correspondents List'} (संवाददाता सूची)
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  style={{
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    background: 'none',
                    color: activeTab === 'reports' ? '#ea580c' : '#64748b',
                    borderBottom: activeTab === 'reports' ? '3px solid #ea580c' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i>
                  {reporter.role === 'DISTRICT_CORRESPONDENT' ? 'District Reports' : 'State Reports'} (भौगोलिक रिपोर्ट)
                </button>
              </div>
            )}

            {/* Glowing Widget Panel & Article Tables */}
            {(reporter.role === 'BLOCK_CORRESPONDENT' || activeTab === 'news') && (
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
                                <span className={`${styles.reporterBadge} ${art.status === 'Published' || art.status === 'Website Published' || art.status === 'Print Published' ? styles.badgeApproved : art.status === 'Pending' || art.status === 'Submitted' ? styles.badgePending : styles.badgeRejected}`} style={{ display: 'inline-flex' }}>
                                  {art.status}
                                </span>
                              </td>
                              <td>{new Date(art.createdAt).toLocaleDateString()}</td>
                              <td>
                                {art.status !== 'Published' && art.status !== 'Website Published' && art.status !== 'Print Published' ? (
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

                  {/* Press ID Card Download Box */}
                  {reporter.status === 'Approved' && (
                    <div className={styles.glowCard} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.2)' }}>
                      <div className={styles.glowCardContent}>
                        <h4 className={styles.glowCardTitle} style={{ color: '#f8fafc' }}>
                          <i className="fas fa-id-card" style={{ color: '#f59e0b' }}></i>
                          Press Identity Card
                        </h4>
                        <p className={styles.glowCardText} style={{ color: '#cbd5e1' }}>
                          Your official Press Identity Card is ready. Download it as a high-quality PDF or Image for field verification.
                        </p>
                        <button 
                          onClick={handleDownloadIDCard} 
                          className={styles.btnPrimary} 
                          style={{ marginTop: '10px', textDecoration: 'none', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', width: '100%', cursor: 'pointer' }}
                        >
                          <i className="fas fa-id-card"></i> View & Download Card
                        </button>
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
            )}

            {/* News Moderation tab */}
            {activeTab === 'moderation' && (
              <div className={styles.tableSection} style={{ width: '100%' }}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.tableTitle}>News Review Moderation Queue</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.newsTable}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Reporter</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderationArticles.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '32px', color: '#10b981', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                            All caught up! No reports pending your review.
                          </td>
                        </tr>
                      ) : (
                        moderationArticles.map((art) => (
                          <tr key={art.id}>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{art.title}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600 }}>{art.reporterRel?.fullName || art.reporter}</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>{art.reporterRel?.reporterCode || 'No Code'} ({art.reporterRel?.role})</span>
                              </div>
                            </td>
                            <td>{art.category?.name || 'Uncategorized'}</td>
                            <td>{art.district}, {art.state}</td>
                            <td>
                              <span className={`${styles.reporterBadge} ${styles.badgePending}`} style={{ display: 'inline-flex' }}>
                                {art.status}
                              </span>
                            </td>
                            <td>{new Date(art.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button 
                                onClick={() => handleOpenModeration(art)} 
                                className={styles.btnPrimary} 
                                style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)', border: 'none', cursor: 'pointer' }}
                              >
                                <i className="fas fa-stamp"></i> Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subordinates list tab */}
            {activeTab === 'reporters' && (
              <div className={styles.tableSection} style={{ width: '100%' }}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.tableTitle}>
                    {reporter.role === 'DISTRICT_CORRESPONDENT' 
                      ? `Correspondents in District: ${reporter.district}` 
                      : `Correspondents in State: ${reporter.state}`}
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.newsTable}>
                    <thead>
                      <tr>
                        <th>Correspondent Code & Name</th>
                        <th>Mobile</th>
                        <th>Email</th>
                        <th>Role / Designation</th>
                        <th>Block</th>
                        <th>District</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subordinateReporters.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                            <i className="fas fa-users-slash" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.5 }}></i>
                            No correspondents found in your geographical region.
                          </td>
                        </tr>
                      ) : (
                        subordinateReporters.map((rep) => (
                          <tr key={rep.id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img 
                                src={rep.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                                alt={rep.fullName}
                                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{rep.fullName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{rep.reporterCode || 'No Code'}</div>
                              </div>
                            </td>
                            <td>{rep.mobile}</td>
                            <td>{rep.email}</td>
                            <td style={{ fontSize: '12px', fontWeight: 600 }}>{rep.role}</td>
                            <td>{rep.block || 'N/A'}</td>
                            <td>{rep.district}</td>
                            <td>
                              <span className={`${styles.reporterBadge} ${rep.status === 'Approved' ? styles.badgeApproved : rep.status === 'Pending' ? styles.badgePending : styles.badgeRejected}`} style={{ display: 'inline-flex' }}>
                                {rep.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports tab */}
            {activeTab === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIcon4}`}>
                      <i className="fas fa-users"></i>
                    </div>
                    <div>
                      <div className={styles.statNumber}>{subordinateReporters.length}</div>
                      <div className={styles.statLabel}>Active Subordinate Correspondents</div>
                    </div>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIcon3}`}>
                      <i className="fas fa-inbox"></i>
                    </div>
                    <div>
                      <div className={styles.statNumber}>{moderationArticles.length}</div>
                      <div className={styles.statLabel}>Pending Moderation Reviews</div>
                    </div>
                  </div>
                </div>

                <div className={styles.tableSection}>
                  <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Geographical News Analytics</h3>
                  </div>
                  <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                      As a <strong>{reporter.role === 'DISTRICT_CORRESPONDENT' ? 'District Correspondent' : 'State Correspondent'}</strong>, you are responsible for monitoring the editorial quality, truthfulness, and localization guidelines of news reports within your jurisdiction (<strong>{reporter.role === 'DISTRICT_CORRESPONDENT' ? reporter.district : reporter.state}</strong>).
                    </p>
                    <ul style={{ marginTop: '16px', color: '#475569', fontSize: '13.5px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li>Ensure block reporters upload verification media (photos/videos) for local incidents.</li>
                      <li>Review headline structure: headlines should follow standard localization naming rules.</li>
                      <li>Never approve incomplete reports. Request correction with specific editorial comments.</li>
                      <li>Approved reports move to the next editorial validation stage automatically.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
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

      {/* NEWS REVIEW MODERATION MODAL */}
      {isModerationModalOpen && moderationActiveArticle && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Review News Report</h3>
              <button onClick={handleCloseModeration} className={styles.closeBtn} disabled={isModerating}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>Headline</h4>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{moderationActiveArticle.title}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Reporter</h4>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                      {moderationActiveArticle.reporterRel?.fullName || moderationActiveArticle.reporter}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Location</h4>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
                      {moderationActiveArticle.district}, {moderationActiveArticle.state}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Content Preview</h4>
                  <div 
                    style={{ 
                      maxHeight: '150px', 
                      overflowY: 'auto', 
                      padding: '12px', 
                      background: '#f8fafc', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      fontSize: '13px', 
                      lineHeight: '1.5',
                      color: '#475569' 
                    }}
                    dangerouslySetInnerHTML={{ __html: moderationActiveArticle.content }}
                  />
                </div>

                {moderationActiveArticle.imageUrl && (
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Attachment</h4>
                    <img 
                      src={moderationActiveArticle.imageUrl} 
                      alt="News attachment" 
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Review Comments / Remarks</label>
                  <textarea 
                    className={styles.textarea} 
                    value={moderationRemarks}
                    onChange={(e) => setModerationRemarks(e.target.value)}
                    placeholder="Enter approval details or specify required corrections / rejection reasons..."
                    style={{ height: '80px' }}
                  />
                </div>

                <div className={styles.btnGroup} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', width: '100%', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className={styles.btnSecondary} 
                    onClick={() => handleModerate('RequestCorrection')} 
                    disabled={isModerating}
                    style={{ color: '#d97706', borderColor: '#d97706', padding: '10px 14px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-undo"></i> Correction
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnSecondary} 
                    onClick={() => handleModerate('Reject')} 
                    disabled={isModerating}
                    style={{ color: '#dc2626', borderColor: '#dc2626', padding: '10px 14px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-times"></i> Reject
                  </button>
                  <button 
                    type="button" 
                    className={styles.btnPrimary} 
                    onClick={() => handleModerate('Approve')} 
                    disabled={isModerating}
                    style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', cursor: 'pointer' }}
                  >
                    {isModerating ? 'Processing...' : <><i className="fas fa-check"></i> Approve</>}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID CARD DOWNLOAD PORTAL */}
      {isIDCardModalOpen && reporter && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Identity Card Preview</h3>
              <button 
                onClick={() => setIsIDCardModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
              >
                <i className="fas fa-times-circle"></i>
              </button>
            </div>

            {/* The ID Card element captured by html2canvas */}
            <div 
              id="desiandaz-id-card-element"
              style={{
                width: '320px',
                height: '500px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid #d97706'
              }}
            >
              {/* Top subtle glow effect */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                left: '-50px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(217, 119, 6, 0.15)',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }}></div>

              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(217, 119, 6, 0.4)', paddingBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px', color: '#f59e0b', fontFamily: 'serif' }}>THE DESI ANDAZ</div>
                <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '3px', color: '#cbd5e1', textTransform: 'uppercase', marginTop: '2px' }}>Media Network</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#94a3b8', marginTop: '6px', fontWeight: 600 }}>
                  <span>RNI: JHBIL/26/A3245</span>
                  <span style={{ color: '#ef4444' }}>PRESS CARD</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ display: 'flex', gap: '14px', margin: '12px 0', alignItems: 'center', flex: 1 }}>
                {/* Photo */}
                <div style={{ border: '2px solid #f59e0b', borderRadius: '8px', overflow: 'hidden', width: '90px', height: '110px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={reporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                    alt={reporter.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div>
                    <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>NAME</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{reporter.fullName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>DESIGNATION</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b' }}>
                      {reporter.role === 'BLOCK_CORRESPONDENT' ? 'Block Correspondent' : 
                       reporter.role === 'DISTRICT_CORRESPONDENT' ? 'District Correspondent' : 
                       reporter.role === 'STATE_CORRESPONDENT' ? 'State Correspondent' : 
                       reporter.role === 'DISTRICT_AD_INCHARGE' ? 'District Ad In-charge' : 
                       reporter.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? 'Santhal Pargana Ad In-charge' : 
                       reporter.role === 'STATE_AD_INCHARGE' ? 'State Ad In-charge' : 
                       reporter.role}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>REPORTER CODE</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8' }}>{reporter.reporterCode || 'TDA/TEMP'}</div>
                  </div>
                </div>
              </div>

              {/* Geographic coverage details & QR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', color: '#cbd5e1', flex: 1 }}>
                  <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>State:</span> {reporter.state}</div>
                  {reporter.role !== 'STATE_CORRESPONDENT' && reporter.role !== 'STATE_AD_INCHARGE' && reporter.role !== 'SANTHAL_PARGANA_AD_INCHARGE' && <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>District:</span> {reporter.district}</div>}
                  {reporter.role === 'BLOCK_CORRESPONDENT' && <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>Block:</span> {reporter.block}</div>}
                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>Blood: <span style={{ color: '#ef4444', fontWeight: 700 }}>{reporter.bloodGroup || 'N/A'}</span></div>
                </div>
                {/* QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ background: '#ffffff', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://www.thedesiandaz.com/correspondent-verification?code=' + (reporter.reporterCode || reporter.id))}`}
                      alt="QR"
                      style={{ width: '50px', height: '50px', display: 'block' }}
                    />
                  </div>
                  <span style={{ fontSize: '6px', color: '#94a3b8', fontWeight: 700 }}>VERIFY PRESS</span>
                </div>
              </div>

              {/* Authorized Signature Footer */}
              <div style={{ borderTop: '1px solid rgba(217, 119, 6, 0.4)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div style={{ fontSize: '7px', color: '#94a3b8' }}>
                  <div>Issued: {new Date(reporter.createdAt).toLocaleDateString()}</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', marginTop: '1px' }}>COVERAGE AREA: JHARKHAND</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '8px', color: '#10b981', fontWeight: 700, fontStyle: 'italic', letterSpacing: '0.5px' }}>✓ VERIFIED</div>
                  <div style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 600 }}>Editor-in-Chief</div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
              <button 
                onClick={downloadCardImage}
                disabled={isGeneratingCard}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: '#475569', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '13px'
                }}
              >
                <i className="fas fa-image"></i>
                {isGeneratingCard ? 'Generating...' : 'Save PNG'}
              </button>
              <button 
                onClick={downloadCardPDF}
                disabled={isGeneratingCard}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}
              >
                <i className="fas fa-file-pdf"></i>
                {isGeneratingCard ? 'Generating...' : 'Save PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )}

    </div>
  );
}
