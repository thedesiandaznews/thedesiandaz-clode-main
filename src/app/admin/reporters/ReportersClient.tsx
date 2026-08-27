'use client';

import React, { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { updateReporterStatus, deleteReporter, approveReporterWithLetterAction, getReporterById, updateReporterRoleAction } from '@/actions/reporter';
import { getReporterMessages, sendReporterMessage, markReporterMessagesAsRead, getReportersListWithUnreadCounts } from '@/actions/chat';
import {
  verifySuperAdminCredentials,
  getCorrespondentsPasswordsList,
  logPasswordViewAction,
  resetCorrespondentPasswordAction,
  getAuditLogsAction
} from '@/actions/reporter-passwords';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportersClient({ initialList }: { initialList: any[] }) {
  const [reporters, setReporters] = useState<any[]>(initialList);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Chat' | 'Passwords'>('Pending');
  const [selectedReporter, setSelectedReporter] = useState<any | null>(null);
  const [sectionTab, setSectionTab] = useState<'Correspondents' | 'Admins'>('Correspondents');

  // State & District Filters
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // Dynamically extract unique states and districts from the loaded reporters list
  const availableStates = Array.from(
    new Set(reporters.map(r => r.state?.trim()).filter(Boolean))
  ).sort() as string[];

  const availableDistricts = selectedState
    ? (Array.from(
        new Set(
          reporters
            .filter(r => r.state?.trim().toLowerCase() === selectedState.trim().toLowerCase())
            .map(r => r.district?.trim())
            .filter(Boolean)
        )
      ).sort() as string[])
    : [];

  // Rejection Dialogue States
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Approval Dialogue States
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [joiningLetterFile, setJoiningLetterFile] = useState<File | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [useAutoGenerate, setUseAutoGenerate] = useState(true);
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [probationStartDate, setProbationStartDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });

  // Letter Preview States
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfBlob, setPreviewPdfBlob] = useState<Blob | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // ID Card States
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const downloadCardImage = async () => {
    const cardElement = document.getElementById('desiandaz-id-card-element');
    if (!cardElement) return;
    
    setIsGeneratingCard(true);
    try {
      const canvas = await html2canvas(cardElement, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = `TDA_ID_Card_${selectedReporter?.reporterCode || 'correspondent'}.png`;
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
      pdf.save(`TDA_ID_Card_${selectedReporter?.reporterCode || 'correspondent'}.pdf`);
    } catch (err) {
      console.error('Error generating card PDF:', err);
      alert('Failed to generate card PDF. Please try again.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Password Management States
  const [isPasswordsAuthorized, setIsPasswordsAuthorized] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [passwordsVerifyError, setPasswordsVerifyError] = useState('');
  
  const [passwordsList, setPasswordsList] = useState<any[]>([]);
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(false);
  const [passwordsSearchQuery, setPasswordsSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Per-user password states
  const [showPasswordStates, setShowPasswordStates] = useState<Record<string, boolean>>({});
  const [customPasswordResetInputs, setCustomPasswordResetInputs] = useState<Record<string, string>>({});
  const [activeResetUserId, setActiveResetUserId] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  useEffect(() => {
    const fontId = 'google-fonts-preload';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Montserrat:wght@400;500;600;700;800&family=Mukta:wght@300;400;500;600;700;800&family=Alex+Brush&family=Mrs+Saint+Delafield&family=Playfair+Display:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const tabFilteredList = activeTab === 'Chat'
    ? [...reporters].sort((a, b) => {
        if ((a.unreadCount || 0) !== (b.unreadCount || 0)) {
          return (b.unreadCount || 0) - (a.unreadCount || 0);
        }
        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime) return -1;
        if (b.lastMessageTime) return 1;
        return a.fullName.localeCompare(b.fullName);
      })
    : reporters.filter(r => r.status === activeTab);

  const filteredList = tabFilteredList.filter(r => {
    // Filter by Section (Correspondents vs Admin/Super Admin)
    const isReservedAdmin = ['COMPANY_ADMIN', 'PRINT_ADMIN', 'SUPER_ADMIN'].includes(r.role);
    if (sectionTab === 'Correspondents' && isReservedAdmin) return false;
    if (sectionTab === 'Admins' && !isReservedAdmin) return false;

    if (selectedState && r.state?.trim().toLowerCase() !== selectedState.trim().toLowerCase()) {
      return false;
    }
    if (selectedDistrict && r.district?.trim().toLowerCase() !== selectedDistrict.trim().toLowerCase()) {
      return false;
    }
    return true;
  });

  const getFilteredReportersCount = (status: string) => {
    return reporters.filter(r => {
      if (r.status !== status) return false;
      const isReservedAdmin = ['COMPANY_ADMIN', 'PRINT_ADMIN', 'SUPER_ADMIN'].includes(r.role);
      if (sectionTab === 'Correspondents' && isReservedAdmin) return false;
      if (sectionTab === 'Admins' && !isReservedAdmin) return false;

      if (selectedState && r.state?.trim().toLowerCase() !== selectedState.trim().toLowerCase()) return false;
      if (selectedDistrict && r.district?.trim().toLowerCase() !== selectedDistrict.trim().toLowerCase()) return false;
      return true;
    }).length;
  };

  const getFilteredUnreadChatCount = () => {
    return reporters.filter(r => {
      const isReservedAdmin = ['COMPANY_ADMIN', 'PRINT_ADMIN', 'SUPER_ADMIN'].includes(r.role);
      if (sectionTab === 'Correspondents' && isReservedAdmin) return false;
      if (sectionTab === 'Admins' && !isReservedAdmin) return false;

      if (selectedState && r.state?.trim().toLowerCase() !== selectedState.trim().toLowerCase()) return false;
      if (selectedDistrict && r.district?.trim().toLowerCase() !== selectedDistrict.trim().toLowerCase()) return false;
      return true;
    }).reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  };

  const handleOpenReview = async (rep: any) => {
    setSelectedReporter(rep);
    setShowRejectForm(false);
    setShowApproveForm(false);
    setRejectReason('');
    setJoiningLetterFile(null);
    setFatherHusbandName(rep.fatherHusbandName || '');
    setUseAutoGenerate(true);

    // Reset preview states
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPreviewPdfBlob(null);
    setIsPreviewLoading(false);

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    setProbationStartDate(`${dd}-${mm}-${yyyy}`);
    if (activeTab === 'Chat') {
      setIsAdminChatOpen(true);
    }

    // Load full details asynchronously (Aadhaar, PAN, voter id, joining letter etc.)
    try {
      const fullReporter = await getReporterById(rep.id);
      if (fullReporter) {
        setSelectedReporter(fullReporter);
        setFatherHusbandName(fullReporter.fatherHusbandName || '');
        // Cache in local reporters list
        setReporters(prev => prev.map(r => r.id === rep.id ? { ...r, ...fullReporter } : r));
      }
    } catch (err) {
      console.error('Error fetching full reporter details:', err);
    }
  };

  const handleCloseReview = () => {
    setSelectedReporter(null);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewPdfBlob(null);
  };

  const handleRejectKYC = async () => {
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    setIsRejecting(true);

    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Rejected', undefined, rejectReason.trim());
      if (res.success) {
        alert('Correspondent KYC marked as Rejected.');
        
        // Update local list state
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Rejected', rejectionReason: rejectReason } : r));
        handleCloseReview();
      } else {
        alert('Failed to reject: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  const generateAppointmentLetterBlob = async (reporter: any, parentName: string, probationDate: string): Promise<Blob | null> => {
    let designationHi = 'संवाददाता (Official Correspondent)';
    let designationEn = 'Official Block Correspondent';
    let assignedArea = `${reporter.block} प्रखंड (Block)`;

    if (reporter.role === 'DISTRICT_CORRESPONDENT') {
      designationHi = 'जिला संवाददाता (District Correspondent)';
      designationEn = 'District Correspondent';
      assignedArea = `${reporter.district} जिला (District)`;
    } else if (reporter.role === 'STATE_CORRESPONDENT') {
      designationHi = 'राज्य संवाददाता (State Correspondent)';
      designationEn = 'State Correspondent';
      assignedArea = `${reporter.state} राज्य (State)`;
    } else if (reporter.role === 'DISTRICT_AD_INCHARGE') {
      designationHi = 'जिला विज्ञापन प्रभारी (District Advertisement In-charge)';
      designationEn = 'District Advertisement In-charge';
      assignedArea = `${reporter.district} जिला (District)`;
    } else if (reporter.role === 'SANTHAL_PARGANA_AD_INCHARGE') {
      designationHi = 'संताल परगना विज्ञापन प्रभारी (Santhal Pargana Advertisement In-charge)';
      designationEn = 'Santhal Pargana Advertisement In-charge';
      assignedArea = 'संताल परगना प्रमंडल (Santhal Pargana Division)';
    } else if (reporter.role === 'STATE_AD_INCHARGE') {
      designationHi = 'राज्य विज्ञापन प्रभारी (State Advertisement In-charge)';
      designationEn = 'State Advertisement In-charge';
      assignedArea = `${reporter.state} राज्य (State)`;
    } else if (reporter.role === 'COMPANY_ADMIN') {
      designationHi = 'कंपनी एडमिन (Company Admin)';
      designationEn = 'Company Admin';
      assignedArea = 'Entire Network';
    } else if (reporter.role === 'PRINT_ADMIN') {
      designationHi = 'प्रिंट एडमिन (Print Admin)';
      designationEn = 'Print Admin';
      assignedArea = 'Print Publication Division';
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '794px';
    
    const stylesHtml = `<style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --crimson: #C41E3A;
            --dark-red: #8B1428;
            --gold: #C9A84C;
            --gold-light: #E8D9A0;
            --cream: #FBF8F2;
            --warm-gray: #6B6460;
            --dark: #1E1B18;
            --border: #DDD5C9;
        }

        body {
            font-family: 'Source Sans 3', 'Noto Sans Devanagari', sans-serif;
            background: #E8E4DE;
            color: #1E1B18;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
        }

        @page { size: A4; margin: 0; }

        .page {
            width: 794px;
            height: 1123px;
            background: white;
            margin: 8mm auto;
            position: relative;
            overflow: hidden;
        }

        @media print {
            body { background: white; }
            .page { margin: 0; box-shadow: none; page-break-after: always; }
        }

        .corner-tl, .corner-tr, .corner-bl, .corner-br {
            position: absolute; width: 22mm; height: 22mm; z-index: 5;
        }
        .corner-tl { top: 7mm; left: 7mm; border-top: 2px solid #C9A84C; border-left: 2px solid #C9A84C; }
        .corner-tr { top: 7mm; right: 7mm; border-top: 2px solid #C9A84C; border-right: 2px solid #C9A84C; }
        .corner-bl { bottom: 7mm; left: 7mm; border-bottom: 2px solid #C9A84C; border-left: 2px solid #C9A84C; }
        .corner-br { bottom: 7mm; right: 7mm; border-bottom: 2px solid #C9A84C; border-right: 2px solid #C9A84C; }

        .top-strip { height: 4mm; background: linear-gradient(90deg, #C41E3A, #8B1428); }

        .page-inner {
            padding: 10mm 14mm 8mm 14mm;
            height: calc(1123px - 15px);
            display: flex;
            flex-direction: column;
        }

        /* ── Header ── */
        .header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 4mm; padding-bottom: 4mm; border-bottom: 0.5px solid #DDD5C9;
        }

        .logo-area { display: flex; align-items: center; gap: 4mm; }
        .logo-area img { height: 16mm; object-fit: contain; }

        .company-text h1 {
            font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 800;
            color: #C41E3A; letter-spacing: 0.5px; line-height: 1.1;
        }
        .company-text .subtitle { font-size: 12px; font-weight: 700; color: #8B1428; letter-spacing: 3px; text-transform: uppercase; }

        .header-right { text-align: right; font-size: 12px; color: #6B6460; line-height: 1.7; }

        .rni-badge {
            display: inline-block; background: #8B1428; color: white;
            font-size: 10px; font-weight: 700; padding: 1mm 3mm; letter-spacing: 0.5px; margin-bottom: 1mm;
        }

        .cert-line { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; color: #8B1428; }

        /* ── Address ── */
        .address-bar {
            display: flex; justify-content: space-between; padding: 3mm 0; margin-bottom: 4mm;
            border-bottom: 0.5px solid #DDD5C9; font-size: 10px; color: #6B6460; line-height: 1.5;
        }

        /* ── Title ── */
        .title-band {
            text-align: center; padding: 5mm 0; margin-bottom: 5mm;
            background: linear-gradient(135deg, #FBF8F2 0%, #f5f0e6 100%);
            border: 1px solid #E8D9A0;
        }
        .title-band h2 { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 20px; font-weight: 700; color: #8B1428; }
        .title-band .eng { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #1E1B18; letter-spacing: 3px; text-transform: uppercase; margin-top: 1mm; }

        /* ── Dossier ── */
        .section-head {
            font-size: 12px; font-weight: 700; color: white; background: #8B1428;
            padding: 2.5mm 4mm; margin-bottom: 0; letter-spacing: 0.5px;
        }

        .dossier-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; border: 1px solid #DDD5C9; }
        .dossier-table td { padding: 3mm 4mm; font-size: 12px; border: 0.5px solid #DDD5C9; vertical-align: middle; }
        .dossier-table .label { background: #FBF8F2; color: #6B6460; font-weight: 600; width: 18%; }
        .dossier-table .value { font-weight: 500; color: #1E1B18; }

        /* ── Sections ── */
        .section { margin-bottom: 5mm; }

        .sec-title {
            font-size: 14px; font-weight: 700; color: #8B1428;
            padding-bottom: 2mm; margin-bottom: 3mm; border-bottom: 1.5px solid #C9A84C;
            display: flex; align-items: center; gap: 2mm;
        }
        .sec-title::before {
            content: ''; display: inline-block; width: 3mm; height: 6mm;
            background: #C41E3A; flex-shrink: 0;
        }

        .body-text { font-size: 12px; line-height: 1.75; color: #333; text-align: justify; }
        .body-text strong { color: #1E1B18; }

        /* ── Lists ── */
        .bullet-list { list-style: none; padding: 0; margin: 0; }
        .bullet-list li {
            font-size: 12px; line-height: 1.7; color: #333;
            padding: 1.5mm 0 1.5mm 6mm; position: relative;
        }
        .bullet-list li::before { content: '◆'; position: absolute; left: 0; color: #C41E3A; font-size: 7px; top: 3mm; }

        .num-list { list-style: none; padding: 0; margin: 0; counter-reset: item; }
        .num-list li {
            font-size: 12px; line-height: 1.7; color: #333;
            padding: 1.5mm 0 1.5mm 8mm; position: relative; counter-increment: item;
        }
        .num-list li::before { content: counter(item) "."; position: absolute; left: 0; color: #C41E3A; font-weight: 700; font-size: 12px; }

        /* ── Jurisdiction ── */
        .juris-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #DDD5C9; margin-bottom: 4mm; }
        .juris-cell { text-align: center; padding: 4mm 3mm; border-right: 0.5px solid #DDD5C9; }
        .juris-cell:last-child { border-right: none; }
        .juris-cell .jvalue { font-size: 13px; font-weight: 700; color: #8B1428; }

        .juris-head {
            display: grid; grid-template-columns: 1fr 1fr 1fr;
            background: #8B1428; color: white; font-size: 12px; font-weight: 700; text-align: center;
        }
        .juris-head div { padding: 2.5mm 3mm; border-right: 0.5px solid rgba(255,255,255,0.2); }
        .juris-head div:last-child { border-right: none; }

        /* ── Signature ── */
        .sig-section { display: flex; justify-content: flex-end; margin-top: 8mm; padding-top: 5mm; }

        .sig-digital {
            border: 1px solid #4CAF50; padding: 3mm 5mm; font-size: 10px; color: #2E7D32;
            margin-bottom: 2mm; background: #f1f8e9; line-height: 1.6;
        }
        .sig-digital .sig-check { font-weight: 700; color: #2E7D32; font-size: 11px; }
        .sig-name { font-size: 14px; font-weight: 700; color: #1E1B18; margin-top: 2mm; }
        .sig-name-hi { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 14px; font-weight: 700; color: #1E1B18; }
        .sig-desig { font-size: 12px; color: #6B6460; font-weight: 600; }
        .sig-org { font-size: 11px; color: #6B6460; }
        .verified-text { font-size: 11px; color: #2E7D32; font-style: italic; margin-top: 2mm; }

        /* ── Acceptance ── */
        .acceptance-box {
            border: 1.5px solid #C9A84C; padding: 5mm 6mm; margin-top: 6mm; background: #FBF8F2;
        }
        .acceptance-box .acc-title {
            font-size: 14px; font-weight: 700; color: #8B1428;
            margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 1px solid #E8D9A0;
        }
        .acceptance-box .acc-text { font-size: 12px; line-height: 1.75; color: #333; margin-bottom: 5mm; }

        .acc-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm 12mm; }
        .acc-field { display: flex; flex-direction: column; }
        .acc-field .af-label { font-size: 12px; color: #6B6460; font-weight: 600; margin-bottom: 2mm; }
        .acc-field .af-line { border-bottom: 1px dashed #6B6460; height: 7mm; }

        /* ── Watermark ── */
        .watermark {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-family: 'Playfair Display', serif; font-size: 60pt; font-weight: 800;
            color: rgba(196, 30, 58, 0.04); letter-spacing: 8px;
            white-space: nowrap; pointer-events: none; z-index: 0;
        }

        .page-footer {
            margin-top: auto; text-align: center; padding-top: 3mm;
            border-top: 0.5px solid #DDD5C9; font-size: 10px; color: #aaa;
        }

        /* ── Mini Header (page 2+) ── */
        .mini-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 5mm; padding-bottom: 4mm; border-bottom: 0.5px solid #DDD5C9;
        }
        .mini-header-left { display: flex; align-items: center; gap: 3mm; }
        .mini-header-left img { height: 10mm; }
        .mini-header-left .mh-name { font-size: 12px; font-weight: 700; color: #8B1428; letter-spacing: 1px; }
        .mini-header-left .mh-sub { font-size: 10px; color: #6B6460; margin-left: 2mm; }
        .mini-header-right { font-size: 10px; color: #6B6460; font-weight: 600; }
    </style>`;
    const page1Html = `<!-- ═══════════════════ PAGE 1 ═══════════════════ -->
<div id="appointment-page-1" class="page">
    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
    <div class="watermark">TDA</div>
    <div class="top-strip"></div>
    <div class="page-inner">

        <div class="header">
            <div class="logo-area">
                <img src="data:image/png;base64,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" alt="The Desi Andaz News Logo">
                <div class="company-text">
                    <h1>THE DESI ANDAZ</h1>
                    <div class="subtitle">Media Network</div>
                </div>
            </div>
            <div class="header-right">
                <div class="rni-badge">RNI NO: JHBIL/26/A3245</div><br>
                <span class="cert-line">PRINT · DIGITAL · ELECTRONIC</span><br>
                <span style="font-size:12px; font-weight:600; color:#6B6460;">Date: ${probationDate}</span>
            </div>
        </div>

        <div class="address-bar">
            <div><strong>HEAD OFFICE ADDRESS:</strong><br>Near Everett Mission School, D.S.M Hospital, Dhanushpuja, Pakur, Jharkhand – 816107</div>
            <div style="text-align:right;"><strong>CONTACT INFORMATION:</strong><br>Mob: +91-8409659560, +91-6203868383<br>Email: info@thedesiandaz.com | Web: www.thedesiandaz.com</div>
        </div>

        <div class="title-band">
            <h2>नियुक्ति पत्र</h2>
            <div class="eng">Appointment Letter</div>
        </div>

        <div class="section-head">RECIPIENT DOSSIER DETAILS · प्राप्तकर्ता प्रोफ़ाइल विवरण</div>
        <table class="dossier-table">
            <tr>
                <td class="label">श्री/श्रीमती:</td>
                <td class="value">${reporter.fullName}</td>
                <td class="label">संवाददाता पहचान पत्र:</td>
                <td class="value" style="color:#8B1428; font-weight:700;">${reporter.reporterCode || 'NO ID ASSIGNED'}</td>
            </tr>
            <tr>
                <td class="label">पिता/पति:</td>
                <td class="value">${parentName}</td>
                <td class="label">पद (Designation):</td>
                <td class="value" style="font-weight: 700;">${designationHi}</td>
            </tr>
            <tr>
                <td class="label">ग्राम/पता:</td>
                <td class="value" colspan="3">${reporter.fullAddress || ''}</td>
            </tr>
            <tr>
                <td class="label">जिला:</td>
                <td class="value">${reporter.district}</td>
                <td class="label">राज्य:</td>
                <td class="value">${reporter.state}</td>
            </tr>
        </table>

        <div class="section">
            <div class="sec-title">विषय: The Desi Andaz Media Network में ${designationHi} के पद पर नियुक्ति।</div>
        </div>

        <div class="section">
            <p class="body-text"><strong>महोदय/महोदया,</strong></p>
            <p class="body-text" style="margin-top:2mm;">
                हमें यह बताते हुए प्रसन्नता हो रही है कि आपके द्वारा प्रस्तुत आवेदन, पहचान दस्तावेजों, शैक्षणिक प्रमाण-पत्रों एवं अन्य आवश्यक अभिलेखों के सत्यापन उपरांत आपको The Desi Andaz Media Network में <strong>${designationHi}</strong> के पद पर नियुक्त किया जाता है।
            </p>
            <p class="body-text" style="margin-top:2mm;">
                आपको <strong>${assignedArea}</strong> क्षेत्र के लिए संस्था के अधिकृत प्रतिनिधि एवं ${designationHi} के रूप में नियुक्त किया जाता है। आप अपने क्षेत्र से समाचार संकलन, जनहित से जुड़े विषयों की रिपोर्टिंग, सामाजिक एवं प्रशासनिक गतिविधियों का कवरेज तथा स्थानीय समस्याओं एवं विकास कार्यों की जानकारी संगठन तक पहुँचाने का कार्य करेंगे।
            </p>
        </div>

        <div class="section">
            <div class="sec-title">प्रोबेशन अवधि (Probation Period)</div>
            <ul class="bullet-list">
                <li>आपकी नियुक्ति प्रारंभिक रूप से 03 (तीन) माह की प्रोबेशन अवधि के लिए की जाती है, जो दिनांक <strong>${probationDate}</strong> से प्रभावी होगी।</li>
                <li>प्रोबेशन अवधि के दौरान आपके कार्य प्रदर्शन, समाचार संकलन क्षमता, अनुशासन, व्यवहार एवं संगठन के प्रति समर्पण का मूल्यांकन किया जाएगा।</li>
                <li>संतोषजनक प्रदर्शन के आधार पर आपको नियमित रूप से कार्य करने की अनुमति प्रदान की जा सकती है।</li>
                <li>प्रोबेशन अवधि के दौरान संस्था को बिना किसी पूर्व सूचना के नियुक्ति रद्द करने का अधिकार होगा यदि कार्य प्रदर्शन संतोषजनक नहीं पाया जाता।</li>
            </ul>
        </div>

        <div class="page-footer">PAGE 1 OF 4</div>
    </div>
</div>`;
    const page2Html = `<!-- ═══════════════════ PAGE 2 ═══════════════════ -->
<div id="appointment-page-2" class="page">
    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
    <div class="watermark">TDA</div>
    <div class="top-strip"></div>
    <div class="page-inner">

        <div class="mini-header">
            <div class="mini-header-left">
                <img src="data:image/png;base64,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" alt="Logo">
                <span class="mh-name">THE DESI ANDAZ MEDIA NETWORK</span>
                <span class="mh-sub">| OFFICIAL APPOINTMENT LETTER</span>
            </div>
            <div class="mini-header-right">RNI: JHBIL/26/A3245</div>
        </div>

        <div class="section">
            <div class="sec-title">कर्तव्य एवं जिम्मेदारियाँ</div>
            <ol class="num-list">
                <li>अपने कार्यक्षेत्र से सत्य, निष्पक्ष एवं तथ्यात्मक समाचार संकलित करना।</li>
                <li>किसी भी समाचार को प्रकाशित अथवा प्रेषित करने से पूर्व उसकी सत्यता सुनिश्चित करना।</li>
                <li>स्थानीय प्रशासन, शिक्षा, स्वास्थ्य, खेल, सामाजिक एवं जनहित से जुड़े समाचारों को प्राथमिकता देना।</li>
                <li>संस्था द्वारा जारी पत्रकारिता नीति एवं आचार संहिता का पालन करना।</li>
                <li>संस्था की प्रतिष्ठा एवं विश्वसनीयता बनाए रखना।</li>
                <li>समय-समय पर संस्था द्वारा दिए गए निर्देशों का पालन करना।</li>
                <li>संस्था के सोशल मीडिया एवं डिजिटल प्लेटफॉर्म पर समाचार अपडेट करना।</li>
                <li>क्षेत्र में हो रहे विकास कार्यों एवं सरकारी योजनाओं की रिपोर्टिंग करना।</li>
                <li>समाचार संकलन के दौरान निष्पक्षता एवं संतुलित दृष्टिकोण बनाए रखना।</li>
                <li>संस्था द्वारा आयोजित बैठकों एवं कार्यक्रमों में सक्रिय भागीदारी करना।</li>
            </ol>
        </div>

        <div class="section">
            <div class="sec-title">नियम एवं शर्तें (Terms & Conditions)</div>
            <ol class="num-list">
                <li>संवाददाता पहचान पत्र (Correspondent ID) केवल आधिकारिक कार्य हेतु मान्य होगी।</li>
                <li>संस्था के नाम, लोगो अथवा पहचान पत्र का दुरुपयोग पूर्णतः प्रतिबंधित रहेगा।</li>
                <li>संस्था के नाम पर किसी भी प्रकार का आर्थिक लेन-देन बिना लिखित अनुमति के नहीं किया जाएगा।</li>
                <li>फर्जी, भ्रामक अथवा अपुष्ट समाचार प्रकाशित या प्रसारित करना गंभीर अनुशासनहीनता माना जाएगा।</li>
                <li>संस्था के नियमों के उल्लंघन अथवा संस्था की छवि को नुकसान पहुँचाने की स्थिति में नियुक्ति तत्काल प्रभाव से समाप्त की जा सकती है।</li>
                <li>संस्था आवश्यकता अनुसार कार्यक्षेत्र अथवा दायित्वों में परिवर्तन करने का अधिकार सुरक्षित रखती है।</li>
                <li>नियुक्ति पत्र का उपयोग केवल संस्था से संबंधित कार्यों के लिए ही किया जा सकता है, व्यक्तिगत लाभ हेतु नहीं।</li>
                <li>संस्था की गोपनीय सूचनाओं, रणनीतियों एवं आंतरिक मामलों को किसी तीसरे पक्ष के साथ साझा करना वर्जित है।</li>
                <li>संवाददाता को किसी भी राजनीतिक दल अथवा संगठन का प्रचार संस्था के नाम पर करने की अनुमति नहीं होगी।</li>
                <li>संस्था द्वारा निर्धारित समय-सीमा के भीतर समाचार एवं रिपोर्ट प्रस्तुत करना अनिवार्य होगा।</li>
            </ol>
        </div>

        <div class="page-footer">PAGE 2 OF 4</div>
    </div>
</div>`;
    const page3Html = `<!-- ═══════════════════ PAGE 3 ═══════════════════ -->
<div id="appointment-page-3" class="page">
    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
    <div class="watermark">TDA</div>
    <div class="top-strip"></div>
    <div class="page-inner">

        <div class="mini-header">
            <div class="mini-header-left">
                <img src="data:image/png;base64,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" alt="Logo">
                <span class="mh-name">THE DESI ANDAZ MEDIA NETWORK</span>
                <span class="mh-sub">| OFFICIAL APPOINTMENT LETTER</span>
            </div>
            <div class="mini-header-right">RNI: JHBIL/26/A3245</div>
        </div>

        <div class="section">
            <div class="sec-title">अधिकृत कार्य क्षेत्र (Authorized Jurisdiction)</div>
            <div class="juris-head">
                <div>BLOCK (प्रखंड)</div>
                <div>DISTRICT (जिला)</div>
                <div>STATE (राज्य)</div>
            </div>
            <div class="juris-grid">
                <div class="juris-cell">
                    <div class="jvalue">Block, ${reporter.block || 'N/A'}, ${reporter.district}, ${reporter.state}</div>
                </div>
                <div class="juris-cell">
                    <div class="jvalue">${reporter.district}</div>
                </div>
                <div class="juris-cell">
                    <div class="jvalue">${reporter.state}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="sec-title">सुविधाएँ एवं अधिकार (Facilities & Rights)</div>
            <ul class="bullet-list">
                <li>संस्था द्वारा आधिकारिक संवाददाता परिचय पत्र (Correspondent Card) प्रदान किया जाएगा जो आपकी पहचान एवं प्रमाणिकता का प्रतीक होगा।</li>
                <li>संस्था के डिजिटल प्लेटफॉर्म, वेबसाइट एवं सोशल मीडिया पेज पर आपकी प्रोफाइल प्रकाशित की जाएगी।</li>
                <li>समय-समय पर संस्था द्वारा आयोजित प्रशिक्षण कार्यक्रमों एवं कार्यशालाओं में भाग लेने का अवसर दिया जाएगा।</li>
                <li>क्षेत्रीय एवं राष्ट्रीय स्तर के पत्रकारिता कार्यक्रमों में संस्था के प्रतिनिधि के रूप में भाग लेने का अवसर प्राप्त होगा।</li>
                <li>उत्कृष्ट कार्य प्रदर्शन पर संस्था द्वारा प्रोत्साहन एवं पुरस्कार दिया जा सकता है।</li>
                <li>संस्था के आधिकारिक कार्यक्रमों, प्रेस कॉन्फ्रेंस एवं सरकारी कार्यक्रमों में भाग लेने का अधिकार होगा।</li>
            </ul>
        </div>

        <div class="section">
            <div class="sec-title">रिपोर्टिंग संरचना (Reporting Structure)</div>
            <ul class="bullet-list">
                <li>आप सीधे संस्था के ब्यूरो चीफ / क्षेत्रीय प्रमुख को रिपोर्ट करेंगे।</li>
                <li>समाचार एवं रिपोर्ट संस्था के संपादकीय विभाग को प्रेषित की जाएगी।</li>
                <li>किसी भी विवादास्पद अथवा संवेदनशील समाचार को प्रकाशित करने से पूर्व संपादकीय विभाग की अनुमति अनिवार्य होगी।</li>
                <li>मासिक कार्य प्रगति रिपोर्ट संस्था के प्रबंधन को प्रस्तुत करनी होगी।</li>
                <li>आपातकालीन स्थिति में सीधे संस्था के प्रबंध निदेशक से संपर्क किया जा सकता है।</li>
            </ul>
        </div>

        <div class="section">
            <div class="sec-title">व्यावसायिक आचरण (Professional Conduct)</div>
            <ol class="num-list">
                <li>रिपोर्टर को सदैव शालीन, विनम्र एवं पेशेवर व्यवहार बनाए रखना होगा।</li>
                <li>समाचार संकलन के दौरान किसी भी व्यक्ति, समुदाय अथवा संगठन के प्रति पक्षपातपूर्ण व्यवहार नहीं किया जाएगा।</li>
                <li>संस्था के नाम पर किसी भी प्रकार की धमकी, दबाव अथवा अनुचित व्यवहार करना पूर्णतः प्रतिबंधित है।</li>
                <li>रिपोर्टर को पत्रकारिता के उच्चतम मानदंडों एवं नैतिक सिद्धांतों का पालन करना अनिवार्य होगा।</li>
                <li>किसी भी प्रकार के भ्रष्टाचार, रिश्वतखोरी अथवा अनैतिक गतिविधि में संलिप्त पाए जाने पर कड़ी कार्रवाई की जाएगी।</li>
                <li>संस्था के सभी सहकर्मियों के साथ सम्मानजनक एवं सहयोगात्मक व्यवहार अनिवार्य है।</li>
            </ol>
        </div>

        <div class="page-footer">PAGE 3 OF 4</div>
    </div>
</div>`;
    const page4Html = `<!-- ═══════════════════ PAGE 4 ═══════════════════ -->
<div id="appointment-page-4" class="page">
    <div class="corner-tl"></div><div class="corner-tr"></div><div class="corner-bl"></div><div class="corner-br"></div>
    <div class="watermark">TDA</div>
    <div class="top-strip"></div>
    <div class="page-inner">

        <div class="mini-header">
            <div class="mini-header-left">
                <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABpAMEDASIAAhEBAxEB/8QAHQABAAIDAQEBAQAAAAAAAAAAAAcIBAUGAwkBAv/EAEcQAAEDAwICBAkICQIGAwAAAAECAwQABREGBxIhCBMxQRQVFyJRVoGRlCUyVGFxoaLRFhgjQlJigpKVsdIkM3KTwdNDg6X/xAAbAQEAAgMBAQAAAAAAAAAAAAAABQYDBAcCAf/EADURAAEDAgIHBQcFAQEAAAAAAAEAAgMEEQUhBhITMUFTkRQVUXGhIjJCYYGxwaLR4fDxI3L/2gAMAwEAAhEDEQA/ALl0pSiJSlKIlK5fX2vNOaHaiOX+S614WpQZS20VqVw4ycDuGR765Py/bc/TZ/waq15KuCN2q94B81IQYVW1DBJFE5zTxANlKlKivy/bc/TZ/wAGqnl+25+mz/g1V47fTcwdVl7ixLkO6FSpSor8v23P02f8Gqnl+25+mz/g1U7fTcwdU7ixLkO6FSpSor8v23P02f8ABqp5ftufps/4NVO303MHVO4sS5DuhUqUqK/L9tz9Nn/Bqp5ftufps/4NVO303MHVO4sS5DuhUqUqK/L9tz9Nn/Bqp5ftufps/wCDVTt9NzB1TuLEuQ7oVKlKivy/bc/TZ/waqeX7bn6bP+DVTt9NzB1TuLEuQ7oVKlKivy/bc/TZ/wAGqnl+25+mz/g1U7fTcwdU7ixLkO6FSpSor8v23P02f8Gqnl+25+mz/g1U7fTcwdU7ixLkO6FSpSsWzz2LraolzihwMSmUvNdYnhVwqGRkd3I1lVtAgi4UW5paSDvCUpSvq+JSlKIlKVhX+5x7NY512lnDEOOt9z7EpJ9/KvhIAuV6a0vcGt3lVO6U2ofHG5jluad4o9pZTHAHZ1h85Z+3JCf6ai6BDlz5SIkGK/KkLzwNMtla1YGTgDmeQJr+7vPk3W6y7nMXxyZby3nVelSiSfvNS50RrQmbuJKujiCU26EpSD6HFkJH4eOqIAa2r/8AR9P8XcXFuC4Ve19m3qf5KjNWkdVpSVK0xe0pAySYDoAH9tYdrs14uocNrtU6cG8Bwxo63ODPZnhBx2Gr66te8H0rd5AOC1BeX7kE1GfRNtHgG2S7itsBy4zHHArvKEYQB70q99ST8FaJ2xB28E9FXItMpHUUlS6MAtLQBffe/wCAqsXSx3u1tJeudnuEFtauFK5EZbYUe3AKgMmslnSeqXmkOs6avLja0hSFpgukKB7CDw8xU69Kh5d61vpLR7CzxOrClpHpdcDaT7OFXvqwkZluPGajspCG2kBCEjsAAwBXyHB2STPZrZNsvdXpdLTUkExiGtJc2vuANh1VCP0P1b6rXz4B3/bXgrTuoEz029ViugmKb6xMcxHOsKM44gnGcZ76+gOR6RUP6UmG9dJ3UkpB449qtSYSVehXEgkf3cfur3NgrIy0B59o2WGj0ynqGyuMQAY0u3nxAA+pKrBM0zqSFGXKmafu0ZhsZW67DcQhI+skYFeNrsl6ura3bXaLhOQg8K1Roy3Ak+glIODVuuk5NTD2eujZVhUp1llH1nrEqP3JNenRv0+LDtXb1LbKJFxKpr2f5+SPwBNY+52mp2Idla5KzjS54w3tjoxcu1QL78rkqn91s13tQbN0tU6AHc9X4THW3x47ccQGe0e+sqPpXU8lhuRH05eHmXEhbbjcJxSVJPMEEJwRU69J1l3Ue5ekNIR/nuJyT6OtcCSfYGyasAlMS12sJSEMRIjOAByShtCf9ABSHB2ySyM1sm2zSr0ukp6WCXZgvkubX3AGw6r58z4cy3ylxJ8R+JIRjiaebKFpyMjIPMcq2lo0hqq7sB+16cusxlQyHGYi1IP9WMVOWzOkGNwtY3ncjUjBkQ1zl+Ax3RlKyDyKh3pQnhSB2ZBz2VP7s23RJMaA7Lix338iOwpxKVOYHMJT2nA9FKTBhM3aOdZp3eJX3FNL3Ucggjj1nge1nkDa5A8bcVQS82K9WVaUXi0TrepXzRJjqb4vsyOddQ3YbKqzttlgiUshBVxq64AtdZ1+OLh6vt/d+b+9mrjaysVv1JpqdZ7kwh5h9pQHEOaFY5KHoIPPNUMXcbkiKq3+MJXgwyjqetVwYznGM4xnnWCtom0Lhf2gVu4NjL8bjNhqOYRexyN932OXqsOt7t9Yl6l1rabGkHhlyUpcI7Q2Oaz7EgmtFU7dD/T/AIVqW56jdQergsBhkkci452kH0hKfxVpUUG3nazxPopjGK3sVDJPxAy8zkPVWeaQhttLbaQlCQEpA7ABX9UpXQFwVKUpREpSlESog6V2ofFO3KbS05wyLs+GsDt6pGFLPv4B/VUv1UTpVahN33JNradUqNaWEsBOfN61XnLI96Un/pqMxefY0rrbzl/forJopRdrxJl9zPaP03etlElWm6H1oMXRVzvC2+FU6Z1aD/EhtPL8SlD2VVmrzbLWcWPa3T8EZ4lREyF5HMKd/aEewqx7Kg8Ci1qgu8ArvpvU7LDxEN73DoM/vZZ+5iy3txqVxJwU2mUR/wBpVfu3FoNh0HZLSpIS5HhNpcA/jKcq/ETW0u8KPdrTKtz+FMSW1Muj0pPJQ92RXpc5bVvtkmc8QlqMyt1ZPYEpBJ/0q06g2m0PhZcvExNOIBxdf0sPyq+W0HVvS2kyEDjjWbi4gru6lHV8v/tVmpx15dvEWi7zdwtKFxYTrjZPZxhJ4R7VYFQt0SIj1xueqdWzMrkSXUtdZ6VKJcc+/gqernAg3SC5BuURiZFdx1jLyAtCsEEZB5HmAa0cOa59O6Qb3kn9lOaQPZFXxwOzbE1jT9Mz918+TMlkkmU+SeZ/aGrE9DOOosamnrBUVrjthR7TgOE/6iuj3/0/o7Tm11zmQtMWaNMeKI7DrcNtKkqUoZIIGQeEKr+eiJDDG2sqUU+dJuLhz6QlCEj7wai6OidTVzWON7An8KzYvjTMRwOSVjNUFwbn8iCvbpMRHL5G0npVni6y53hIPCOYQlJClewLz7KlqJHaiRGYrCAhplCW0JHYEgYArkrnbPGm7tqmOpJZstsdeQe4Ovr4B+Ftf3V2QINT0Mf/AFkkPGw+gH73VFrJ70sFOPhBJ83H9gFEFtt/j7pO3W6LQFx9PW5plJPc64nI+5TnurbdJHUXiDa2ehtakybkoQmiPQrJX+AKHtFbrbS3BpWoL2tI6273d90K7y02rqmx9mEEj/qqBul3qHw7WUHT7SyWrZH43Rn/AOVzB+5IT7zWhUv7NRvfxcT6/wAKdw2DvDF4YvhiDf0jPq77qeNlYMe37VacYjfMXBQ8o+lTg41feo1Fe/bMzSu7di3DlwnrjaGEoQG0L4erdQFEJJwcAkhQ9OFVn9FbX0efY06KnuhE6EFKhlR/5zWclI/mTk8vRj0Gpl1FZrdqCyyrPdY6ZEOSjgcQfuI9BB5g9xFZGMbWUbdmbEWt8iFrSyyYRi8hqG3Di4H5tdxB8f8AFBEzpLxHYjzTWlJCHFtqSlRmAhJI5H5lVwJJJJ7TXS7maSlaK1hLsUlRcQ2QuO7jHWtK+ar7e4/WDXNVVqypnmdqznNq6fhGHUNJFtKIWa+x3k38N/mlXT6O2n/0f2rtiXEFMidma9ntyvHD+AJqo+g7G5qXWNqsaAoiXJQhwp7Ut5ytXsSCfZV+GGkMMoZaSEttpCUgdwAwBUtgEF3OlPDJVXTyt1Y46UHf7R+mQ/PRf3SlKtC5mlKUoiUpSiLDvdxj2izTbrLJEeGwt9zHbwpSVHHuqgF6uEi7XiZdJSip+W+t5w/zKUSf9atf0q9QeKdtvFbSyl+7PpZ5HB6tPnrP2ckp/qqotVTHp9aVsQ4fldS0FotnTPqTvcbDyH8/ZbLS1sXedTWy0tglUyW0xy/mUAT99fQFIajxwBwttNpwO4JSBVO+jDaPGm7UJ446u3suy1A9+BwJ/EsH2VZveK7ix7Y6guBJChDWy2R2hbn7NJ9hUDW1gjRFTvmP9sFG6ZvNViENI3+lxt+AvXa25KvGiIV2USfDHZD4z6FPuED3EVpukNdxaNpL0sK4XJTaYjf1lwgKH9vFWbsc31e0mm0+mElXvJP/AJqN+mDcnVW3T2nGMKVMkrfUkduUgIR7y4r3Vv1ExZQa536o9clBUFI2bHBENweT9Gkn8Lr+jNaDatpLc4tvgdnOOS1/WFKwk/2pTXIdJjcfUmldSWy0abuZhExC/IKW0LKuJRCQeIHGOE++ps05bW7Np+3WhklTcKK3HST3hCQnP3VD+6eyN01rrabqBOo40Zt9LaW2Vx1KLaUoCcZ4vSCfbXiqhnZRtig97IZGyzYZWUU2LSVNaRqHWOYuDc5C1jw+ygHVu4WsNV25u33+8rmRW3Q6lstNoAWAQD5qR3E1aro4wjC2esgIwp4Ovn+pxRH3YqrO6uinNBakbsj1zauDioyX1LbbKAniKgE4JPPzc+2rj7Yw1QNutOw1p4VtW1gLHoVwAn781HYOyTtTzL7wFs81P6XS03dsLaUAMc64sLDceGXitz1TEV6VPcWE8aQXFq5BKEDs+wecfaa1O31xdvGkol3dzmcp2QgHubU4otj+zhrnekJqH9HdrLo424ESZyRCY+suclfgCzXUaGieAaLskLGCxb2GyPrDYFTokvPqDgL9T/Co7oC2iEzvidYeTRn9x0WahMSz2bBUGosNjJUTyShIySfYKp9pLTkvePcy9PLn+L+uDs1Timy7wJ4wEoxkdygO3uqwHSX1D4i2tmMNrCZFzWIbYzz4Vc1n+0Ef1CuD6GMZrg1LMIBdzHbB7wnzyf8Ax7qi67VqKuOmO4ZlWfBDJQYVUYi33zYA/UXPU+i0esdnJe29hd1pF1gVSra424wluHwKKysJHPjPp58jyzVhNuNQnVWh7Vf1thpyWxxOIHYFglKsfVkGtDvvpC9a20Y1ZrJIjMuiYh10PrKUqQAoYyAe8g+yuk0HYEaX0da7AlwO+BMBC3AMBSu1R+wkmtqlpez1Dmxtsy3r/ijMSxIV+HxvqH602seABDbbjYDjmq+9MkRv0osJQB4T4EvrPTwcfm/fx1A1d9v9qZrVG5twlxXA5Di4iR1JOQpKM5UD6CoqP2GuBqq4hIJKl7m7rrqWA076bDoY377ffO30up06IGnvC9VXHUbzZLcBjqWVEcusc7cfWEg/3VaKo56OWnRp/ay3Fxsok3HM17P8/wAz8AT99SNVuwyDY0zQd5z6rk2ktb2zEpHg5D2R5DL73KUpSt9QSUpSiJSleUx5MaI9IUCUtNqWQO8AZoiqZ0rtQ+NdxxaWlKLFojpaIzyLq/PWR7Cgf01ENbO+3G23e9TrrJ1bp0vTJC33P+PHapRJ7vrrC+RvWzTnxw/KqPU01VPM6TZnM+C7XhuIYZRUkcAnZ7IHxDfx9VKXR311pbQkm7zb8iYqTKQ20wWGQvhQCorByR2nh91dBv1u/YNY6Lbsen/D0rclIckdeyEAtpBIHIn97hPsqDfkb1s058cPyp8jetmnPjh+VZ2mvbBsBGdXyK0pGYHLXCudOC8EH3hbIWGSstt/vjoexaIs1mlpunhEOG2y7wRgU8QSAcHi5jNR/rzcPT2pt6bLqVxMzxHbupylTQ6w8Cis+bnHNRA7eyop+RvWzTnxw/KnyN62ac+OH5V7klxCRjYzGbC3A8Fip6fAaeZ87JxrOBHvD4t9lbP9Yfb/APhvHwo/3U/WH2//AIbx8KP91VM+RvWzTnxw/KnyN62ac+OH5Vn7difL9Co/uXRvn/rC6XdfUsfV24Vzv0frREfcSGQ4MKDaUhIyO7sz7asVH6Qe3rMdtlKLuEoQEgCKnuGP4qqh8jetmnPjh+VPkb1s058cPyrWgfXwPc9sZu7fkVJ10WBVsUUUk4tGLCzh8h+FLW/u5ln13LssS1eGItkRSnJHWthKlLJA5DJzhIP9xqV2+kJt6htKEou4CQAB4Kn/AHVU75G9bNOfHD8qfI3rZpz44flWRk+IskdIIzd1r5HgsE1Fo/NBHA6carL29occzdSX0hNxYOvbvbU2cSE26EyrAeRwKLqz5xwCeWEpx7a1mym4r23t/efdjLl22YlKJTKCAoYPmrTnlkZPLvzXEhFnIz+lum/8gmv3gs/rbpr/ACKa1nMrjPt9Q63kpFk2CNouxbVpjta2sPG/W+at1H3824djB5dwmsrx/wApcNZUPdkffUd7sb/Iutpes2jo8qMiQgoenP4QsJPIhCQTjI/eJz9XfUE8Fn9bdNf5FNOCz+tumv8AIprclqsSkZq6hHkCoilwvRymlEu2DrbgXC349VjVudEWR3UerrXY2kkmZJQ2rHcjOVH2JBPsrX8Fn9bdNf5FNTL0SrTaJev5lxRerRcX4EIqaaiyg6pBWQkrwOwAZH9VR9Ph075WtewgXzyU7iGkNFDSyPilaXAGwBBN+CtJGZbjx247KAhppAQhI7AAMAV6UpV5XEyb5lKUpREpSlESlKURfLzpIaNOhd5tQWRtotw1yDLhebwpLLvnpCfSEklH2oNR1V8+mnszqPcR+wX3RttTOukVK4ktsvoayyTxoOVkDzVFY9Pn/VVcf1YN7PVBH+Sjf+yiLD6N9s0deLrqCPrDSiL1Dg2l+6rkKuDscxm2EKJSEtkcRWpTY5nl3Vs9D6M0jr7Tuu9StxbLoyM0qFDsqbldHvBo8hZy7lw5UtRQ2sgEEZX2cs1k2fo99IC0M3Bm26dMZFximJLCLjF/aslSVFB8/sJSk8vRXpF2B6QsaxpsjGnii3JnJuAj+MIhT4QlPClz5/MhJI9FEW2g7Y6KZ38uelZlvhmy6V0yJN2XInvNR5MpMdBU4t0ZU2kuup+aOQT83uqHN2Faf/TORH0za7Zb4EdCWsW64vTY7y+0uJddAUc5AxgDzami0bWdKa06jumorfDfZut25TpPh8NSnxnODlRGM45D0Vz1+6O+/t9vEm73bTQlTpS+N55VxigrV6cBYFEW9te323julo2nJmnJIvf6EK1LN1C3PcSIjqgpxptbR8wpKeBPcTxDHPnWp0zpXb+xbB2/VupLVYbpfLoZkhli4XqTEe6ltXVISy20CHCVpUfO4e0c/Ru9RbX9KrUFgTYLuxMkWpKUI8FFziNtqSjHAlQSscQGBgHOMCvM7W9KU6PTpDxc+LGlgx0wxNhBIbJyU54s4J+uiLS6K0PoidsLcL/HtkfUGqGIcqVcY712XDkWxpPJp5lnh4X2+xSiT34HPlXDa803abDtdoOaiNwXy9NS50xwuKJLHWhDA4c8IGErOQMnNSnL2w6VMnSaNHvxJ67IllLAjeM4gT1SexsqC+IpGB5pOK0N56P/AEgr34C1dNNOSU26IiFE47hFAaYQSUoGHOwZPvoi/NgNpI2qNG37VF/stwmxXYsqJaCylwIaktx1u+EOKTgBCVIS2M8lKXjupsvtJZ9e7SXiSX0s6sl3ExdPpccKUuqYaS683jPCeJC+09hSPrrZ23Z3pMQH7U/Csz8ZdlYcYt4TPhgMIc4usCRx4PFxqyTknNeVu2Y6SluYtDECySozdmlLl28N3CIOoeWRxLH7TmTwjtzyGKIitHaBte4m6Nyk6bFx0xo+OiMxb/Dnm+tmKcbZT+0CuPmpLp7+3s5Vi3baK3XbfO3ad0/arnBtb1oj3u623Kn5FtbU0HHY45cSl80pSCOLK01udMbW9KXTUq6S7Fb5cJ+7Oh6c4ifDKnlgqIUSVnnlSjy9Na47JdJJTV5bcs0tzx4Um5rcukVbkrhVxjjWXOI+dz7edEWt1RoS22vpMP6Ws+i3LpaQlp9FokzXY4abcjJcUXXuakJbKypRJ/dwa5DfCTt+5q1MPbuzog26GyGn30SnXkSn8+etBcJIQOxPZkDPfUrWjbPpU2i9PXq3QJLFwehtwXHxOhFSmGwEoQcr7AEgeytDqjYPpCamvT15vumlzZ7wSHHlz4gJCQAOQWB2AURQVUq9FLWZ0VvdY5jrxbgz3PF8z0FDuAkn6gvgV7Kzf1ZN7fU3/wDRi/8Asr9R0Zt7kLC0aOKVJOQRcY2Qf+5RF9JaVodvHb67oazK1PCVCvYhtonMqcSvDqRhR4kkggkZ5HvrfURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURKUpREpSlESlKURf/Z" alt="Logo">
                <span class="mh-name">THE DESI ANDAZ MEDIA NETWORK</span>
                <span class="mh-sub">| OFFICIAL APPOINTMENT LETTER</span>
            </div>
            <div class="mini-header-right">RNI: JHBIL/26/A3245</div>
        </div>

        <div class="section">
            <div class="sec-title">घोषणा (Declaration)</div>
            <p class="body-text">
                The Desi Andaz Media Network निष्पक्ष, निर्भीक एवं जनहित पत्रकारिता के सिद्धांतों पर कार्य करता है। आपसे अपेक्षा की जाती है कि आप पत्रकारिता की गरिमा एवं नैतिक मूल्यों का पालन करते हुए संस्था के उद्देश्यों के अनुरूप कार्य करेंगे। हम आपके उज्ज्वल भविष्य एवं सफल कार्यकाल की कामना करते हैं।
            </p>
        </div>

        <div class="sig-section">
            <div>
                <div style="font-size:12px; color:#6B6460; margin-bottom:4mm;">Issued on behalf of:<br><strong style="color:#1E1B18;">The Desi Andaz Media Network</strong></div>
            </div>
            <div style="margin-left:auto; text-align:center;">
                <div class="sig-digital">
                    <div class="sig-check">✓ DIGITALLY SIGNED</div>
                    Signed By: Sonu Kumar Saha<br>
                    Designation: Managing Director<br>
                    Date: ${probationDate}<br>
                    AUTH ID: TDA-SEC-${reporter.reporterCode || 'PENDING'}
                </div>
                <div class="verified-text">Verified Digital Signature</div>
                <div class="sig-name-hi">सोनू कुमार साहा</div>
                <div class="sig-name">Sonu Kumar Saha</div>
                <div class="sig-desig">Founder & Managing Director</div>
                <div class="sig-org">The Desi Andaz Media Network</div>
            </div>
        </div>

        <div class="acceptance-box">
            <div class="acc-title">कर्मचारी स्वीकृति (Employee Acceptance)</div>
            <p class="acc-text">
                मैं, <strong>${reporter.fullName}</strong>, इस नियुक्ति पत्र में उल्लिखित सभी नियमों एवं शर्तों को पढ़कर, समझकर एवं स्वीकार करता/करती हूँ।
            </p>
            <div class="acc-fields">
                <div class="acc-field">
                    <div class="af-label">हस्ताक्षर:</div>
                    <div class="af-line"></div>
                </div>
                <div class="acc-field">
                    <div class="af-label">संवाददाता पहचान पत्र (Correspondent ID): ${reporter.reporterCode || 'PENDING'}</div>
                    <div class="af-line"></div>
                </div>
                <div class="acc-field">
                    <div class="af-label">नाम:</div>
                    <div class="af-line"></div>
                </div>
                <div class="acc-field">
                    <div class="af-label">दिनांक:</div>
                    <div class="af-line"></div>
                </div>
                <div class="acc-field">
                    <div class="af-label">स्थान:</div>
                    <div class="af-line"></div>
                </div>
            </div>
        </div>

        <div class="page-footer">PAGE 4 OF 4</div>
    </div>
</div>`;

    tempContainer.innerHTML = stylesHtml + page1Html + page2Html + page3Html + page4Html;
    document.body.appendChild(tempContainer);

    const generatePdfPromise = (async (): Promise<Blob | null> => {
      try {
        const page1El = tempContainer.querySelector('#appointment-page-1') as HTMLElement;
        const page2El = tempContainer.querySelector('#appointment-page-2') as HTMLElement;
        const page3El = tempContainer.querySelector('#appointment-page-3') as HTMLElement;
        const page4El = tempContainer.querySelector('#appointment-page-4') as HTMLElement;

        // Await image loading (including base64 logo icons)
        const images = tempContainer.getElementsByTagName('img');
        const imgPromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue on failure
          });
        });
        await Promise.all(imgPromises);

        // Render all pages in parallel to maximize speed
        const [canvas1, canvas2, canvas3, canvas4] = await Promise.all([
          html2canvas(page1El, { scale: 1.2, useCORS: false, logging: false, imageTimeout: 3000 }),
          html2canvas(page2El, { scale: 1.2, useCORS: false, logging: false, imageTimeout: 3000 }),
          html2canvas(page3El, { scale: 1.2, useCORS: false, logging: false, imageTimeout: 3000 }),
          html2canvas(page4El, { scale: 1.2, useCORS: false, logging: false, imageTimeout: 3000 })
        ]);

        const imgData1 = canvas1.toDataURL('image/jpeg', 0.6);
        const imgData2 = canvas2.toDataURL('image/jpeg', 0.6);
        const imgData3 = canvas3.toDataURL('image/jpeg', 0.6);
        const imgData4 = canvas4.toDataURL('image/jpeg', 0.6);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.addPage();
        pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.addPage();
        pdf.addImage(imgData3, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.addPage();
        pdf.addImage(imgData4, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        return pdf.output('blob');
      } catch (e) {
        console.error('Error generating PDF canvas:', e);
        return null;
      }
    })();

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('PDF generation timed out after 12 seconds');
        resolve(null);
      }, 12000);
    });

    try {
      const result = await Promise.race([generatePdfPromise, timeoutPromise]);
      return result;
    } catch (e) {
      console.error('Error in PDF generation race:', e);
      return null;
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  };

  const handleGeneratePreview = async () => {
    if (useAutoGenerate && !fatherHusbandName.trim()) {
      alert('Please enter Father/Husband name for the appointment letter.');
      return;
    }

    setIsPreviewLoading(true);
    try {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }

      const pdfBlob = await generateAppointmentLetterBlob(selectedReporter, fatherHusbandName.trim(), probationStartDate);
      if (!pdfBlob) {
        alert('Failed to generate automatic appointment letter.');
        return;
      }
      
      const url = URL.createObjectURL(pdfBlob);
      setPreviewPdfUrl(url);
      setPreviewPdfBlob(pdfBlob);
    } catch (err) {
      console.error(err);
      alert('An error occurred during letter generation.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCustomPdfChange = (file: File | null) => {
    setJoiningLetterFile(file);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
      setPreviewPdfBlob(null);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewPdfUrl(url);
      setPreviewPdfBlob(file);
    }
  };

  const handleApproveKYC = async () => {
    if (!previewPdfBlob) {
      alert('Please generate and preview the appointment letter first.');
      return;
    }
    setIsApproving(true);

    try {
      const fileName = useAutoGenerate
        ? `appointment_letter_${selectedReporter.fullName.replace(/\s+/g, '_')}.pdf`
        : (joiningLetterFile?.name || 'custom_joining_letter.pdf');

      const finalFile = new File([previewPdfBlob], fileName, { type: 'application/pdf' });

      const uploadFormData = new FormData();
      uploadFormData.append('file', finalFile);
      uploadFormData.append('folder', 'joining_letters');
      uploadFormData.append('reporterId', selectedReporter.id);

      // Call single server action to upload and approve in one roundtrip
      const res = await approveReporterWithLetterAction(uploadFormData);
      if (res.success && res.url) {
        alert('Correspondent approved and Joining Letter published!');
        
        // Update local list state
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Approved', joiningLetter: res.url } : r));
        handleCloseReview();
      } else {
        alert('Failed to approve reporter: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during approval process.');
    } finally {
      setIsApproving(false);
    }
  };

  // Suspension & Deletion States
  const [isSuspending, setIsSuspending] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuspendReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to block/suspend reporter ${selectedReporter.fullName}?`)) return;
    setIsSuspending(true);
    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Suspended');
      if (res.success) {
        alert('Reporter has been blocked.');
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Suspended' } : r));
        handleCloseReview();
      } else {
        alert('Failed to block: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivateReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to unblock and reactivate reporter ${selectedReporter.fullName}?`)) return;
    setIsReactivating(true);
    try {
      const res = await updateReporterStatus(selectedReporter.id, 'Approved');
      if (res.success) {
        alert('Reporter has been unblocked successfully!');
        setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, status: 'Approved' } : r));
        handleCloseReview();
      } else {
        alert('Failed to unblock: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDeleteReporter = async () => {
    if (!selectedReporter) return;
    if (!confirm(`Are you sure you want to permanently delete reporter ${selectedReporter.fullName} and their KYC documents? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteReporter(selectedReporter.id);
      if (res.success) {
        alert('Reporter has been successfully deleted.');
        setReporters(prev => prev.filter(r => r.id !== selectedReporter.id));
        handleCloseReview();
      } else {
        alert('Failed to delete: ' + res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Admin Direct Chat States
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);

  // Poll for new messages every 4 seconds when chat is open
  useEffect(() => {
    if (!selectedReporter?.id) {
      setIsAdminChatOpen(false);
      return;
    }

    const fetchAdminChatData = async () => {
      try {
        if (isAdminChatOpen) {
          const messages = await getReporterMessages(selectedReporter.id);
          setAdminChatMessages(messages);
          await markReporterMessagesAsRead(selectedReporter.id, 'Admin');
          // Instantly clear unread count for this reporter in local state
          setReporters(prev => prev.map(r => r.id === selectedReporter.id ? { ...r, unreadCount: 0 } : r));
        }
      } catch (e) {
        console.error('Error polling admin chat:', e);
      }
    };

    fetchAdminChatData();
    const interval = setInterval(fetchAdminChatData, 4000);
    return () => clearInterval(interval);
  }, [selectedReporter?.id, isAdminChatOpen]);

  // Periodic polling for reporters list with unread counts (every 5 seconds)
  useEffect(() => {
    const fetchReportersUnreadData = async () => {
      try {
        const list = await getReportersListWithUnreadCounts();
        if (list && list.length > 0) {
          setReporters(list);
        }
      } catch (err) {
        console.error('Error fetching reporters unread data:', err);
      }
    };

    fetchReportersUnreadData();
    const interval = setInterval(fetchReportersUnreadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of admin chat automatically
  useEffect(() => {
    if (isAdminChatOpen) {
      const chatBody = document.getElementById('adminChatMessagesBody');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
  }, [adminChatMessages, isAdminChatOpen]);

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !selectedReporter?.id || isSendingAdminMessage) return;

    const text = adminChatInput.trim();
    setAdminChatInput('');
    setIsSendingAdminMessage(true);

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      reporterId: selectedReporter.id,
      sender: 'Admin',
      message: text,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setAdminChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendReporterMessage(selectedReporter.id, 'Admin', text);
      if (res.success && res.message) {
        setAdminChatMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
      }
    } catch (err) {
      console.error('Error sending admin message:', err);
    } finally {
      setIsSendingAdminMessage(false);
    }
  };

  // -- Password Management Handlers --

  const handlePasswordsTabClick = async () => {
    setActiveTab('Passwords');
    if (isPasswordsAuthorized) {
      await fetchPasswordsData();
    }
  };

  const fetchPasswordsData = async () => {
    setIsLoadingPasswords(true);
    try {
      const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
      const list = await getCorrespondentsPasswordsList(activeAdmin);
      setPasswordsList(list);
      
      const logs = await getAuditLogsAction(activeAdmin);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load password manager data:', err);
    } finally {
      setIsLoadingPasswords(false);
    }
  };

  const handleSuperAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
      setPasswordsVerifyError('कृपया आईडी और पासवर्ड दर्ज करें।');
      return;
    }

    setIsVerifyingAdmin(true);
    setPasswordsVerifyError('');

    try {
      const res = await verifySuperAdminCredentials(adminUsernameInput.trim(), adminPasswordInput.trim());
      if (res.success) {
        setIsPasswordsAuthorized(true);
        localStorage.setItem('adminUsername', adminUsernameInput.trim());
        localStorage.setItem('adminPasswordHash', adminPasswordInput.trim());
        
        await fetchPasswordsData();
      } else {
        setPasswordsVerifyError(res.message || 'अमान्य क्रेडेंशियल्स।');
      }
    } catch (err) {
      setPasswordsVerifyError('सर्वर से संपर्क करने में असमर्थ।');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const handleToggleShowPassword = async (reporter: any) => {
    const reporterId = reporter.id;
    const isShowing = showPasswordStates[reporterId];
    
    setShowPasswordStates(prev => ({ ...prev, [reporterId]: !isShowing }));

    if (!isShowing) {
      try {
        const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
        await logPasswordViewAction(activeAdmin, reporter.fullName, 'Viewed plain-text password credentials');
        
        const logs = await getAuditLogsAction(activeAdmin);
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to log audit activity:', err);
      }
    }
  };

  const handleCopyPassword = async (reporter: any, passwordText: string) => {
    try {
      await navigator.clipboard.writeText(passwordText);
      alert(`${reporter.fullName} का पासवर्ड कॉपी किया गया!`);
      
      const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
      await logPasswordViewAction(activeAdmin, reporter.fullName, 'Copied credentials to clipboard');
      const logs = await getAuditLogsAction(activeAdmin);
      setAuditLogs(logs);
    } catch (err) {
      alert('क्लिपबोर्ड पर कॉपी करने में असमर्थ।');
    }
  };

  const handleGenerateRandomPassword = async (reporter: any) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPassword = 'TDA-';
    for (let i = 0; i < 6; i++) {
      randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (!confirm(`Generate and set random password "${randomPassword}" for ${reporter.fullName}?`)) {
      return;
    }

    try {
      const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
      const res = await resetCorrespondentPasswordAction(activeAdmin, reporter.id, randomPassword);
      if (res.success) {
        alert(`Password for ${reporter.fullName} reset to: ${randomPassword}\n(This has been copied to your clipboard)`);
        await navigator.clipboard.writeText(randomPassword);
        await fetchPasswordsData();
      } else {
        alert('Failed to reset: ' + res.message);
      }
    } catch (err) {
      alert('Error resetting password.');
    }
  };

  const handleCustomResetSubmit = async (reporter: any) => {
    const newPass = customPasswordResetInputs[reporter.id]?.trim();
    if (!newPass || newPass.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
      const res = await resetCorrespondentPasswordAction(activeAdmin, reporter.id, newPass);
      if (res.success) {
        alert(`Password for ${reporter.fullName} successfully updated.`);
        setCustomPasswordResetInputs(prev => ({ ...prev, [reporter.id]: '' }));
        setActiveResetUserId(null);
        await fetchPasswordsData();
      } else {
        alert('Failed to reset: ' + res.message);
      }
    } catch (err) {
      alert('Error updating password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleMockSendCredentials = async (reporter: any, channel: 'WhatsApp' | 'SMS' | 'Email') => {
    const activeAdmin = adminUsernameInput || localStorage.getItem('adminUsername') || 'ThedesiandazNews';
    await logPasswordViewAction(activeAdmin, reporter.fullName, `Sent login credentials via ${channel}`);
    const logs = await getAuditLogsAction(activeAdmin);
    setAuditLogs(logs);
    alert(`क्रेडेंशियल्स सफलतापूर्वक ${channel} द्वारा ${reporter.fullName} को भेज दिए गए हैं!`);
  };

  const handleLockPasswordsPanel = () => {
    setIsPasswordsAuthorized(false);
    setAdminPasswordInput('');
    setPasswordsList([]);
    setAuditLogs([]);
    setActiveTab('Pending');
  };

  return (
    <div>
      <div className={styles.pageHeader} style={{ marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-users-cog" style={{ color: '#ef4444' }}></i>
            <span>संवाददाता KYC प्रबंधन</span>
          </h1>
          <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
            Audit verification dossier submissions, manage official contracts, and regulate active reporting authorizations.
          </p>
        </div>
      </div>

      {/* Premium Segmented Control to toggle between Correspondents and Admins/Super Admins */}
      <div style={{
        display: 'inline-flex',
        background: '#f1f5f9',
        padding: '5px',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        marginBottom: '24px',
        gap: '4px',
        boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.03)'
      }}>
        <button
          type="button"
          onClick={() => setSectionTab('Correspondents')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            background: sectionTab === 'Correspondents' ? 'linear-gradient(135deg, #ef4444 0%, #cc2200 100%)' : 'transparent',
            color: sectionTab === 'Correspondents' ? '#ffffff' : '#64748b',
            boxShadow: sectionTab === 'Correspondents' ? '0 4px 10px rgba(239, 68, 68, 0.2)' : 'none',
          }}
        >
          <i className="fas fa-users" style={{ fontSize: '14px' }}></i>
          <span>संवाददाता (Correspondents)</span>
        </button>
        
        <button
          type="button"
          onClick={() => setSectionTab('Admins')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: 'none',
            background: sectionTab === 'Admins' ? 'linear-gradient(135deg, #ef4444 0%, #cc2200 100%)' : 'transparent',
            color: sectionTab === 'Admins' ? '#ffffff' : '#64748b',
            boxShadow: sectionTab === 'Admins' ? '0 4px 10px rgba(239, 68, 68, 0.2)' : 'none',
          }}
        >
          <i className="fas fa-user-shield" style={{ fontSize: '14px' }}></i>
          <span>एडमिन & सुपर एडमिन (Admin & Super Admin)</span>
        </button>
      </div>

      {/* Premium Capsule Tabs Selector */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px',
        background: '#f1f5f9',
        borderRadius: '16px',
        border: '1px solid #cbd5e1',
        marginBottom: '32px',
        overflowX: 'auto',
        maxWidth: 'max-content',
        scrollbarWidth: 'none',
        boxShadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.03)'
      }}>
        <button 
          onClick={() => setActiveTab('Pending')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Pending' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
            color: activeTab === 'Pending' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Pending' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-hourglass-half" style={{ color: activeTab === 'Pending' ? '#fff' : '#818cf8' }}></i>
          <span>Pending Review</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Pending' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Pending' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {getFilteredReportersCount('Pending')}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Approved')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Approved' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
            color: activeTab === 'Approved' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Approved' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-check-circle" style={{ color: activeTab === 'Approved' ? '#fff' : '#10b981' }}></i>
          <span>Approved Active</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Approved' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Approved' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {getFilteredReportersCount('Approved')}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Rejected')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Rejected' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
            color: activeTab === 'Rejected' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Rejected' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-times-circle" style={{ color: activeTab === 'Rejected' ? '#fff' : '#f59e0b' }}></i>
          <span>Rejected Profiles</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Rejected' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Rejected' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {getFilteredReportersCount('Rejected')}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Suspended')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Suspended' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
            color: activeTab === 'Suspended' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Suspended' ? '0 4px 12px rgba(239, 68, 68, 0.2)' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <i className="fas fa-ban" style={{ color: activeTab === 'Suspended' ? '#fff' : '#ef4444' }}></i>
          <span>Blocked Profiles</span>
          <span style={{
            fontSize: '11px',
            background: activeTab === 'Suspended' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
            color: activeTab === 'Suspended' ? '#fff' : '#475569',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: 800,
            marginLeft: '4px'
          }}>
            {getFilteredReportersCount('Suspended')}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab('Chat')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Chat' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
            color: activeTab === 'Chat' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Chat' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <i className="fas fa-comments" style={{ color: activeTab === 'Chat' ? '#fff' : '#6366f1' }}></i>
          <span>Direct Chat with Correspondent</span>
          
          {getFilteredUnreadChatCount() > 0 && (
            <span style={{
              fontSize: '11px',
              background: activeTab === 'Chat' ? '#ffffff' : '#ef4444',
              color: activeTab === 'Chat' ? '#ef4444' : '#ffffff',
              padding: '2px 8px',
              borderRadius: '20px',
              fontWeight: 800,
              marginLeft: '4px',
              boxShadow: activeTab === 'Chat' ? 'none' : '0 2px 6px rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              {getFilteredUnreadChatCount()} New
            </span>
          )}
        </button>

        <button 
          onClick={handlePasswordsTabClick} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none',
            background: activeTab === 'Passwords' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
            color: activeTab === 'Passwords' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'Passwords' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <i className="fas fa-key" style={{ color: activeTab === 'Passwords' ? '#fff' : '#f59e0b' }}></i>
          <span>पासवर्ड प्रबंधन</span>
        </button>
      </div>

      {activeTab !== 'Passwords' ? (
        <>
          {/* Premium Filter Section */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            marginBottom: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
              <i className="fas fa-filter" style={{ color: '#4f46e5', fontSize: '15px' }}></i>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>संवाददाता फ़िल्टर:</span>
            </div>

            {/* State Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>State (राज्य)</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict('');
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <option value="">All States (सभी राज्य)</option>
                  {availableStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                  <i className="fas fa-chevron-down" style={{ fontSize: '11px' }}></i>
                </div>
              </div>
            </div>

            {/* District Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>District (जिला)</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                  style={{
                    width: '100%',
                    padding: '8px 32px 8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: selectedState ? '#f8fafc' : '#f1f5f9',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: selectedState ? '#334155' : '#94a3b8',
                    outline: 'none',
                    cursor: selectedState ? 'pointer' : 'not-allowed',
                    appearance: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <option value="">All Districts (सभी जिले)</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                  <i className="fas fa-chevron-down" style={{ fontSize: '11px' }}></i>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedState || selectedDistrict) && (
              <button
                onClick={() => {
                  setSelectedState('');
                  setSelectedDistrict('');
                }}
                style={{
                  alignSelf: 'flex-end',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  height: '38px',
                  boxSizing: 'border-box'
                }}
              >
                <i className="fas fa-undo" style={{ fontSize: '11px' }}></i>
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Spacious Card-Separated Row spacing grid */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>संवाददाता विवरण</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Email Address</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Mobile Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Assigned Region</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Registration Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ 
                      textAlign: 'center', 
                      padding: '60px 40px', 
                      color: '#64748b',
                      background: '#ffffff',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px'
                    }}>
                      <div style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }}>
                        <i className="fas fa-users-slash"></i>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 700, display: 'block', color: '#475569' }}>No profiles found</span>
                      <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>There are currently no reporters under the active tab selection.</span>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((rep) => (
                    <tr key={rep.id} style={{
                      background: '#ffffff',
                      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                    }}>
                      <td style={{ 
                        padding: '14px 16px', 
                        borderTopLeftRadius: '12px', 
                        borderBottomLeftRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: rep.status === 'Suspended' ? '4px solid #ef4444' : '1px solid #e2e8f0',
                        borderRight: 'none',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <img
                              src={rep.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                              alt={rep.fullName}
                              style={{ 
                                width: '42px', 
                                height: '42px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', 
                                border: '2px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                                background: '#f8fafc'
                              }}
                            />
                            {/* Status notification dot */}
                            <span style={{
                              position: 'absolute',
                              bottom: '0',
                              right: '0',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              border: '2px solid #ffffff',
                              background: rep.status === 'Approved' ? '#10b981' : rep.status === 'Pending' ? '#6366f1' : rep.status === 'Rejected' ? '#f59e0b' : '#ef4444',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '14.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{rep.fullName}</span>
                              {rep.status === 'Suspended' ? (
                                <span style={{
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fca5a5',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  lineHeight: '1'
                                }}>
                                  <i className="fas fa-ban" style={{ fontSize: '9px' }}></i>
                                  <span>Blocked</span>
                                </span>
                              ) : activeTab === 'Chat' ? (
                                <span style={{
                                  background: rep.status === 'Approved' ? '#ecfdf5' : rep.status === 'Pending' ? '#eeebff' : '#fff9db',
                                  color: rep.status === 'Approved' ? '#10b981' : rep.status === 'Pending' ? '#4f46e5' : '#d97706',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  border: `1px solid ${rep.status === 'Approved' ? '#a7f3d0' : rep.status === 'Pending' ? '#cbd5e1' : '#fde68a'}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  lineHeight: '1'
                                }}>
                                  <i className={`fas ${rep.status === 'Approved' ? 'fa-check-circle' : rep.status === 'Pending' ? 'fa-hourglass-half' : 'fa-times-circle'}`} style={{ fontSize: '9px' }}></i>
                                  <span>{rep.status}</span>
                                </span>
                              ) : null}
                              {(rep.unreadCount || 0) > 0 && (
                                <span style={{
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '20px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                                }}>
                                  <i className="fas fa-bell" style={{ fontSize: '8px' }}></i>
                                  <span>{rep.unreadCount} New</span>
                                </span>
                              )}
                            </span>

                            {/* Designation/Role Badge */}
                            <div style={{ marginTop: '5px', marginBottom: '2px' }}>
                              <span style={{
                                background: 
                                  rep.role === 'SUPER_ADMIN' ? '#fdf2f8' : 
                                  rep.role === 'COMPANY_ADMIN' ? '#f0fdfa' : 
                                  rep.role === 'PRINT_ADMIN' ? '#f5f3ff' : 
                                  rep.role === 'STATE_CORRESPONDENT' ? '#eff6ff' : 
                                  rep.role === 'DISTRICT_CORRESPONDENT' ? '#f0fdf4' : 
                                  rep.role === 'DISTRICT_AD_INCHARGE' ? '#fef3c7' : 
                                  rep.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? '#ffedd5' : 
                                  rep.role === 'STATE_AD_INCHARGE' ? '#fef9c3' : 
                                  '#f8fafc',
                                color: 
                                  rep.role === 'SUPER_ADMIN' ? '#db2777' : 
                                  rep.role === 'COMPANY_ADMIN' ? '#0d9488' : 
                                  rep.role === 'PRINT_ADMIN' ? '#7c3aed' : 
                                  rep.role === 'STATE_CORRESPONDENT' ? '#2563eb' : 
                                  rep.role === 'DISTRICT_CORRESPONDENT' ? '#16a34a' : 
                                  rep.role === 'DISTRICT_AD_INCHARGE' ? '#d97706' : 
                                  rep.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? '#ea580c' : 
                                  rep.role === 'STATE_AD_INCHARGE' ? '#ca8a04' : 
                                  '#64748b',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: `1px solid ${
                                  rep.role === 'SUPER_ADMIN' ? '#fbcfe8' : 
                                  rep.role === 'COMPANY_ADMIN' ? '#99f6e4' : 
                                  rep.role === 'PRINT_ADMIN' ? '#ddd6fe' : 
                                  rep.role === 'STATE_CORRESPONDENT' ? '#bfdbfe' : 
                                  rep.role === 'DISTRICT_CORRESPONDENT' ? '#bbf7d0' : 
                                  rep.role === 'DISTRICT_AD_INCHARGE' ? '#fde68a' : 
                                  rep.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? '#fed7aa' : 
                                  rep.role === 'STATE_AD_INCHARGE' ? '#fef08a' : 
                                  '#e2e8f0'
                                }`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                lineHeight: '1.2'
                              }}>
                                <i className={`fas ${
                                  rep.role === 'SUPER_ADMIN' ? 'fa-crown' : 
                                  rep.role === 'COMPANY_ADMIN' ? 'fa-user-tie' : 
                                  rep.role === 'PRINT_ADMIN' ? 'fa-print' : 
                                  ['DISTRICT_AD_INCHARGE', 'SANTHAL_PARGANA_AD_INCHARGE', 'STATE_AD_INCHARGE'].includes(rep.role) ? 'fa-bullhorn' : 
                                  'fa-user-edit'
                                }`} style={{ fontSize: '9px' }}></i>
                                <span>
                                  {rep.role === 'BLOCK_CORRESPONDENT' ? 'Block Correspondent' :
                                   rep.role === 'DISTRICT_CORRESPONDENT' ? 'District Correspondent' :
                                   rep.role === 'STATE_CORRESPONDENT' ? 'State Correspondent' :
                                   rep.role === 'COMPANY_ADMIN' ? 'Company Admin' :
                                   rep.role === 'PRINT_ADMIN' ? 'Print Admin' :
                                   rep.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                                   rep.role === 'DISTRICT_AD_INCHARGE' ? 'District Ad In-charge' : 
                                   rep.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? 'Santhal Pargana Ad In-charge' : 
                                   rep.role === 'STATE_AD_INCHARGE' ? 'State Ad In-charge' : 
                                   (rep.role || 'Block Correspondent')}
                                </span>
                              </span>
                            </div>
                            
                            {activeTab === 'Chat' ? (
                              <div style={{ marginTop: '4px' }}>
                                {rep.lastMessageText ? (
                                  <span style={{ 
                                    fontSize: '12px', 
                                    color: (rep.unreadCount || 0) > 0 ? '#4f46e5' : '#64748b', 
                                    fontWeight: (rep.unreadCount || 0) > 0 ? 700 : 500, 
                                    display: 'block',
                                    maxWidth: '280px',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {(rep.unreadCount || 0) > 0 ? '💬 ' : ''}{rep.lastMessageText}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', display: 'block' }}>
                                    No message history
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontSize: '10.5px', 
                                color: '#4f46e5', 
                                fontWeight: 800, 
                                fontFamily: 'monospace', 
                                marginTop: '4px',
                                background: '#eeebff',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}>
                                <i className="fas fa-id-badge"></i> {rep.reporterCode || 'NO ID ASSIGNED'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        color: '#475569',
                        fontWeight: 600
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="far fa-envelope" style={{ color: '#94a3b8' }}></i>
                          <span>{rep.email}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        color: '#475569',
                        fontWeight: 600
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-phone-alt" style={{ color: '#94a3b8' }}></i>
                          <span>{rep.mobile}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        color: '#475569',
                        fontWeight: 600
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-map-marker-alt" style={{ color: '#f43f5e' }}></i>
                          <span>{rep.block ? `${rep.block}, ` : ''}{rep.district}, {rep.state}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none', 
                        borderRight: 'none',
                        verticalAlign: 'middle',
                        color: '#64748b',
                        fontSize: '13px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="far fa-calendar-alt" style={{ color: '#94a3b8' }}></i>
                          <span>{new Date(rep.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 16px', 
                        borderTopRightRadius: '12px', 
                        borderBottomRightRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: 'none',
                        verticalAlign: 'middle',
                        textAlign: 'center'
                      }}>
                        <button 
                          onClick={() => handleOpenReview(rep)} 
                          style={{
                            background: activeTab === 'Chat' && (rep.unreadCount || 0) > 0
                              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            border: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? 'none' : '1px solid #cbd5e1',
                            color: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? '#ffffff' : '#334155',
                            padding: '8px 16px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'Chat' && (rep.unreadCount || 0) > 0 ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                          onMouseEnter={(e) => {
                            if (activeTab === 'Chat' && (rep.unreadCount || 0) > 0) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.35)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                              e.currentTarget.style.color = '#ffffff';
                              e.currentTarget.style.borderColor = '#1e293b';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab === 'Chat' && (rep.unreadCount || 0) > 0) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.25)';
                            } else {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                              e.currentTarget.style.color = '#334155';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                            }
                          }}
                        >
                          <i className={`fas ${activeTab === 'Chat' ? 'fa-comments' : 'fa-clipboard-check'}`}></i>
                          <span>{activeTab === 'Chat' ? 'Open Chat' : 'Review KYC'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Password Management Dashboard Content */
        !isPasswordsAuthorized ? (
          /* Re-authentication Form card */
          <div style={{
            maxWidth: '500px',
            margin: '40px auto',
            padding: '32px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #cbd5e1',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fff9db',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '24px'
            }}>
              <i className="fas fa-lock"></i>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
              Super Admin Re-authentication Required
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              सुरक्षा कारणों से, संवाददाताओं के पासवर्ड देखने के लिए कृपया सुपर एडमिन क्रेडेंशियल्स सत्यापित करें।
            </p>
            <form onSubmit={handleSuperAdminVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Admin ID / उपयोगकर्ता नाम
                </label>
                <input
                  type="text"
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  placeholder="e.g. SuperAdmin"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Password / पासवर्ड
                </label>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>
              {passwordsVerifyError && (
                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{passwordsVerifyError}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isVerifyingAdmin}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: isVerifyingAdmin ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                {isVerifyingAdmin ? 'सत्यापित किया जा रहा है...' : 'अनलॉक करें (Unlock)'}
              </button>
            </form>
          </div>
        ) : (
          /* Authorized Dashboard Table & Controls */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              padding: '16px 20px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fff9db',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    संवाददाता पासवर्ड प्रबंधन डैशबोर्ड
                  </h2>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                    Secure Plain-text credentials log & verification center.
                  </span>
                </div>
              </div>

              {/* Search & Lock controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <input
                    type="text"
                    value={passwordsSearchQuery}
                    onChange={(e) => setPasswordsSearchQuery(e.target.value)}
                    placeholder="खोजें (नाम, ईमेल, मोबाइल...)"
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <i className="fas fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '12px' }}></i>
                </div>

                <button
                  onClick={handleLockPasswordsPanel}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <i className="fas fa-lock"></i>
                  <span>Lock Panel</span>
                </button>
              </div>
            </div>

            {/* Passwords List Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', fontSize: '13.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>संवाददाता</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Username / Email</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Mobile</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Password Status & Plaintext</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Last Login Info</th>
                    <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions / Reset Options</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPasswords ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#d97706', marginBottom: '8px' }}></i>
                        <div style={{ fontWeight: 600, color: '#64748b' }}>डेटा लोड किया जा रहा है...</div>
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const filtered = passwordsList.filter(rep => {
                        const query = passwordsSearchQuery.toLowerCase().trim();
                        if (!query) return true;
                        return (
                          rep.fullName?.toLowerCase().includes(query) ||
                          rep.email?.toLowerCase().includes(query) ||
                          rep.mobile?.toLowerCase().includes(query) ||
                          rep.reporterCode?.toLowerCase().includes(query)
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} style={{
                              textAlign: 'center',
                              padding: '40px',
                              color: '#64748b',
                              background: '#ffffff',
                              border: '2px dashed #cbd5e1',
                              borderRadius: '16px'
                            }}>
                              <i className="fas fa-users-slash" style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }}></i>
                              <div style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>कोई संवाददाता नहीं मिला</div>
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((rep) => {
                        const isReversible = rep.isReversible;
                        const isShowing = showPasswordStates[rep.id] || false;
                        const showResetForm = activeResetUserId === rep.id;

                        return (
                          <tr key={rep.id} style={{
                            background: '#ffffff',
                            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                            borderRadius: '12px',
                            transition: 'all 0.2s',
                          }}>
                            {/* Profile cell */}
                            <td style={{
                              padding: '14px 16px',
                              borderTopLeftRadius: '12px',
                              borderBottomLeftRadius: '12px',
                              border: '1px solid #e2e8f0',
                              borderRight: 'none',
                              verticalAlign: 'middle'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  fontWeight: 750,
                                  color: '#1e293b',
                                  fontSize: '14.5px',
                                  display: 'flex',
                                  flexDirection: 'column'
                                }}>
                                  <span>{rep.fullName}</span>
                                  <span style={{
                                    fontSize: '11px',
                                    color: rep.status === 'Approved' ? '#10b981' : rep.status === 'Pending' ? '#4f46e5' : rep.status === 'Rejected' ? '#f59e0b' : '#ef4444',
                                    fontWeight: 800,
                                    marginTop: '2px'
                                  }}>
                                    {rep.status}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Username cell */}
                            <td style={{
                              padding: '14px 16px',
                              border: '1px solid #e2e8f0',
                              borderLeft: 'none',
                              borderRight: 'none',
                              verticalAlign: 'middle',
                              color: '#475569',
                              fontWeight: 600
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#eeebff', color: '#4f46e5', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                                  {rep.reporterCode}
                                </span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>{rep.email}</span>
                              </div>
                            </td>

                            {/* Mobile cell */}
                            <td style={{
                              padding: '14px 16px',
                              border: '1px solid #e2e8f0',
                              borderLeft: 'none',
                              borderRight: 'none',
                              verticalAlign: 'middle',
                              color: '#475569',
                              fontWeight: 600
                            }}>
                              <span>{rep.mobile}</span>
                            </td>

                            {/* Password display cell */}
                            <td style={{
                              padding: '14px 16px',
                              border: '1px solid #e2e8f0',
                              borderLeft: 'none',
                              borderRight: 'none',
                              verticalAlign: 'middle',
                              minWidth: '220px'
                            }}>
                              {!isReversible ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    background: '#fee2e2',
                                    color: '#ef4444',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #fecaca',
                                    alignSelf: 'flex-start'
                                  }}>
                                    ⚠️ SHA-256 Hashed
                                  </span>
                                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    रिसेट आवश्यक है (पासवर्ड अदृश्य है)
                                  </span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    background: '#f8fafc',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    minWidth: '100px',
                                    textAlign: 'center',
                                    color: isShowing ? '#1e293b' : '#94a3b8'
                                  }}>
                                    {isShowing ? rep.passwordPreview : '••••••••'}
                                  </span>

                                  <button
                                    onClick={() => handleToggleShowPassword(rep)}
                                    title={isShowing ? 'पासवर्ड छुपाएं' : 'पासवर्ड दिखाएं'}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#64748b',
                                      fontSize: '14px',
                                      padding: '4px',
                                    }}
                                  >
                                    <i className={isShowing ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                  </button>

                                  <button
                                    onClick={() => handleCopyPassword(rep, rep.passwordPreview)}
                                    title="पासवर्ड कॉपी करें"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#64748b',
                                      fontSize: '14px',
                                      padding: '4px',
                                    }}
                                  >
                                    <i className="fas fa-copy"></i>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Last Login Info cell */}
                            <td style={{
                              padding: '14px 16px',
                              border: '1px solid #e2e8f0',
                              borderLeft: 'none',
                              borderRight: 'none',
                              verticalAlign: 'middle',
                              color: '#475569',
                              fontSize: '12.5px',
                              fontWeight: 500
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ color: '#1e293b', fontWeight: 600 }}>{rep.lastLogin}</span>
                              </div>
                            </td>

                            {/* Actions cell */}
                            <td style={{
                              padding: '14px 16px',
                              borderTopRightRadius: '12px',
                              borderBottomRightRadius: '12px',
                              border: '1px solid #e2e8f0',
                              borderLeft: 'none',
                              verticalAlign: 'middle'
                            }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleGenerateRandomPassword(rep)}
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      borderRadius: '6px',
                                      border: '1px solid #d97706',
                                      background: '#fffbeb',
                                      color: '#d97706',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#d97706';
                                      e.currentTarget.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#fffbeb';
                                      e.currentTarget.style.color = '#d97706';
                                    }}
                                  >
                                    <i className="fas fa-random" style={{ marginRight: '4px' }}></i>
                                    Auto Gen
                                  </button>

                                  <button
                                    onClick={() => setActiveResetUserId(showResetForm ? null : rep.id)}
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      borderRadius: '6px',
                                      border: '1px solid #4f46e5',
                                      background: showResetForm ? '#4f46e5' : '#eeebff',
                                      color: showResetForm ? '#ffffff' : '#4f46e5',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>
                                    {showResetForm ? 'Cancel' : 'Reset'}
                                  </button>
                                </div>

                                {/* Custom Password Input Form */}
                                {showResetForm && (
                                  <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    padding: '8px',
                                    background: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1'
                                  }}>
                                    <input
                                      type="text"
                                      placeholder="नया पासवर्ड"
                                      value={customPasswordResetInputs[rep.id] || ''}
                                      onChange={(e) => setCustomPasswordResetInputs(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                      style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        outline: 'none',
                                      }}
                                    />
                                    <button
                                      onClick={() => handleCustomResetSubmit(rep)}
                                      disabled={isResettingPassword}
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                )}

                                {/* Mock Send channels */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: '#f8fafc',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px dashed #cbd5e1',
                                  fontSize: '11px'
                                }}>
                                  <span style={{ fontWeight: 600, color: '#64748b' }}>Mock Send:</span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => handleMockSendCredentials(rep, 'WhatsApp')}
                                      title="WhatsApp पर भेजें"
                                      style={{ background: 'none', border: 'none', color: '#25D366', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      <i className="fab fa-whatsapp"></i>
                                    </button>
                                    <button
                                      onClick={() => handleMockSendCredentials(rep, 'SMS')}
                                      title="SMS द्वारा भेजें"
                                      style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      <i className="fas fa-sms"></i>
                                    </button>
                                    <button
                                      onClick={() => handleMockSendCredentials(rep, 'Email')}
                                      title="ईमेल द्वारा भेजें"
                                      style={{ background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                      <i className="far fa-envelope"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Audit Logs Section */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-history" style={{ color: '#d97706' }}></i>
                <span>Password Audit Logs (सुरक्षा लॉग)</span>
              </h3>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {auditLogs.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                    कोई हालिया गतिविधि नहीं।
                  </div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div key={index} style={{
                      padding: '8px 0',
                      borderBottom: index < auditLogs.length - 1 ? '1px solid #e2e8f0' : 'none',
                      color: '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>
                          [{new Date(log.timestamp).toLocaleString('hi-IN')}]
                        </span>
                        <span style={{ color: '#4f46e5', fontWeight: 700 }}>{log.adminName} (Super Admin)</span>
                      </div>
                      <div>
                        Action on <span style={{ fontWeight: 700, color: '#0f172a' }}>{log.correspondentName}</span>: {log.action}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* DETAIL MODAL INTERACTIVE PORTAL */}
      {selectedReporter && (
        <div className={styles.adminModalBackdrop} style={{
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.3s ease',
        }}>
          <div className={styles.adminModalContent} style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            maxWidth: isAdminChatOpen ? '1200px' : '850px',
            overflow: 'hidden',
            transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '24px 32px', 
              background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)',
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="fas fa-folder-open" style={{ color: '#4f46e5' }}></i>
                  <span>KYC Dossier: {selectedReporter.fullName}</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                  Review personal information, verification credentials, and supporting documents.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Chat Toggle Button */}
                <button 
                  onClick={() => setIsAdminChatOpen(!isAdminChatOpen)}
                  style={{
                    background: isAdminChatOpen ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' : '#f1f5f9',
                    border: isAdminChatOpen ? 'none' : '1px solid #cbd5e1',
                    color: isAdminChatOpen ? '#ffffff' : '#475569',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isAdminChatOpen ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-comments"></i>
                  <span>{isAdminChatOpen ? 'Close Chat Workspace' : 'Direct Chat with Correspondent'}</span>
                </button>

                <button 
                  onClick={handleCloseReview} 
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '16px', 
                    color: '#475569', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Split Container for KYC Dossier + Chat */}
            <div style={{ display: 'flex', height: 'calc(90vh - 120px)', overflow: 'hidden', flexGrow: 1 }}>
              
              {/* Left Column: KYC Dossier (60% width if chat open, otherwise 100%) */}
              <div style={{ 
                width: isAdminChatOpen ? '60%' : '100%', 
                padding: '32px', 
                overflowY: 'auto', 
                borderRight: isAdminChatOpen ? '1px solid #e2e8f0' : 'none',
                maxHeight: '100%',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
              
              {/* Profile Details Grid */}
              <h4 style={{ 
                fontSize: '13.5px', 
                fontWeight: 800, 
                color: '#4f46e5', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '10px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-user-circle"></i>
                <span>Personal Profile & Contact Info</span>
              </h4>
              
              <div style={{ 
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                display: 'flex', 
                gap: '28px', 
                marginBottom: '32px', 
                alignItems: 'start', 
                flexWrap: 'wrap' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={selectedReporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                    alt={selectedReporter.fullName}
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '20px', 
                      objectFit: 'cover', 
                      border: '3px solid #ffffff', 
                      boxShadow: '0 8px 16px -4px rgba(15, 23, 42, 0.15)', 
                      background: '#f8fafc' 
                    }}
                  />
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: selectedReporter.status === 'Approved' ? '#10b981' : selectedReporter.status === 'Pending' ? '#4f46e5' : selectedReporter.status === 'Rejected' ? '#f59e0b' : '#ef4444',
                    background: selectedReporter.status === 'Approved' ? '#ecfdf5' : selectedReporter.status === 'Pending' ? '#eeebff' : '#fef2f2',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedReporter.status === 'Approved' ? '#a7f3d0' : selectedReporter.status === 'Pending' ? '#cbd5e1' : '#fee2e2'}`,
                  }}>
                    {selectedReporter.status}
                  </span>
                </div>
                
                <div className={styles.dossierGrid} style={{ flex: 1, fontSize: '13.5px', rowGap: '16px', columnGap: '24px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>संवाददाता का पूरा नाम</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '15px' }}>{selectedReporter.fullName}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Father/Husband Name</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontSize: '15px' }}>{selectedReporter.fatherHusbandName || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>संवाददाता पहचान पत्र (Correspondent ID)</span>
                    <span style={{ fontWeight: 750, color: '#4f46e5', fontFamily: 'monospace', fontSize: '14px' }}>{selectedReporter.reporterCode || 'No ID Assigned'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Blood Group</span>
                    <span style={{ fontWeight: 750, color: '#e11d48' }}>{selectedReporter.bloodGroup || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Email Address</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.email}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Mobile Number</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.mobile}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Aadhaar Card Number</span>
                    <span style={{ fontWeight: 750, color: '#1e293b', fontFamily: 'monospace' }}>{selectedReporter.aadhaarNumber || 'Not Uploaded'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>पद (Designation)</span>
                    <select
                      value={selectedReporter.role || 'BLOCK_CORRESPONDENT'}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        if (confirm(`Are you sure you want to change designation/role to ${newRole}?`)) {
                          const res = await updateReporterRoleAction(selectedReporter.id, newRole);
                          if (res.success && res.reporter) {
                            setSelectedReporter((prev: any) => ({ ...prev, role: newRole }));
                            setReporters((prev: any[]) => prev.map((r: any) => r.id === selectedReporter.id ? { ...r, role: newRole } : r));
                            alert('Designation updated successfully.');
                          } else {
                            alert('Failed to update designation: ' + (res.message || 'Unknown error'));
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: '#ffffff',
                        color: '#1e293b',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="BLOCK_CORRESPONDENT">Block Correspondent (ब्लॉक संवाददाता)</option>
                      <option value="DISTRICT_CORRESPONDENT">District Correspondent (जिला संवाददाता)</option>
                      <option value="STATE_CORRESPONDENT">State Correspondent (राज्य संवाददाता)</option>
                      <option value="DISTRICT_AD_INCHARGE">District Advertisement In-charge (जिला विज्ञापन प्रभारी)</option>
                      <option value="SANTHAL_PARGANA_AD_INCHARGE">Santhal Pargana Advertisement In-charge (संताल परगना विज्ञापन प्रभारी)</option>
                      <option value="STATE_AD_INCHARGE">State Advertisement In-charge (राज्य विज्ञापन प्रभारी)</option>
                      <option value="COMPANY_ADMIN">Company Admin (कंपनी एडमिन)</option>
                      <option value="PRINT_ADMIN">Print Admin (प्रिंट एडमिन)</option>
                      <option value="SUPER_ADMIN">Super Admin (सुपर एडमिन)</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>PO + PS Info & Area</span>
                    <span style={{ fontWeight: 750, color: '#1e293b' }}>{selectedReporter.poPs} • Block: {selectedReporter.block}, Dist: {selectedReporter.district}, {selectedReporter.state}</span>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Full Residential Address</span>
                    <span style={{ fontWeight: 700, color: '#1e293b', lineHeight: '1.4' }}>{selectedReporter.fullAddress}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <h4 style={{ 
                fontSize: '13.5px', 
                fontWeight: 800, 
                color: '#4f46e5', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                borderBottom: '1px solid #f1f5f9', 
                paddingBottom: '10px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-file-signature"></i>
                <span>Uploaded Identity & Educational Credentials</span>
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {/* Aadhaar Card (Front) Card */}
                {selectedReporter.aadhaarUrl ? (
                  <a 
                    href={selectedReporter.aadhaarUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Aadhaar Card (Front)</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Aadhaar Card (Front)</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Aadhaar Card (Back) Card */}
                {selectedReporter.aadhaarBackUrl ? (
                  <a 
                    href={selectedReporter.aadhaarBackUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Aadhaar Card (Back)</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Aadhaar Card (Back)</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* PAN Card Card */}
                {selectedReporter.panUrl ? (
                  <a 
                    href={selectedReporter.panUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f0f9ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>PAN Card</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>PAN Card</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Voter ID Card Card */}
                {selectedReporter.voterIdUrl ? (
                  <a 
                    href={selectedReporter.voterIdUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-address-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Voter ID Card</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-address-card"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Voter ID Card</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Educational Certificates Card */}
                {selectedReporter.educationUrl ? (
                  <a 
                    href={selectedReporter.educationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fdf2f8',
                      color: '#db2777',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Educational Certificates</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Education Certificates</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Signature Card */}
                {selectedReporter.signatureUrl ? (
                  <a 
                    href={selectedReporter.signatureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#faf5ff',
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-signature"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Signature</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : selectedReporter.role !== 'BLOCK_CORRESPONDENT' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-signature"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Signature</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                ) : null}

                {/* Address Proof Card */}
                {selectedReporter.addressProofUrl ? (
                  <a 
                    href={selectedReporter.addressProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f0fdf4',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-home"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Address Proof</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : selectedReporter.role !== 'BLOCK_CORRESPONDENT' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-home"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Address Proof</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                ) : null}

                {/* Experience Cert Card */}
                {selectedReporter.experienceUrl ? (
                  <a 
                    href={selectedReporter.experienceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-briefcase"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Experience Cert</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : selectedReporter.role !== 'BLOCK_CORRESPONDENT' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-briefcase"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Experience Cert</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                ) : null}

                {/* Police Verification Card */}
                {selectedReporter.policeVerificationUrl ? (
                  <a 
                    href={selectedReporter.policeVerificationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>Police Verification</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>View / Download File <i className="fas fa-external-link-alt" style={{ fontSize: '9px', marginLeft: '2px' }}></i></span>
                    </div>
                  </a>
                ) : selectedReporter.role !== 'BLOCK_CORRESPONDENT' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    opacity: 0.6,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', display: 'block' }}>Police Verification</span>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 500 }}>Not Uploaded</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Introduction Video Section */}
              {selectedReporter.videoUrl && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ 
                    fontSize: '13.5px', 
                    fontWeight: 800, 
                    color: '#4f46e5', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    borderBottom: '1px solid #f1f5f9', 
                    paddingBottom: '10px', 
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fas fa-video"></i>
                    <span>संवाददाता वीडियो परिचय</span>
                  </h4>
                  <div style={{ 
                    maxWidth: '520px', 
                    margin: '0 auto', 
                    border: '4px solid #f1f5f9', 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    background: '#0f172a',
                    boxShadow: '0 12px 24px -8px rgba(15, 23, 42, 0.2)' 
                  }}>
                    <video controls src={selectedReporter.videoUrl} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              )}

              {/* Already Approved Details */}
              {selectedReporter.status === 'Approved' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                  {selectedReporter.joiningLetter && (
                    <div style={{ 
                      background: '#ecfdf5', 
                      border: '1px solid #a7f3d0', 
                      padding: '20px', 
                      borderRadius: '16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: '#d1fae5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}>
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#065f46', display: 'block', marginBottom: '2px' }}>सत्यापित एवं सक्रिय संवाददाता</span>
                        <a 
                          href={selectedReporter.joiningLetter} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            fontSize: '13.5px', 
                            color: '#047857', 
                            fontWeight: 700, 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          <span>View Official Signed Joining Letter</span>
                          <i className="fas fa-external-link-alt" style={{ fontSize: '11px' }}></i>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Press ID Card Download Box */}
                  <div style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.03)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#f1f5f9',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      <i className="fas fa-id-card"></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: '2px' }}>Press Identity Card (पहचान पत्र)</span>
                      <button 
                        onClick={() => setIsIDCardModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4f46e5',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '13.5px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: 0
                        }}
                      >
                        <span>View & Download Identity Card</span>
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleSuspendReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                      }}
                      disabled={isSuspending}
                    >
                      <i className="fas fa-ban"></i> 
                      <span>{isSuspending ? 'Blocking Account...' : 'Block / Suspend Correspondent Profile'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Already Rejected Details */}
              {selectedReporter.status === 'Rejected' && selectedReporter.rejectionReason && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fee2e2', 
                  padding: '20px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)',
                  borderTop: '1px solid #f1f5f9',
                  marginTop: '24px',
                  paddingTop: '20px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    <i className="fas fa-times-circle"></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: '2px' }}>KYC Submission Rejected</span>
                    <span style={{ fontSize: '13.5px', color: '#7f1d1d', fontWeight: 500 }}>
                      Reason for disapproval: <b style={{ fontWeight: 700 }}>{selectedReporter.rejectionReason}</b>
                    </span>
                  </div>
                </div>
              )}

              {/* Already Suspended Details */}
              {selectedReporter.status === 'Suspended' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                  <div style={{ 
                    background: '#fef2f2', 
                    border: '1px solid #fee2e2', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.05)'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#991b1b', display: 'block', marginBottom: '2px' }}>संवाददाता खाता निलंबित</span>
                      <span style={{ fontSize: '13.5px', color: '#7f1d1d', fontWeight: 500 }}>
                        This profile is currently blocked from writing articles, submitting news, and using their dashboard.
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleDeleteReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                      }}
                      disabled={isDeleting || isReactivating}
                    >
                      <i className="fas fa-trash-alt"></i> 
                      <span>{isDeleting ? 'Deleting Profile...' : 'Delete Profile'}</span>
                    </button>

                    <button 
                      onClick={handleReactivateReporter} 
                      style={{ 
                        padding: '12px 24px', 
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                        color: '#ffffff', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                      }}
                      disabled={isReactivating || isDeleting}
                    >
                      <i className="fas fa-check-circle"></i> 
                      <span>{isReactivating ? 'Unblocking Account...' : 'Unblock & Reactivate Profile'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Review */}
              {selectedReporter.status === 'Pending' && !showRejectForm && !showApproveForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  gap: '16px', 
                  justifyContent: 'flex-end',
                  marginTop: '12px'
                }}>
                  <button 
                    onClick={() => setShowRejectForm(true)} 
                    style={{
                      background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
                      border: '1px solid #fca5a5',
                      color: '#b91c1c',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-ban"></i> 
                    <span>Disapprove / Reject KYC</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowApproveForm(true)} 
                    style={{ 
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px 24px', 
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', 
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                    }}
                  >
                    <i className="fas fa-check-double"></i> 
                    <span>Approve & Sign Contract</span>
                  </button>
                </div>
              )}

              {/* Rejection Form Dialog */}
              {showRejectForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-exclamation-circle" style={{ color: '#dc2626', fontSize: '18px' }}></i>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Rejection Statement / Reason
                    </label>
                  </div>
                  
                  <textarea 
                    className={styles.formTextarea} 
                    style={{ 
                      minHeight: '100px',
                      borderRadius: '12px',
                      border: '1px solid #fca5a5',
                      background: '#fff8f8',
                      padding: '14px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific details about why the KYC is rejected (e.g. invalid Aadhaar photo, unclear video) so the reporter can re-upload correct information..."
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                      onClick={() => setShowRejectForm(false)} 
                      style={{
                        padding: '10px 20px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRejectKYC} 
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)',
                      }}
                      disabled={isRejecting}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Reject & Notify'}
                    </button>
                  </div>
                </div>
              )}

              {/* Approval Form (PDF Auto-Generate or Upload) Dialog */}
              {/* Approval Form (PDF Auto-Generate or Upload) Dialog */}
              {showApproveForm && (
                <div style={{ 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-file-signature" style={{ color: '#10b981', fontSize: '18px' }}></i>
                      <label style={{ fontSize: '14px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Approve & Generate Appointment Letter
                      </label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setUseAutoGenerate(!useAutoGenerate);
                        if (previewPdfUrl) {
                          URL.revokeObjectURL(previewPdfUrl);
                          setPreviewPdfUrl(null);
                          setPreviewPdfBlob(null);
                        }
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 12px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {useAutoGenerate ? 'Upload Custom PDF Instead' : 'Auto-Generate PDF Letter Instead'}
                    </button>
                  </div>

                  {useAutoGenerate ? (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #a7f3d0',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      textAlign: 'left'
                    }}>
                      <div style={{ fontSize: '13px', color: '#0f5132', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fas fa-magic"></i>
                        <span>System will automatically generate a styled A4 Letterhead Appointment Letter with official Terms & Conditions.</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>पिता / पति का नाम (Father/Husband Name) <span style={{ color: '#dc2626' }}>*</span></label>
                          <input 
                            type="text" 
                            value={fatherHusbandName}
                            onChange={(e) => {
                              setFatherHusbandName(e.target.value);
                              if (previewPdfUrl) {
                                URL.revokeObjectURL(previewPdfUrl);
                                setPreviewPdfUrl(null);
                                setPreviewPdfBlob(null);
                              }
                            }}
                            placeholder="Type father/husband name..."
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13.5px',
                              outline: 'none',
                              color: '#1e293b'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>नियुक्ति तिथि (Probation Start Date) <span style={{ color: '#dc2626' }}>*</span></label>
                          <input 
                            type="text" 
                            value={probationStartDate}
                            onChange={(e) => {
                              setProbationStartDate(e.target.value);
                              if (previewPdfUrl) {
                                URL.revokeObjectURL(previewPdfUrl);
                                setPreviewPdfUrl(null);
                                setPreviewPdfBlob(null);
                              }
                            }}
                            placeholder="DD-MM-YYYY"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13.5px',
                              outline: 'none',
                              color: '#1e293b'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      border: '2px dashed #a7f3d0',
                      borderRadius: '16px',
                      padding: '24px',
                      background: '#f0fdf4',
                      textAlign: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={(e) => handleCustomPdfChange(e.target.files?.[0] || null)} 
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                      />
                      <div style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px' }}>
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      {joiningLetterFile ? (
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', display: 'block' }}>
                            Selected: {joiningLetterFile.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#059669', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fas fa-check-circle"></i> File loaded and ready for preview
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151', display: 'block' }}>
                            Click here or drag-and-drop the signing contract
                          </span>
                          <span style={{ fontSize: '12.5px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                            Only PDF documents are supported for official letters
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions for Auto-Generate Preview */}
                  {useAutoGenerate && !previewPdfUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleGeneratePreview}
                        disabled={isPreviewLoading}
                        style={{
                          padding: '12px 28px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {isPreviewLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Generating Appointment Letter...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic"></i> Generate & Preview Letter
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* PDF Document Preview Panel */}
                  {previewPdfUrl && (
                    <div style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      background: '#f8fafc',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginTop: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fas fa-eye" style={{ color: '#10b981' }}></i>
                          Preview Appointment Letter:
                        </span>
                        <a 
                          href={previewPdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: '#2563eb', 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-external-link-alt"></i> Open in New Tab
                        </a>
                      </div>
                      
                      <iframe 
                        src={previewPdfUrl} 
                        style={{ 
                          width: '100%', 
                          height: '450px', 
                          border: '1px solid #cbd5e1', 
                          borderRadius: '10px',
                          background: '#ffffff',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                        }} 
                        title="Letter Preview"
                      />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <button 
                      onClick={() => {
                        setShowApproveForm(false);
                        if (previewPdfUrl) {
                          URL.revokeObjectURL(previewPdfUrl);
                          setPreviewPdfUrl(null);
                          setPreviewPdfBlob(null);
                        }
                      }} 
                      style={{
                        padding: '10px 20px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleApproveKYC} 
                      style={{ 
                        padding: '10px 20px',
                        background: previewPdfBlob 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                          : '#cbd5e1', 
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: previewPdfBlob ? 'pointer' : 'not-allowed',
                        boxShadow: previewPdfBlob ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none',
                      }}
                      disabled={isApproving || !previewPdfBlob}
                    >
                      {isApproving ? 'Approving & Publishing...' : 'Confirm Approve & Publish'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Chat Workspace (40% width, only visible when open) */}
            {isAdminChatOpen && (
              <div style={{
                width: '40%',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#f8fafc',
                borderLeft: '1px solid #e2e8f0',
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '16px 24px',
                  background: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: selectedReporter.status === 'Approved' ? '#10b981' : selectedReporter.status === 'Pending' ? '#3b82f6' : '#94a3b8',
                    }} />
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'block' }}>
                        Support Channel
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        Direct line to {selectedReporter.fullName}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const messages = await getReporterMessages(selectedReporter.id);
                      setAdminChatMessages(messages);
                      await markReporterMessagesAsRead(selectedReporter.id, 'Admin');
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#64748b',
                      transition: 'all 0.2s',
                    }}
                    title="Refresh Chat"
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>

                {/* Chat Messages Body */}
                <div 
                  id="adminChatMessagesBody"
                  style={{
                    flexGrow: 1,
                    padding: '24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#f8fafc',
                  }}
                >
                  {adminChatMessages.length === 0 ? (
                    <div style={{
                      margin: 'auto',
                      textAlign: 'center',
                      padding: '0 20px',
                    }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#eeebff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        margin: '0 auto 16px auto',
                      }}>
                        <i className="fas fa-comments"></i>
                      </div>
                      <h5 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                        No Messages Yet
                      </h5>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Send a message to the reporter to initiate the conversation regarding their KYC or reports.
                      </p>
                    </div>
                  ) : (
                    adminChatMessages.map((msg) => {
                      const isAdmin = msg.sender === 'Admin';
                      return (
                        <div 
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdmin ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isAdmin ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#ffffff',
                            color: isAdmin ? '#ffffff' : '#1e293b',
                            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                            border: isAdmin ? 'none' : '1px solid #e2e8f0',
                            fontSize: '13.5px',
                            fontWeight: 500,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}>
                            {msg.message}
                          </div>
                          <span style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '4px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isAdmin && (
                              <i 
                                className={`fas ${msg.isRead ? 'fa-check-double' : 'fa-check'}`}
                                style={{ color: msg.isRead ? '#10b981' : '#cbd5e1', fontSize: '9px' }}
                              />
                            )}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Chat Input Footer */}
                <form 
                  onSubmit={handleSendAdminChatMessage}
                  style={{
                    padding: '16px 20px',
                    background: '#ffffff',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSendingAdminMessage}
                    style={{
                      flexGrow: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      background: '#f8fafc',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim() || isSendingAdminMessage}
                    style={{
                      background: adminChatInput.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#f1f5f9',
                      color: adminChatInput.trim() ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '12px',
                      width: '42px',
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      cursor: adminChatInput.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      boxShadow: adminChatInput.trim() ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                    }}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    )}

    {/* ID CARD DOWNLOAD PORTAL */}
    {isIDCardModalOpen && selectedReporter && (
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
                  src={selectedReporter.photoUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23cbd5e1"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`}
                  alt={selectedReporter.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Basic Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>NAME</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{selectedReporter.fullName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>DESIGNATION</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b' }}>
                    {selectedReporter.role === 'BLOCK_CORRESPONDENT' ? 'Block Correspondent' : 
                     selectedReporter.role === 'DISTRICT_CORRESPONDENT' ? 'District Correspondent' : 
                     selectedReporter.role === 'STATE_CORRESPONDENT' ? 'State Correspondent' : 
                     selectedReporter.role === 'DISTRICT_AD_INCHARGE' ? 'District Ad In-charge' : 
                     selectedReporter.role === 'SANTHAL_PARGANA_AD_INCHARGE' ? 'Santhal Pargana Ad In-charge' : 
                     selectedReporter.role === 'STATE_AD_INCHARGE' ? 'State Ad In-charge' : 
                     selectedReporter.role}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>REPORTER CODE</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8' }}>{selectedReporter.reporterCode || 'TDA/TEMP'}</div>
                </div>
              </div>
            </div>

            {/* Geographic coverage details & QR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '9px', color: '#cbd5e1', flex: 1 }}>
                <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>State:</span> {selectedReporter.state}</div>
                {selectedReporter.role !== 'STATE_CORRESPONDENT' && selectedReporter.role !== 'STATE_AD_INCHARGE' && selectedReporter.role !== 'SANTHAL_PARGANA_AD_INCHARGE' && <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>District:</span> {selectedReporter.district}</div>}
                {selectedReporter.role === 'BLOCK_CORRESPONDENT' && <div><span style={{ fontWeight: 600, color: '#94a3b8' }}>Block:</span> {selectedReporter.block}</div>}
                <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>Blood: <span style={{ color: '#ef4444', fontWeight: 700 }}>{selectedReporter.bloodGroup || 'N/A'}</span></div>
              </div>
              {/* QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ background: '#ffffff', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://www.thedesiandaz.com/correspondent-verification?code=' + (selectedReporter.reporterCode || selectedReporter.id))}`}
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
                <div>Issued: {new Date(selectedReporter.createdAt).toLocaleDateString()}</div>
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
  );
}
