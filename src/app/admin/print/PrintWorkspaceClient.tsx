'use client';

import React, { useState } from 'react';
import styles from '../admin.module.css';
import { updateArticlePrintLayout, publishPrintEdition } from '@/actions/print';

export default function PrintWorkspaceClient({ initialArticles }: { initialArticles: any[] }) {
  const [articles, setArticles] = useState<any[]>(initialArticles);
  const [selectedArticles, setSelectedArticles] = useState<any[]>(
    initialArticles.filter(a => a.isPrintSelected)
  );
  const [unselectedArticles, setUnselectedArticles] = useState<any[]>(
    initialArticles.filter(a => !a.isPrintSelected)
  );

  const [savingId, setSavingId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1-16 Pages for selection
  const totalPages = Array.from({ length: 16 }, (_, i) => i + 1);

  const handleToggleSelect = async (article: any) => {
    setSavingId(article.id);
    const isNowSelected = !selectedArticles.some(a => a.id === article.id);
    
    // Update local state first
    if (isNowSelected) {
      const updatedArticle = {
        ...article,
        isPrintSelected: true,
        printPage: article.printPage || 1,
        printHeadline: article.printHeadline || article.title
      };
      setUnselectedArticles(prev => prev.filter(a => a.id !== article.id));
      setSelectedArticles(prev => [...prev, updatedArticle]);
      
      // Save to database
      await updateArticlePrintLayout(article.id, {
        isPrintSelected: true,
        printPage: article.printPage || 1,
        printHeadline: article.printHeadline || article.title
      });
    } else {
      const updatedArticle = {
        ...article,
        isPrintSelected: false,
        printPage: null,
        printHeadline: null
      };
      setSelectedArticles(prev => prev.filter(a => a.id !== article.id));
      setUnselectedArticles(prev => [...prev, updatedArticle]);

      // Save to database
      await updateArticlePrintLayout(article.id, {
        isPrintSelected: false,
        printPage: null,
        printHeadline: null
      });
    }
    setSavingId(null);
  };

  const handlePageChange = async (articleId: string, pageNum: number) => {
    setSavingId(articleId);
    
    // Update local state
    setSelectedArticles(prev =>
      prev.map(a => (a.id === articleId ? { ...a, printPage: pageNum } : a))
    );

    // Save to database
    await updateArticlePrintLayout(articleId, {
      printPage: pageNum
    });
    
    setSavingId(null);
  };

  const handleHeadlineChange = async (articleId: string, headline: string) => {
    setSavingId(articleId);

    // Update local state
    setSelectedArticles(prev =>
      prev.map(a => (a.id === articleId ? { ...a, printHeadline: headline } : a))
    );

    // Save to database
    await updateArticlePrintLayout(articleId, {
      printHeadline: headline
    });

    setSavingId(null);
  };

  const handlePublish = async () => {
    if (selectedArticles.length === 0) {
      alert('Please select at least one article to publish in the print edition.');
      return;
    }
    
    if (!confirm(`Are you sure you want to publish the print edition with ${selectedArticles.length} article(s)? This will change their statuses to "Print Published".`)) {
      return;
    }

    setIsPublishing(true);
    try {
      const articleIds = selectedArticles.map(a => a.id);
      const res = await publishPrintEdition(articleIds);
      if (res.success) {
        alert('Print edition published successfully!');
        // Filter out published ones
        setSelectedArticles([]);
        setArticles(prev => prev.filter(a => !articleIds.includes(a.id)));
        setUnselectedArticles(prev => prev.filter(a => !articleIds.includes(a.id)));
      } else {
        alert('Failed to publish print edition: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during print publishing.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Group selected articles by page
  const articlesByPage = selectedArticles.reduce((acc, art) => {
    const page = art.printPage || 1;
    if (!acc[page]) acc[page] = [];
    acc[page].push(art);
    return acc;
  }, {} as Record<number, any[]>);

  const filteredUnselected = unselectedArticles.filter(art =>
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className={styles.pageHeader} style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-file-invoice" style={{ color: '#4f46e5' }}></i>
            <span>Print Layout Workspace</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Curate approved digital news, distribute articles across newspaper sheets, specify print headlines, and output layouts.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsPreviewOpen(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
          >
            <i className="fas fa-eye"></i>
            <span>Print Preview Sheet</span>
          </button>
          
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className="fas fa-paper-plane"></i>
            <span>{isPublishing ? 'Publishing...' : 'Publish Print Edition'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Column: Repository */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)',
          maxHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
              Approved News Repository
            </h3>
            <span style={{ fontSize: '12px', background: '#eeebff', color: '#4f46e5', fontWeight: 750, padding: '3px 8px', borderRadius: '12px' }}>
              {filteredUnselected.length} items
            </span>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search news by title, reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {filteredUnselected.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '13px' }}>
                No unselected articles found.
              </div>
            ) : (
              filteredUnselected.map(art => (
                <div key={art.id} style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a', lineHeight: '1.4' }}>
                    {art.title}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                    <span>✍️ {art.reporter}</span>
                    <span>📍 {art.district}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                      {art.category?.name || 'News'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleSelect(art)}
                      disabled={savingId === art.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#4f46e5',
                        borderColor: '#c7d2fe',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-plus"></i>
                      <span>Add to Print</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Sheet Planner */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                Print Edition Sheet Layout
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Assign print page numbers and customize specific headlines for the physical newspaper.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: 700 }}>
                Total Selected:
              </span>
              <span style={{ background: '#eeebff', color: '#4f46e5', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>
                {selectedArticles.length} articles
              </span>
            </div>
          </div>

          {selectedArticles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              color: '#94a3b8'
            }}>
              <i className="fas fa-newspaper" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }}></i>
              <span style={{ display: 'block', fontWeight: 700, color: '#475569', fontSize: '14px' }}>Planner is Empty</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Select articles from the repository on the left to allocate layout positions.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedArticles.map(art => (
                <div key={art.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}>
                  {savingId === art.id && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      fontSize: '11px',
                      color: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <i className="fas fa-circle-notch fa-spin"></i>
                      <span>Saving...</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '4px' }}>
                        {art.category?.name || 'News'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', lineHeight: '1.4' }}>
                        {art.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11.5px', color: '#64748b' }}>
                        <span>✍️ {art.reporter}</span>
                        <span>📍 {art.district}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSelect(art)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="Remove from print layout"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2.5fr',
                    gap: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    {/* Page selector */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        Assign Page Sheet
                      </label>
                      <select
                        value={art.printPage || 1}
                        onChange={(e) => handlePageChange(art.id, parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          fontWeight: 700,
                          background: '#ffffff',
                          color: '#1e293b'
                        }}
                      >
                        {totalPages.map(page => (
                          <option key={page} value={page}>Page {page}</option>
                        ))}
                      </select>
                    </div>

                    {/* Print Headline */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                        Print Headline (शीर्षक)
                      </label>
                      <input
                        type="text"
                        defaultValue={art.printHeadline || art.title}
                        onBlur={(e) => handleHeadlineChange(art.id, e.target.value)}
                        placeholder="Customize headline for printed news..."
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#1e293b'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINT PREVIEW DIALOG MODAL */}
      {isPreviewOpen && (
        <div className={styles.adminModalBackdrop} style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 9999
        }}>
          <div className={styles.adminModalContent} style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '1000px',
            width: '95%',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Newspaper Layout Sheet Preview
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Press Ctrl+P or click print to export the layout directly to a high-quality PDF.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fas fa-print"></i>
                  <span>Print / Export PDF</span>
                </button>
                
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    color: '#475569',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div id="print-sheet-printable" style={{
              padding: '32px',
              maxHeight: '70vh',
              overflowY: 'auto',
              background: '#f1f5f9'
            }}>
              {/* CSS block specifically for print styles */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #print-sheet-printable, #print-sheet-printable * {
                    visibility: visible;
                  }
                  #print-sheet-printable {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    background: white !important;
                    padding: 0 !important;
                    overflow: visible !important;
                    max-height: none !important;
                  }
                  .print-page-break {
                    page-break-after: always;
                    margin-top: 0;
                    padding-top: 20px;
                  }
                }
              `}</style>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                {totalPages.map(page => {
                  const pageArticles = articlesByPage[page] || [];
                  if (pageArticles.length === 0) return null;

                  return (
                    <div key={page} className="print-page-break" style={{ borderBottom: '2px dashed #cbd5e1', paddingBottom: '30px', marginBottom: '30px' }}>
                      {/* Newspaper Header */}
                      <div style={{ textAlign: 'center', borderBottom: '4px double #0f172a', paddingBottom: '12px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'Georgia, serif', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                          The Desi Andaz (द देसी अंदाज़)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginTop: '6px', borderTop: '1px solid #0f172a', paddingTop: '4px' }}>
                          <span>RNI: JHBIL/26/A3245</span>
                          <span style={{ background: '#0f172a', color: '#ffffff', padding: '1px 8px', borderRadius: '2px' }}>PAGE {page}</span>
                          <span>Coverage Area: Jharkhand</span>
                        </div>
                      </div>

                      {/* Newspaper Column Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: pageArticles.length > 1 ? '1fr 1fr' : '1fr', gap: '24px' }}>
                        {pageArticles.map((art: any, idx: number) => (
                          <div key={art.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: idx > 0 ? '1px solid #e2e8f0' : 'none', paddingLeft: idx > 0 ? '24px' : '0' }}>
                            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.3' }}>
                              {art.printHeadline || art.title}
                            </h2>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#475569', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '8px' }}>
                              <span>संवाददाता: {art.reporter}</span>
                              <span>स्थान: {art.district}</span>
                            </div>

                            {art.imageUrl && (
                              <img
                                src={art.imageUrl}
                                alt="Print Attachment"
                                style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                              />
                            )}

                            <div style={{
                              fontFamily: 'Georgia, serif',
                              fontSize: '13px',
                              lineHeight: '1.6',
                              color: '#1c1917',
                              textAlign: 'justify',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {art.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Catch case if no pages have articles */}
                {Object.keys(articlesByPage).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No articles allocated to print pages yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
