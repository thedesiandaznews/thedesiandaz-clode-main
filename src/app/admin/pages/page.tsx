'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { getPageContent, updatePageContent } from '@/actions/pages';

const AVAILABLE_PAGES = [
  { slug: 'home', name: 'Home Page' },
  { slug: 'about', name: 'About Us' },
  { slug: 'contact', name: 'Contact Us' },
  { slug: 'epaper', name: 'E-Paper' },
  { slug: 'anonymous', name: 'Anonymous' },
];

const WIDGETS = [
  { type: 'hero', name: 'Hero Banner Section', icon: 'fa-heading', desc: 'Add large headings, backgrounds, and overlay banners.' },
  { type: 'text', name: 'Rich Text Paragraph', icon: 'fa-paragraph', desc: 'Create clean paragraphs with customized sizes and font colors.' },
  { type: 'notice', name: 'Callout Notice Alert', icon: 'fa-exclamation-circle', desc: 'Flashing announcement box or breaking alert banner.' },
  { type: 'video', name: 'Video Embed Player', icon: 'fa-video', desc: 'Embed responsive video widgets from YouTube or Vimeo.' },
  { type: 'columns', name: 'Feature Columns Grid', icon: 'fa-columns', desc: 'Create 2-column or 3-column side-by-side card grids.' },
  { type: 'founder', name: 'Founder Profile Card', icon: 'fa-user-tie', desc: 'Portrait photo, name, bio paragraph, and editor-in-chief quotes.' },
  { type: 'manifesto', name: 'Editorial Manifesto Checklist', icon: 'fa-clipboard-list', desc: 'Numbered Registered & Recognized editorial declaration list.' },
  { type: 'ad_banner', name: 'Dynamic Ad Banner', icon: 'fa-ad', desc: 'Place responsive desktop and mobile ad banners.' },
  { type: 'spacer', name: 'Spacer / Visual Line', icon: 'fa-arrows-alt-v', desc: 'Add visual dividers or custom vertical gaps.' },
];

export default function PageEditor() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Editor mode: standard visual forms or Elementor drag & drop builder
  const [editorMode, setEditorMode] = useState<'forms' | 'drag-and-drop'>('forms');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  
  // Tab states for Advanced SEO panel
  const [activeSeoTab, setActiveSeoTab] = useState<'google' | 'facebook' | 'twitter' | 'advanced'>('google');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('mobile');

  // SEO States
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoKeys, setSeoKeys] = useState('');
  const [seoImage, setSeoImage] = useState('');

  // Advanced SEO States
  const [indexing, setIndexing] = useState(true);
  const [following, setFollowing] = useState(true);
  const [canonicalUrl, setCanonicalUrl] = useState('');

  // Content States (JSON data)
  const [content, setContent] = useState<any>({});

  // Dynamic fields depending on page selected
  const loadPageData = async (slug: string) => {
    setLoading(true);
    try {
      const data = await getPageContent(slug);
      if (data) {
        setSeoTitle(data.seoTitle || '');
        setSeoDesc(data.seoDesc || '');
        setSeoKeys(data.seoKeys || '');
        setSeoImage(data.seoImage || '');
        
        const parsedContent = data.content || getDefaultContent(slug);
        setContent(parsedContent);
        
        // Parse editor settings
        setEditorMode(parsedContent.editorMode || 'forms');
        setBlocks(parsedContent.blocks || []);
        
        // Load advanced meta tags from content JSON
        setIndexing(parsedContent.indexing !== 'noindex');
        setFollowing(parsedContent.following !== 'nofollow');
        setCanonicalUrl(parsedContent.canonicalUrl || '');
      } else {
        // Reset to empty/defaults if no data exists
        setSeoTitle(''); 
        setSeoDesc(''); 
        setSeoKeys(''); 
        setSeoImage('');
        setIndexing(true);
        setFollowing(true);
        setCanonicalUrl('');
        setEditorMode('forms');
        setBlocks([]);
        setContent(getDefaultContent(slug));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPageData(selectedPage);
  }, [selectedPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Package advanced SEO settings inside the content JSON
    const updatedContent = {
      ...content,
      editorMode,
      blocks: editorMode === 'drag-and-drop' ? blocks : [],
      indexing: indexing ? 'index' : 'noindex',
      following: following ? 'follow' : 'nofollow',
      canonicalUrl: canonicalUrl
    };
    
    const result = await updatePageContent(selectedPage, updatedContent, {
      seoTitle, seoDesc, seoKeys, seoImage
    });
    
    if (result.success) {
      setSuccessMsg('Page layout and SEO settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert('Error updating page');
    }
    setLoading(false);
  };

  const handleContentChange = (key: string, value: string) => {
    setContent((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleContentChange(key, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSeoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSeoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Drag & Drop Handlers ────────────────────────────────────────────────────
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    const items = [...blocks];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setBlocks(items);
    setDraggedIndex(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const items = [...blocks];
    if (direction === 'up' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === 'down' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    setBlocks(items);
  };

  const addBlock = (type: string) => {
    const newBlock: any = {
      id: Math.random().toString(36).substring(2, 9),
      type,
    };

    if (type === 'hero') {
      newBlock.title = 'ताज़ा ग्राउंड रिपोर्ट';
      newBlock.subtitle = 'सत्य निष्पक्ष और विश्वसनीय ग्राउंड रिपोर्टिंग';
      newBlock.bgColor = '#1e293b';
      newBlock.textColor = '#ffffff';
      newBlock.bgImage = '';
      newBlock.buttonText = 'अधिक जानें';
      newBlock.buttonLink = '#';
    } else if (type === 'text') {
      newBlock.body = 'यहाँ अपना मुख्य पैराग्राफ या विवरण टाइप करें...';
      newBlock.fontSize = '16';
      newBlock.color = '#334155';
    } else if (type === 'notice') {
      newBlock.headline = 'ब्रेकिंग न्यूज़ अलर्ट!';
      newBlock.bgGradient = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    } else if (type === 'video') {
      newBlock.url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (type === 'columns') {
      newBlock.colsCount = '3';
      newBlock.cols = [
        { title: 'विश्वसनीय ख़बरें', desc: 'सच्ची और निष्पक्ष पत्रकारिता', btn: 'पढ़ें', link: '#' },
        { title: 'स्थानीय ख़बरें', desc: 'झारखंड के हर जिले की खबर', btn: 'पढ़ें', link: '#' },
        { title: 'ई-पेपर', desc: 'दैनिक डिजिटल प्रिंट वर्शन', btn: 'पढ़ें', link: '#' },
      ];
    } else if (type === 'founder') {
      newBlock.founderName = 'Sonu Kumar Saha';
      newBlock.founderTitle = 'Founder & Editor-in-Chief';
      newBlock.founderBio1 = 'Sonu Kumar Saha एक युवा मीडिया उद्यमी और पत्रकार हैं, जिन्होंने The Desi Andaz Media Network की शुरुआत की है।';
      newBlock.founderBio2 = 'उनके नेतृत्व में The Desi Andaz तेजी से एक आधुनिक मीडिया ब्रांड के रूप में विकसित हो रहा है।';
      newBlock.founderQuote = 'पत्रकारिता समाज की वह आवाज़ होनी चाहिए जो दबी हुई है, और हमारा लक्ष्य उसी आवाज़ को बिना किसी भय के एक मंच देना है।';
      newBlock.founderImage = '/founder.png';
    } else if (type === 'manifesto') {
      newBlock.title = 'Our Manifesto';
      newBlock.items = [
        'Registered & Recognized Media Network',
        'Commitment to Responsible Journalism',
        'Unbiased Ground-Level Reporting',
        'Transparent Editorial Practices',
        'Serving the Public Interest First'
      ];
    } else if (type === 'ad_banner') {
      newBlock.adCategory = 'Home';
      newBlock.position = '1';
    } else if (type === 'spacer') {
      newBlock.height = '30';
      newBlock.style = 'none';
    }

    setBlocks(prev => [...prev, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const updateBlockProperty = (id: string, key: string, value: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [key]: value } : b));
  };

  const updateColumnProperty = (blockId: string, colIdx: number, key: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newCols = [...b.cols];
        newCols[colIdx] = { ...newCols[colIdx], [key]: value };
        return { ...b, cols: newCols };
      }
      return b;
    }));
  };

  // Real-time SEO checklist auditor
  const auditSEO = () => {
    const checks = [];
    let score = 0;

    // 1. Title Checks
    if (seoTitle.length === 0) {
      checks.push({ status: 'error', text: 'Meta Title is missing' });
    } else if (seoTitle.length < 40) {
      checks.push({ status: 'warning', text: `Meta Title is too short (${seoTitle.length} chars). Ideal: 50-60.` });
      score += 15;
    } else if (seoTitle.length >= 50 && seoTitle.length <= 60) {
      checks.push({ status: 'success', text: 'Meta Title is perfectly optimized (50-60 chars)' });
      score += 30;
    } else if (seoTitle.length > 60) {
      checks.push({ status: 'warning', text: `Meta Title is too long (${seoTitle.length} chars) and will be truncated.` });
      score += 20;
    } else {
      checks.push({ status: 'success', text: 'Meta Title is a good length' });
      score += 25;
    }

    // 2. Description Checks
    if (seoDesc.length === 0) {
      checks.push({ status: 'error', text: 'Meta Description is missing' });
    } else if (seoDesc.length < 100) {
      checks.push({ status: 'warning', text: `Meta Description is too short (${seoDesc.length} chars). Ideal: 120-160.` });
      score += 15;
    } else if (seoDesc.length >= 120 && seoDesc.length <= 160) {
      checks.push({ status: 'success', text: 'Meta Description is perfectly optimized (120-160 chars)' });
      score += 30;
    } else if (seoDesc.length > 160) {
      checks.push({ status: 'warning', text: `Meta Description is too long (${seoDesc.length} chars) and will be truncated.` });
      score += 20;
    } else {
      checks.push({ status: 'success', text: 'Meta Description is a good length' });
      score += 25;
    }

    // 3. Keywords Checks
    const keysCount = seoKeys ? seoKeys.split(',').filter(k => k.trim()).length : 0;
    if (keysCount === 0) {
      checks.push({ status: 'error', text: 'Focus keywords are missing' });
    } else if (keysCount < 3) {
      checks.push({ status: 'warning', text: `Add more focus keywords (${keysCount} added. Target at least 3).` });
      score += 10;
    } else {
      checks.push({ status: 'success', text: `Excellent keyword targeting (${keysCount} keywords set)` });
      score += 20;
    }

    // 4. Social Sharing Image
    if (!seoImage) {
      checks.push({ status: 'warning', text: 'No social sharing image is uploaded' });
      score += 10;
    } else {
      checks.push({ status: 'success', text: 'Social share custom thumbnail is set' });
      score += 20;
    }

    return { checks, score };
  };

  const seoAudit = auditSEO();

  // Get score color
  const getScoreColor = (score: number) => {
    if (score < 40) return '#ef4444'; // Red
    if (score < 75) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  return (
    <div className={styles.container}>
      
      {/* Visual Masthead and Mode Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className={styles.title} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-magic" style={{ color: 'var(--primary)' }} /> Visual Page Editor & SEO Suite
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Edit page contents visually and tune search engine ranking in real time.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Mode Switchers */}
          <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px' }}>
            <button 
              type="button" 
              onClick={() => setEditorMode('forms')} 
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: editorMode === 'forms' ? '#fff' : 'transparent', color: editorMode === 'forms' ? '#1e293b' : '#64748b', transition: 'all 0.2s' }}
            >
              Forms Mode
            </button>
            <button 
              type="button" 
              onClick={() => setEditorMode('drag-and-drop')} 
              style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '6px', border: 'none', cursor: 'pointer', background: editorMode === 'drag-and-drop' ? '#fff' : 'transparent', color: editorMode === 'drag-and-drop' ? '#1e293b' : '#64748b', transition: 'all 0.2s' }}
            >
              Elementor Drag & Drop
            </button>
          </div>

          <select 
            className={styles.formSelect} 
            style={{ width: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, background: '#fff' }}
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
          >
            {AVAILABLE_PAGES.map(page => (
              <option key={page.slug} value={page.slug}>Edit Page: {page.name}</option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', fontWeight: '600', animation: 'fadeIn 0.5s ease' }}>
          <i className="fas fa-check-circle" style={{ marginRight: '10px', fontSize: '18px' }}></i>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '80px 40px', textAlign: 'center', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', marginBottom: '14px', color: 'var(--primary)' }}></i>
          <p style={{ fontWeight: 600 }}>Loading visual assets for {selectedPage}...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px' }}>
          
          {/* LEFT COLUMN: INTERACTIVE VISUAL CANVAS OR FORMS */}
          {editorMode === 'forms' ? (
            <div className={styles.card} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                <div style={{ background: '#fff1f2', color: '#f43f5e', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '18px', boxShadow: '0 4px 10px rgba(244,63,94,0.1)' }}>
                  <i className="fas fa-edit"></i>
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Visual Content Blocks (Forms Mode)</h2>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Modify specific content placeholders on this page.</p>
                </div>
              </div>
              
              {renderContentFields(selectedPage, content, handleContentChange, handleImageUpload)}
            </div>
          ) : (
            /* ELEMENTOR DRAG & DROP BUILDER INTERFACE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Widgets & Library selection bar */}
              <div className={styles.card} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-cubes" style={{ color: 'var(--primary)' }} /> Elementor Widgets Library
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Click on a widget below to append it to your custom page builder canvas.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {WIDGETS.map(widget => (
                    <button
                      key={widget.type}
                      type="button"
                      onClick={() => addBlock(widget.type)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.01)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.background = '#fff8f8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                        <i className={`fas ${widget.icon}`} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{widget.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>{widget.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Builder Canvas Area */}
              <div className={styles.card} style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '2px dashed #cbd5e1' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#64748b' }} /> Visual Canvas Preview</span>
                  <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '3px 8px', borderRadius: '12px' }}>{blocks.length} blocks added</span>
                </h3>

                {blocks.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="fas fa-mouse-pointer" style={{ fontSize: '32px', marginBottom: '14px', color: '#cbd5e1' }} />
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>Canvas is currently empty!</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Select layout widgets from the library above to compose a premium landing page layout.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                          opacity: draggedIndex === idx ? 0.4 : 1,
                          cursor: 'grab'
                        }}
                      >
                        {/* Block Header Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fafafb', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ cursor: 'move', color: '#94a3b8', fontSize: '14px' }}>
                              <i className="fas fa-grip-vertical" />
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                              {block.type}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                              {block.type === 'hero' ? `Hero: "${block.title}"` : 
                               block.type === 'text' ? 'Rich Text Segment' : 
                               block.type === 'notice' ? `Notice Ticker: "${block.headline}"` : 
                               block.type === 'video' ? 'Video Player' : 
                               block.type === 'columns' ? `${block.colsCount}-Column Cards Row` : 
                               block.type === 'founder' ? `Founder Card: ${block.founderName}` :
                               block.type === 'manifesto' ? `Manifesto Checklist` :
                               block.type === 'ad_banner' ? `Ad Banner Position: ${block.position}` : 
                               'Spacer Divider'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button type="button" onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}><i className="fas fa-chevron-up" style={{ fontSize: '10px' }} /></button>
                            <button type="button" onClick={() => moveBlock(idx, 'down')} disabled={idx === blocks.length - 1} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}><i className="fas fa-chevron-down" style={{ fontSize: '10px' }} /></button>
                            <button 
                              type="button" 
                              onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)} 
                              style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: editingBlockId === block.id ? '#fef3c7' : '#fff', color: editingBlockId === block.id ? '#d97706' : '#64748b' }}
                            >
                              <i className="fas fa-cog" style={{ fontSize: '11px' }} />
                            </button>
                            <button type="button" onClick={() => deleteBlock(block.id)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#ef4444' }}><i className="fas fa-trash" style={{ fontSize: '10px' }} /></button>
                          </div>
                        </div>

                        {/* Collapsible Edit Parameters Drawer */}
                        {editingBlockId === block.id && (
                          <div style={{ padding: '20px', background: '#fcfcfe', borderBottom: '1px solid #f1f5f9' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>Tweak Element Parameters</h4>
                            
                            {block.type === 'hero' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Headline Title</label>
                                  <input type="text" value={block.title} onChange={(e) => updateBlockProperty(block.id, 'title', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Subtitle Caption</label>
                                  <input type="text" value={block.subtitle} onChange={(e) => updateBlockProperty(block.id, 'subtitle', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Background Color</label>
                                  <input type="color" value={block.bgColor} onChange={(e) => updateBlockProperty(block.id, 'bgColor', e.target.value)} style={{ width: '100%', height: '38px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Text Color</label>
                                  <input type="color" value={block.textColor} onChange={(e) => updateBlockProperty(block.id, 'textColor', e.target.value)} style={{ width: '100%', height: '38px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Background Image URL (Optional)</label>
                                  <input type="text" value={block.bgImage} onChange={(e) => updateBlockProperty(block.id, 'bgImage', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Button Text</label>
                                  <input type="text" value={block.buttonText} onChange={(e) => updateBlockProperty(block.id, 'buttonText', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Button Redirect Link</label>
                                  <input type="text" value={block.buttonLink} onChange={(e) => updateBlockProperty(block.id, 'buttonLink', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                              </div>
                            )}

                            {block.type === 'text' && (
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Rich Text Content</label>
                                <textarea value={block.body} onChange={(e) => updateBlockProperty(block.id, 'body', e.target.value)} style={{ width: '100%', minHeight: '120px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6' }} />
                                
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Font Size (Pixels)</label>
                                    <input type="number" min="12" max="32" value={block.fontSize} onChange={(e) => updateBlockProperty(block.id, 'fontSize', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Text Color</label>
                                    <input type="color" value={block.color} onChange={(e) => updateBlockProperty(block.id, 'color', e.target.value)} style={{ width: '100%', height: '38px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {block.type === 'notice' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '12px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Alert Ticker Banner Text</label>
                                  <input type="text" value={block.headline} onChange={(e) => updateBlockProperty(block.id, 'headline', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bg CSS Color</label>
                                  <input type="text" value={block.bgGradient} onChange={(e) => updateBlockProperty(block.id, 'bgGradient', e.target.value)} placeholder="e.g. #dc2626" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                              </div>
                            )}

                            {block.type === 'video' && (
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>YouTube or Vimeo Video Link</label>
                                <input type="url" value={block.url} onChange={(e) => updateBlockProperty(block.id, 'url', e.target.value)} placeholder="E.g., https://www.youtube.com/watch?v=..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                              </div>
                            )}

                            {block.type === 'columns' && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Column Count</label>
                                  <select value={block.colsCount} onChange={(e) => {
                                    const count = parseInt(e.target.value);
                                    const newCols = [...block.cols];
                                    if (count > newCols.length) {
                                      for (let i = newCols.length; i < count; i++) {
                                        newCols.push({ title: 'New Feature', desc: 'Description of block', btn: 'Explore', link: '#' });
                                      }
                                    } else {
                                      newCols.splice(count);
                                    }
                                    updateBlockProperty(block.id, 'colsCount', e.target.value);
                                    updateBlockProperty(block.id, 'cols', newCols);
                                  }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                    <option value="2">2 Columns</option>
                                    <option value="3">3 Columns</option>
                                    <option value="4">4 Columns</option>
                                  </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                  {block.cols.map((col: any, cIdx: number) => (
                                    <div key={cIdx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Column Card #{cIdx + 1} Settings</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <input type="text" placeholder="Card Title" value={col.title} onChange={(e) => updateColumnProperty(block.id, cIdx, 'title', e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
                                        <input type="text" placeholder="Description/Body" value={col.desc} onChange={(e) => updateColumnProperty(block.id, cIdx, 'desc', e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
                                        <input type="text" placeholder="Btn Label" value={col.btn} onChange={(e) => updateColumnProperty(block.id, cIdx, 'btn', e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
                                        <input type="text" placeholder="Btn Link Redirect" value={col.link} onChange={(e) => updateColumnProperty(block.id, cIdx, 'link', e.target.value)} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {block.type === 'founder' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Name</label>
                                  <input type="text" value={block.founderName} onChange={(e) => updateBlockProperty(block.id, 'founderName', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Title</label>
                                  <input type="text" value={block.founderTitle} onChange={(e) => updateBlockProperty(block.id, 'founderTitle', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bio Paragraph 1</label>
                                  <textarea value={block.founderBio1} onChange={(e) => updateBlockProperty(block.id, 'founderBio1', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '60px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Bio Paragraph 2 (Optional)</label>
                                  <textarea value={block.founderBio2} onChange={(e) => updateBlockProperty(block.id, 'founderBio2', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '60px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Quote</label>
                                  <input type="text" value={block.founderQuote} onChange={(e) => updateBlockProperty(block.id, 'founderQuote', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Image URL or Path</label>
                                  <input type="text" value={block.founderImage} onChange={(e) => updateBlockProperty(block.id, 'founderImage', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                              </div>
                            )}

                            {block.type === 'manifesto' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Manifesto Section Title</label>
                                  <input type="text" value={block.title} onChange={(e) => updateBlockProperty(block.id, 'title', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                {[0, 1, 2, 3, 4].map((itemIdx) => (
                                  <div key={itemIdx}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>Manifesto Item #{itemIdx + 1}</label>
                                    <input 
                                      type="text" 
                                      value={block.items?.[itemIdx] || ''} 
                                      onChange={(e) => {
                                        const newItems = [...(block.items || [])];
                                        newItems[itemIdx] = e.target.value;
                                        updateBlockProperty(block.id, 'items', newItems);
                                      }} 
                                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {block.type === 'ad_banner' && (
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Ad Category Group</label>
                                  <select value={block.adCategory} onChange={(e) => updateBlockProperty(block.id, 'adCategory', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                    <option value="Home">Home Page Ads</option>
                                    <option value="News">News Details Ads</option>
                                    <option value="Politics">Politics Category Ads</option>
                                  </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Creative Position Slot</label>
                                  <select value={block.position} onChange={(e) => updateBlockProperty(block.id, 'position', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                    <option value="1">Position Slot 1</option>
                                    <option value="2">Position Slot 2</option>
                                    <option value="3">Position Slot 3</option>
                                    <option value="4">Position Slot 4</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {block.type === 'spacer' && (
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Spacer Height (Pixels)</label>
                                  <input type="number" min="5" max="200" value={block.height} onChange={(e) => updateBlockProperty(block.id, 'height', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Divider Line Style</label>
                                  <select value={block.style} onChange={(e) => updateBlockProperty(block.id, 'style', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                                    <option value="none">No Divider Line (Empty Gap)</option>
                                    <option value="solid">Solid Line</option>
                                    <option value="dashed">Dashed Line</option>
                                    <option value="dotted">Dotted Line</option>
                                  </select>
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        {/* MOCK VISUAL RENDERING OF BLOCKS INSIDE THE CANVAS WORKSPACE */}
                        <div style={{ padding: '16px', background: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                          {block.type === 'hero' && (
                            <div style={{ background: block.bgColor, color: block.textColor, padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundImage: block.bgImage ? `url(${block.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                              <div style={{ fontSize: '16px', fontWeight: 800 }}>{block.title}</div>
                              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{block.subtitle}</div>
                              <button type="button" style={{ marginTop: '8px', background: block.textColor, color: block.bgColor, border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{block.buttonText}</button>
                            </div>
                          )}

                          {block.type === 'text' && (
                            <div style={{ fontSize: `${block.fontSize}px`, color: block.color, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {block.body}
                            </div>
                          )}

                          {block.type === 'notice' && (
                            <div style={{ background: block.bgGradient, color: '#fff', padding: '10px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                              <i className="fas fa-bullhorn" /> <span>{block.headline}</span>
                            </div>
                          )}

                          {block.type === 'video' && (
                            <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                              <i className="fab fa-youtube" style={{ color: '#ff0000', fontSize: '24px', marginRight: '6px' }} />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Simulated Video: </span>
                              <code style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold' }}>{block.url}</code>
                            </div>
                          )}

                          {block.type === 'columns' && (
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${block.colsCount}, 1fr)`, gap: '12px' }}>
                              {block.cols.map((col: any, cIdx: number) => (
                                <div key={cIdx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{col.title}</div>
                                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{col.desc}</div>
                                  <button type="button" style={{ marginTop: '6px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '9px' }}>{col.btn}</button>
                                </div>
                              ))}
                            </div>
                          )}

                          {block.type === 'founder' && (
                            <div style={{ display: 'flex', gap: '14px', background: '#fafafb', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <img src={block.founderImage || '/founder.png'} alt="founder" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{block.founderName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{block.founderTitle}</div>
                                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>{block.founderBio1?.substring(0, 80)}...</div>
                                <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--primary)', marginTop: '4px' }}>"{block.founderQuote}"</div>
                              </div>
                            </div>
                          )}

                          {block.type === 'manifesto' && (
                            <div style={{ background: '#fafafb', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>{block.title}</div>
                              <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '11px', color: '#475569' }}>
                                {block.items?.map((item: string, iIdx: number) => (
                                  <li key={iIdx} style={{ marginBottom: '2px' }}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {block.type === 'ad_banner' && (
                            <div style={{ border: '2px dashed #f43f5e', background: '#fff5f5', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}><i className="fas fa-ad" /> Mock Banner Placement</div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Category: {block.adCategory} | Slot Position: {block.position}</div>
                              <div style={{ fontSize: '9px', color: '#64748b' }}>Will automatically resolve desktop or mobile HD banners on frontend</div>
                            </div>
                          )}

                          {block.type === 'spacer' && (
                            <div style={{ height: `${block.height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              <div style={{ width: '100%', height: '1px', borderTop: block.style !== 'none' ? `1px ${block.style} #cbd5e1` : 'none', position: 'absolute' }} />
                              <span style={{ background: '#fafafb', color: '#94a3b8', fontSize: '9px', padding: '0 8px', zIndex: 1 }}>Spacer Gap: {block.height}px</span>
                            </div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* RIGHT COLUMN: YOAST/RANKMATH STYLE SEO AUDITOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* 1. REAL-TIME SEO AUDIT SCORE */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ background: '#f0fdf4', color: '#16a34a', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '18px', boxShadow: '0 4px 10px rgba(22,163,74,0.1)' }}>
                    <i className="fas fa-heartbeat"></i>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>SEO Quality Auditor</h2>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Calculated in real time.</p>
                  </div>
                </div>
                
                {/* Visual score badge */}
                <div style={{ 
                  background: getScoreColor(seoAudit.score),
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '22px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  boxShadow: `0 4px 12px ${getScoreColor(seoAudit.score)}66`,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '2px'
                }}>
                  {seoAudit.score}<span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 500 }}>/100</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', marginTop: '20px', overflow: 'hidden' }}>
                <div style={{ width: `${seoAudit.score}%`, height: '100%', background: getScoreColor(seoAudit.score), borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
              </div>
            </div>

            {/* 2. REAL-TIME SEARCH & SOCIAL SNIPPET PREVIEW SYSTEM */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              
              {/* Tab Switchers */}
              <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #f1f5f9', paddingBottom: '1px', marginBottom: '20px', overflowX: 'auto' }}>
                <button 
                  type="button"
                  onClick={() => setActiveSeoTab('google')}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'google' ? 'var(--primary)' : '#64748b', borderBottom: activeSeoTab === 'google' ? '3px solid var(--primary)' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fab fa-google" /> Google
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSeoTab('facebook')}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'facebook' ? '#1877f2' : '#64748b', borderBottom: activeSeoTab === 'facebook' ? '3px solid #1877f2' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fab fa-facebook" /> Facebook
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSeoTab('twitter')}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'twitter' ? '#000' : '#64748b', borderBottom: activeSeoTab === 'twitter' ? '3px solid #000' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fab fa-x-twitter" /> Twitter X
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveSeoTab('advanced')}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 700, color: activeSeoTab === 'advanced' ? '#7c3aed' : '#64748b', borderBottom: activeSeoTab === 'advanced' ? '3px solid #7c3aed' : '3px solid transparent', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fas fa-cog" /> Advanced Tags
                </button>
              </div>

              {/* TAB 1: GOOGLE SNIPPET SIMULATOR */}
              {activeSeoTab === 'google' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Google Search Result Preview</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => setPreviewDevice('mobile')} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', background: previewDevice === 'mobile' ? '#e2e8f0' : 'transparent', border: 'none', cursor: 'pointer' }}><i className="fas fa-mobile-alt" /> Mobile</button>
                      <button type="button" onClick={() => setPreviewDevice('desktop')} style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', background: previewDevice === 'desktop' ? '#e2e8f0' : 'transparent', border: 'none', cursor: 'pointer' }}><i className="fas fa-desktop" /> Desktop</button>
                    </div>
                  </div>

                  {/* Simulated snippet box */}
                  <div style={{ 
                    background: '#fff', 
                    border: '1px solid #dadce0', 
                    borderRadius: previewDevice === 'mobile' ? '12px' : '8px', 
                    padding: previewDevice === 'mobile' ? '12px 14px' : '16px',
                    maxWidth: previewDevice === 'mobile' ? '380px' : '100%',
                    boxShadow: '0 1px 6px rgba(32,33,36,0.1)',
                    margin: '0 auto 16px auto',
                    fontFamily: 'arial, sans-serif'
                  }}>
                    {/* Site header URL */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>N</div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#202124', lineHeight: '1.2' }}>The Desi Andaz</div>
                        <div style={{ fontSize: '11px', color: '#5f6368', lineHeight: '1.2' }}>
                          https://thedesiandaz.com <span style={{ color: '#70757a' }}>› {selectedPage}</span>
                        </div>
                      </div>
                    </div>
                    {/* Title */}
                    <div style={{ 
                      fontSize: previewDevice === 'mobile' ? '20px' : '19px', 
                      color: '#1a0dab', 
                      fontWeight: 400,
                      lineHeight: '1.3',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      margin: '4px 0 6px 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {seoTitle || `Page Title | ${selectedPage} - The Desi Andaz`}
                    </div>
                    {/* Snippet Description */}
                    <div style={{ fontSize: '14px', color: '#4d5156', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      <span style={{ color: '#70757a' }}>{new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })} — </span>
                      {seoDesc || 'Please enter a Meta Description in the inputs below to simulate Google search engine display snippet preview...'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FACEBOOK POST SIMULATOR */}
              {activeSeoTab === 'facebook' && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>Facebook Share Preview</span>
                  
                  {/* Simulated Facebook Box */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff', maxWidth: '400px', margin: '0 auto 16px auto', fontFamily: 'SFProText-Regular, Helvetica, Arial, sans-serif' }}>
                    {seoImage ? (
                      <img src={seoImage} alt="FB OG Link" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '200px', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                        <i className="far fa-image" style={{ fontSize: '32px', marginBottom: '6px' }} />
                        <span style={{ fontSize: '12px' }}>No Social Image Uploaded</span>
                      </div>
                    )}
                    <div style={{ padding: '12px', background: '#f2f3f5', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '11px', color: '#606770', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THEDESIANDAZ.COM</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1d2129', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {seoTitle || `Page Title | ${selectedPage}`}
                      </div>
                      <div style={{ fontSize: '12px', color: '#606770', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                        {seoDesc || 'Customize the Meta Description to control how it looks when shared.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TWITTER CARD SIMULATOR */}
              {activeSeoTab === 'twitter' && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>Twitter X Card Preview</span>
                  
                  {/* Simulated Twitter Card */}
                  <div style={{ border: '1px solid #e1e8ed', borderRadius: '16px', overflow: 'hidden', background: '#fff', maxWidth: '380px', margin: '0 auto 16px auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                    {seoImage ? (
                      <img src={seoImage} alt="Twitter Card" style={{ width: '100%', height: '190px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '190px', background: '#f5f8fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8899a6' }}>
                        <i className="far fa-image" style={{ fontSize: '32px', marginBottom: '6px' }} />
                        <span style={{ fontSize: '12px' }}>No Social Image Uploaded</span>
                      </div>
                    )}
                    <div style={{ padding: '12px', borderTop: '1px solid #e1e8ed' }}>
                      <div style={{ fontSize: '12px', color: '#536471', marginBottom: '2px' }}>thedesiandaz.com</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f1419', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {seoTitle || `Page Title | ${selectedPage}`}
                      </div>
                      <div style={{ fontSize: '13px', color: '#536471', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                        {seoDesc || 'Customize the Meta Description for optimized tweet link snippets.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ADVANCED CONFIGS (ROBOTS / CANONICAL) */}
              {activeSeoTab === 'advanced' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block' }}>Search Engine Advanced Controls</span>
                  
                  {/* Index / Noindex Toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Index this page?</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>If disabled, search engines won&apos;t index this page (noindex).</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                      <input type="checkbox" checked={indexing} onChange={(e) => setIndexing(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: indexing ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px' }} className="toggle-bg"></span>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: indexing ? '20px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </label>
                  </div>

                  {/* Follow / Nofollow Toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Follow links on this page?</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>If disabled, search engine crawlers won&apos;t follow links here (nofollow).</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                      <input type="checkbox" checked={following} onChange={(e) => setFollowing(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: following ? '#10b981' : '#cbd5e1', transition: '.3s', borderRadius: '34px' }} className="toggle-bg"></span>
                      <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: following ? '20px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </label>
                  </div>

                  {/* Canonical URL custom input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Canonical URL</label>
                    <input 
                      type="url" 
                      value={canonicalUrl} 
                      onChange={(e) => setCanonicalUrl(e.target.value)} 
                      placeholder="https://thedesiandaz.com/..." 
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} 
                    />
                  </div>
                </div>
              )}

              {/* INPUT FIELDS */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className={styles.formLabel} style={{ margin: 0 }}>Meta Title</label>
                    <span style={{ fontSize: '11px', color: seoTitle.length >= 50 && seoTitle.length <= 60 ? '#10b981' : '#64748b', fontWeight: 600 }}>{seoTitle.length} chars (Ideal: 50-60)</span>
                  </div>
                  <input type="text" className={styles.formInput} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="E.g., About Us - The Desi Andaz" />
                </div>
                
                <div className={styles.formGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className={styles.formLabel} style={{ margin: 0 }}>Meta Description</label>
                    <span style={{ fontSize: '11px', color: seoDesc.length >= 120 && seoDesc.length <= 160 ? '#10b981' : '#64748b', fontWeight: 600 }}>{seoDesc.length} chars (Ideal: 120-160)</span>
                  </div>
                  <textarea className={styles.formInput} style={{ minHeight: '80px' }} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Short description for Google search results..." />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Keywords (Comma separated)</label>
                  <input type="text" className={styles.formInput} value={seoKeys} onChange={(e) => setSeoKeys(e.target.value)} placeholder="news, hindi news, india" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Social Media Sharing Image (1200x630 recomendado)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {seoImage && (
                      <img src={seoImage} alt="SEO Thumbnail" style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    )}
                    <input type="file" accept="image/*" onChange={handleSeoImageUpload} style={{ fontSize: '12px' }} />
                  </div>
                </div>
              </div>

            </div>

            {/* 3. SEO CHECKLIST REPORT */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ background: '#fef3c7', color: '#d97706', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', fontSize: '16px' }}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>SEO Improvement Checklist</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {seoAudit.checks.map((check, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                    <span style={{ 
                      color: check.status === 'success' ? '#10b981' : check.status === 'warning' ? '#eab308' : '#ef4444',
                      marginTop: '2px'
                    }}>
                      <i className={check.status === 'success' ? 'fas fa-check-circle' : check.status === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-times-circle'} />
                    </span>
                    <span style={{ color: '#475569', lineHeight: '1.4' }}>{check.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SAVE BUTTON SECTION (FULL WIDTH) */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '10px', padding: '20px 0', borderTop: '1px solid #e2e8f0' }}>
            <button type="submit" className={styles.btnPrimary} style={{ padding: '14px 44px', fontSize: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }} disabled={loading}>
              <i className="fas fa-save"></i> Save Page Content & SEO settings
            </button>
          </div>

        </form>
      )}
    </div>
  );
}

// Helper to render dynamic fields based on selected page (Forms mode)
function renderContentFields(page: string, content: any, onChange: any, onImageUpload: any) {
  if (page === 'home') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Hero Section Title (ताज़ा खबरें शीर्षक)</label>
          <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.heroTitle || 'ताज़ा खबरें'} onChange={(e) => onChange('heroTitle', e.target.value)} />
        </div>
      </div>
    );
  }
  
  if (page === 'about') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Page Main Heading (शीर्षक)</label>
          <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.heading || ''} onChange={(e) => onChange('heading', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Page Subheading (उपशीर्षक)</label>
          <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.subheading || ''} onChange={(e) => onChange('subheading', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>About Us Editorial Paragraph 1 (पैराग्राफ 1)</label>
          <textarea style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px', lineHeight: '1.6' }} value={content.paragraph1 || ''} onChange={(e) => onChange('paragraph1', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>About Us Editorial Paragraph 2 (पैराग्राफ 2)</label>
          <textarea style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px', lineHeight: '1.6' }} value={content.paragraph2 || ''} onChange={(e) => onChange('paragraph2', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Visual Hero Banner (मुख्य बैनर इमेज)</label>
          {content.aboutImage && (
            <img src={content.aboutImage} alt="preview" style={{ width: '100%', height: '140px', objectFit: 'cover', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => onImageUpload('aboutImage', e)} style={{ fontSize: '12px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Our Mission (हमारा मिशन)</label>
            <textarea style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px' }} value={content.mission || ''} onChange={(e) => onChange('mission', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Our Vision (हमारा विजन)</label>
            <textarea style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px' }} value={content.vision || ''} onChange={(e) => onChange('vision', e.target.value)} />
          </div>
        </div>
        
        {/* Founder Fields */}
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>Founder Profile (संस्थापक प्रोफ़ाइल)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Name</label>
              <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content.founderName || ''} onChange={(e) => onChange('founderName', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Title</label>
              <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content.founderTitle || ''} onChange={(e) => onChange('founderTitle', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Bio Part 1</label>
              <textarea style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content.founderBio1 || ''} onChange={(e) => onChange('founderBio1', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Bio Part 2</label>
              <textarea style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content.founderBio2 || ''} onChange={(e) => onChange('founderBio2', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Founder Quote</label>
              <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content.founderQuote || ''} onChange={(e) => onChange('founderQuote', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Manifesto Fields */}
        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '16px', marginTop: '10px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>Our Manifesto Points (घोषणापत्र)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Item #{num}</label>
                <input type="text" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={content[`manifestoItem${num}`] || ''} onChange={(e) => onChange(`manifestoItem${num}`, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Contact Page Heading</label>
          <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.heading || 'Contact The Desi Andaz'} onChange={(e) => onChange('heading', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Office Address</label>
          <textarea style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px', fontSize: '14px' }} value={content.address || ''} onChange={(e) => onChange('address', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Support Email</label>
          <input type="email" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.email || ''} onChange={(e) => onChange('email', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Contact Mobile Number</label>
          <input type="text" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} value={content.mobile || ''} onChange={(e) => onChange('mobile', e.target.value)} />
        </div>
      </div>
    );
  }

  // Default fallback for other pages
  return (
    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
      <i className="fas fa-tools" style={{ fontSize: '28px', color: '#94a3b8', marginBottom: '12px', display: 'block' }}></i>
      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', margin: '0 0 6px 0' }}>Dynamic visual builder for <b>{page}</b></p>
      <p style={{ fontSize: '12px', margin: 0 }}>All content, assets, and properties can be configured dynamically here. Use text inputs and file loaders to build layout components.</p>
    </div>
  );
}

function getDefaultContent(page: string) {
  if (page === 'about') return { heading: 'About The Desi Andaz', p1: 'We are a premium news portal...' };
  if (page === 'contact') return { heading: 'Contact The Desi Andaz', address: 'Ranchi, Jharkhand, India', email: 'support@thedesiandaz.com', mobile: '+91 8409659560' };
  return {};
}
