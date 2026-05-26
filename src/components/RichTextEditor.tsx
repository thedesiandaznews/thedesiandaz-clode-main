'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './RichTextEditor.module.css';
import { uploadFileAction } from '@/actions/upload';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TEXT_COLORS = [
  { name: 'Charcoal', value: '#1e293b' },
  { name: 'Saffron Red', value: '#dc2626' },
  { name: 'Saffron Orange', value: '#ea580c' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Forest Green', value: '#16a34a' },
  { name: 'Gold', value: '#d97706' },
  { name: 'Deep Purple', value: '#7c3aed' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Soft Saffron', value: '#ffedd5' },
  { name: 'Soft Yellow', value: '#fef08a' },
  { name: 'Soft Red', value: '#fee2e2' },
  { name: 'Soft Blue', value: '#dbeafe' },
  { name: 'Soft Green', value: '#dcfce7' },
  { name: 'Soft Purple', value: '#f3e8ff' },
];

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(false);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isHighlightMenuOpen, setIsHighlightMenuOpen] = useState(false);
  const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sync initial content
  useEffect(() => {
    if (editorRef.current && !isMounted.current) {
      editorRef.current.innerHTML = value || '';
      isMounted.current = true;
    }
  }, [value]);

  // Sync external updates (e.g. draft restoration) when not focused
  useEffect(() => {
    if (editorRef.current && isMounted.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const triggerChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    triggerChange();
  };

  const execCmd = (command: string, arg: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false, arg);
      triggerChange();
      editorRef.current?.focus();
    }
  };

  const handleLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      // Basic URL verification/formatting
      const formattedUrl = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      execCmd('createLink', formattedUrl);
      
      // Make links open in new tab and styled beautifully in editor
      if (editorRef.current) {
        const links = editorRef.current.getElementsByTagName('a');
        for (let i = 0; i < links.length; i++) {
          if (!links[i].hasAttribute('target')) {
            links[i].setAttribute('target', '_blank');
            links[i].setAttribute('rel', 'noopener noreferrer');
            links[i].style.color = '#ea580c';
            links[i].style.textDecoration = 'underline';
            links[i].style.fontWeight = '600';
          }
        }
        triggerChange();
      }
    }
  };

  const handleHeading = (tag: string) => {
    execCmd('formatBlock', tag);
    setIsHeadingMenuOpen(false);
  };

  const handleQuote = () => {
    execCmd('formatBlock', '<blockquote>');
    if (editorRef.current) {
      const quotes = editorRef.current.getElementsByTagName('blockquote');
      for (let i = 0; i < quotes.length; i++) {
        quotes[i].style.borderLeft = '4px solid #ea580c';
        quotes[i].style.paddingLeft = '16px';
        quotes[i].style.marginLeft = '0';
        quotes[i].style.marginRight = '0';
        quotes[i].style.fontStyle = 'italic';
        quotes[i].style.background = '#ffedd5';
        quotes[i].style.paddingTop = '10px';
        quotes[i].style.paddingBottom = '10px';
        quotes[i].style.borderRadius = '0 8px 8px 0';
      }
      triggerChange();
    }
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file only.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'news');

      const res = await uploadFileAction(formData);
      if (res.success && res.url) {
        insertImageBlock(res.url);
      } else {
        alert('Image upload failed: ' + (res.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during upload.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBrowseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const insertHtmlAtCursor = (html: string) => {
    let sel, range;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel && sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        
        const el = document.createElement('div');
        el.innerHTML = html;
        
        const frag = document.createDocumentFragment();
        let node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        
        range.insertNode(frag);
        
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  };

  const insertImageBlock = (url: string) => {
    const imageHtml = `
      <div class="content-image-block align-center size-medium" data-align="center" data-size="medium" contenteditable="false" style="display: block; text-align: center; margin: 20px auto; max-width: 60%; position: relative; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <img src="${url}" style="width: 100%; border-radius: 8px; display: block;" class="editor-inline-image" alt="Embedded Image" />
        <div class="image-actions-bar" style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 8px; background: #0f172a; padding: 6px 12px; border-radius: 20px; font-size: 11px; color: #fff; width: fit-content; margin-left: auto; margin-right: auto; user-select: none;">
          <button type="button" class="img-btn-align" data-action="align-left" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-weight:600; padding:2px 6px;">Left</button>
          <button type="button" class="img-btn-align" data-action="align-center" style="background:none; border:none; color:#ea580c; cursor:pointer; font-weight:700; padding:2px 6px;">Center</button>
          <button type="button" class="img-btn-align" data-action="align-right" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-weight:600; padding:2px 6px;">Right</button>
          <span style="color:#475569;">|</span>
          <button type="button" class="img-btn-size" data-action="size-small" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-weight:600; padding:2px 6px;">Small</button>
          <button type="button" class="img-btn-size" data-action="size-medium" style="background:none; border:none; color:#ea580c; cursor:pointer; font-weight:700; padding:2px 6px;">Medium</button>
          <button type="button" class="img-btn-size" data-action="size-full" style="background:none; border:none; color:#cbd5e1; cursor:pointer; font-weight:600; padding:2px 6px;">Full</button>
          <span style="color:#475569;">|</span>
          <button type="button" class="img-btn-delete" data-action="delete" style="background:none; border:none; color:#f87171; cursor:pointer; font-weight:600; padding:2px 6px;"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
      <p><br></p>
    `;
    
    if (editorRef.current) {
      editorRef.current.focus();
      
      const selection = window.getSelection();
      let isInside = false;
      if (selection && selection.rangeCount > 0) {
        let node = selection.anchorNode;
        while (node) {
          if (node === editorRef.current) {
            isInside = true;
            break;
          }
          node = node.parentNode;
        }
      }
      
      if (isInside) {
        insertHtmlAtCursor(imageHtml);
      } else {
        editorRef.current.innerHTML += imageHtml;
      }
      triggerChange();
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    const actionButton = target.closest('[data-action]');
    if (actionButton) {
      e.preventDefault();
      e.stopPropagation();
      
      const action = actionButton.getAttribute('data-action');
      const imageBlock = actionButton.closest('.content-image-block') as HTMLElement;
      if (!imageBlock) return;
      
      const allButtons = imageBlock.querySelectorAll('[data-action]');
      
      if (action === 'delete') {
        if (confirm('Delete this image from the article?')) {
          imageBlock.remove();
          triggerChange();
        }
        return;
      }
      
      if (action?.startsWith('align-')) {
        const align = action.replace('align-', '');
        
        imageBlock.setAttribute('data-align', align);
        imageBlock.className = `content-image-block align-${align} size-${imageBlock.getAttribute('data-size') || 'medium'}`;

        if (align === 'left') {
          imageBlock.style.float = 'left';
          imageBlock.style.margin = '10px 20px 10px 0';
          imageBlock.style.maxWidth = '35%';
          imageBlock.style.display = 'inline-block';
          imageBlock.style.textAlign = 'left';
        } else if (align === 'right') {
          imageBlock.style.float = 'right';
          imageBlock.style.margin = '10px 0 10px 20px';
          imageBlock.style.maxWidth = '35%';
          imageBlock.style.display = 'inline-block';
          imageBlock.style.textAlign = 'right';
        } else {
          imageBlock.style.float = 'none';
          imageBlock.style.margin = '20px auto';
          imageBlock.style.maxWidth = '60%';
          imageBlock.style.display = 'block';
          imageBlock.style.textAlign = 'center';
        }
        
        allButtons.forEach(btn => {
          const btnAct = btn.getAttribute('data-action');
          if (btnAct?.startsWith('align-')) {
            (btn as HTMLElement).style.color = btnAct === action ? '#ea580c' : '#cbd5e1';
            (btn as HTMLElement).style.fontWeight = btnAct === action ? '700' : '600';
          }
        });
      }
      
      if (action?.startsWith('size-')) {
        const size = action.replace('size-', '');
        imageBlock.setAttribute('data-size', size);
        imageBlock.className = `content-image-block align-${imageBlock.getAttribute('data-align') || 'center'} size-${size}`;

        if (size === 'small') {
          imageBlock.style.maxWidth = '30%';
        } else if (size === 'medium') {
          imageBlock.style.maxWidth = '60%';
        } else {
          imageBlock.style.maxWidth = '100%';
        }
        
        allButtons.forEach(btn => {
          const btnAct = btn.getAttribute('data-action');
          if (btnAct?.startsWith('size-')) {
            (btn as HTMLElement).style.color = btnAct === action ? '#ea580c' : '#cbd5e1';
            (btn as HTMLElement).style.fontWeight = btnAct === action ? '700' : '600';
          }
        });
      }
      
      triggerChange();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Loop files to support multiple uploads sequentially
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/')) {
          await handleImageFile(file);
        }
      }
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.dropdownContainer}`)) {
        setIsColorMenuOpen(false);
        setIsHighlightMenuOpen(false);
        setIsHeadingMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={styles.editorWrapper}>
      {/* Dynamic Toolbar */}
      <div className={styles.toolbar}>
        {/* Text Formats */}
        <div className={styles.dropdownContainer}>
          <button 
            type="button" 
            className={styles.toolbarBtn} 
            onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
            title="Text Style"
          >
            <i className="fas fa-heading"></i> <i className="fas fa-caret-down" style={{ fontSize: '10px', marginLeft: '2px' }}></i>
          </button>
          
          {isHeadingMenuOpen && (
            <div className={styles.dropdownMenu}>
              <button type="button" onClick={() => handleHeading('<p>')}>Normal Text</button>
              <button type="button" onClick={() => handleHeading('<h1>')} style={{ fontSize: '18px', fontWeight: 'bold' }}>Headline H1</button>
              <button type="button" onClick={() => handleHeading('<h2>')} style={{ fontSize: '16px', fontWeight: 'bold' }}>Section H2</button>
              <button type="button" onClick={() => handleHeading('<h3>')} style={{ fontSize: '14px', fontWeight: 'bold' }}>Sub-section H3</button>
            </div>
          )}
        </div>

        <div className={styles.divider}></div>

        {/* Basic Styles */}
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('bold')} title="Bold"><i className="fas fa-bold"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('italic')} title="Italic"><i className="fas fa-italic"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('underline')} title="Underline"><i className="fas fa-underline"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('strikeThrough')} title="Strikethrough"><i className="fas fa-strikethrough"></i></button>

        <div className={styles.divider}></div>

        {/* Colors */}
        <div className={styles.dropdownContainer}>
          <button 
            type="button" 
            className={styles.toolbarBtn} 
            onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
            title="Text Color"
          >
            <span className={styles.colorIndicator} style={{ backgroundColor: '#dc2626' }}></span>
            <i className="fas fa-font"></i>
          </button>
          {isColorMenuOpen && (
            <div className={styles.dropdownGrid}>
              {TEXT_COLORS.map(c => (
                <button 
                  key={c.value} 
                  type="button" 
                  className={styles.colorPaletteBtn} 
                  style={{ backgroundColor: c.value }} 
                  title={c.name}
                  onClick={() => {
                    execCmd('foreColor', c.value);
                    setIsColorMenuOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Text */}
        <div className={styles.dropdownContainer}>
          <button 
            type="button" 
            className={styles.toolbarBtn} 
            onClick={() => setIsHighlightMenuOpen(!isHighlightMenuOpen)}
            title="Text Highlight"
          >
            <i className="fas fa-highlighter"></i>
          </button>
          {isHighlightMenuOpen && (
            <div className={styles.dropdownGrid}>
              {HIGHLIGHT_COLORS.map(c => (
                <button 
                  key={c.value} 
                  type="button" 
                  className={styles.colorPaletteBtn} 
                  style={{ backgroundColor: c.value, border: c.value === 'transparent' ? '1px dashed #ccc' : 'none' }} 
                  title={c.name}
                  onClick={() => {
                    execCmd('backColor', c.value);
                    setIsHighlightMenuOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.divider}></div>

        {/* Alignments */}
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('justifyLeft')} title="Align Left"><i className="fas fa-align-left"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('justifyCenter')} title="Align Center"><i className="fas fa-align-center"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('justifyRight')} title="Align Right"><i className="fas fa-align-right"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('justifyFull')} title="Justify"><i className="fas fa-align-justify"></i></button>

        <div className={styles.divider}></div>

        {/* Lists */}
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('insertUnorderedList')} title="Bullet List"><i className="fas fa-list-ul"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={() => execCmd('insertOrderedList')} title="Numbered List"><i className="fas fa-list-ol"></i></button>

        <div className={styles.divider}></div>

        {/* Embeds */}
        <button type="button" className={styles.toolbarBtn} onClick={handleLink} title="Embed URL Link"><i className="fas fa-link"></i></button>
        <button type="button" className={styles.toolbarBtn} onClick={handleQuote} title="Block Quote"><i className="fas fa-quote-left"></i></button>

        {/* Image Attachment inside Content */}
        <button 
          type="button" 
          className={`${styles.toolbarBtn} ${uploadingImage ? styles.toolbarBtnLoading : ''}`} 
          onClick={() => fileInputRef.current?.click()} 
          title="Add Inline Image"
          disabled={uploadingImage}
        >
          {uploadingImage ? <span className={styles.btnSpinner}></span> : <i className="fas fa-image" style={{ color: '#ea580c' }}></i>}
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleBrowseUpload} 
        />
      </div>

      {/* Editor Content Area */}
      <div 
        className={`${styles.workspace} ${isDragging ? styles.workspaceDragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={editorRef}
          className={styles.editorWorkspace}
          contentEditable
          onInput={handleInput}
          onClick={handleEditorClick}
          style={{ minHeight: '300px' }}
        />

        {/* Placeholder if empty */}
        {(!value || value === '<p><br></p>' || value === '') && (
          <div className={styles.placeholder}>
            {placeholder || 'Compose your full news story here... You can also drag and drop images directly into this area.'}
          </div>
        )}

        {/* Drag and Drop Uploader overlay */}
        {isDragging && (
          <div className={styles.dragOverlay}>
            <div className={styles.dragBox}>
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', color: '#ea580c', marginBottom: '12px' }}></i>
              <p>Drop image files directly here to embed in the article</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Editor Instructions */}
      <div className={styles.editorFooter}>
        <span>💡 TIP: Drag & drop images directly inside, then click them to adjust size and alignment.</span>
      </div>
    </div>
  );
}
