'use client';

import React, { useState, useTransition } from 'react';
import { createAdCategory, deleteAdCategory, upsertBanner, deleteBanner } from '@/actions/ads';
import {
  getAdClients,
  createAdClient,
  updateAdClient,
  deleteAdClient,
  getClientAds,
  createClientAd,
  updateClientAd,
  deleteClientAd,
  toggleClientAdActive,
  resetClientAdStats
} from '@/actions/client-ads';
import { stateDistricts, allStates } from '@/lib/localization';
import styles from '../admin.module.css';

type Banner = {
  id: string;
  categoryId: string;
  type: string;
  position: number;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type AdCategory = {
  id: string;
  name: string;
  banners: Banner[];
  createdAt: Date;
  updatedAt: Date;
};

type ClientAd = {
  id: string;
  clientId: string;
  title: string;
  categoryName: string;
  position: number;
  desktopImgUrl: string | null;
  mobileImgUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  impressions: number;
  clicks: number;
  
  targetType: string;
  targetStates: string | null;
  targetDistricts: string | null;
  targetLat: number | null;
  targetLng: number | null;
  targetRadius: number | null;
  
  createdAt: Date;
  updatedAt: Date;
  client?: AdClient;
};

type AdClient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  ads: ClientAd[];
  createdAt: Date;
  updatedAt: Date;
};

type AdminAdsDashboardClientProps = {
  initialCategories: AdCategory[];
  initialClients: AdClient[];
};

export default function AdminAdsDashboardClient({
  initialCategories,
  initialClients
}: AdminAdsDashboardClientProps) {
  const [categories, setCategories] = useState<AdCategory[]>(initialCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategories[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');
  const [isPending, startTransition] = useTransition();
  const [newCategoryName, setNewCategoryName] = useState('');

  // Mode Switcher: 'simple' vs 'advance'
  const [dashboardMode, setDashboardMode] = useState<'simple' | 'advance'>('simple');
  
  // Advance Sub-Tabs: 'clients' vs 'campaigns'
  const [advanceSubTab, setAdvanceSubTab] = useState<'clients' | 'campaigns'>('clients');

  // Clients Directory State
  const [clients, setClients] = useState<AdClient[]>(initialClients);
  const [editingClient, setEditingClient] = useState<AdClient | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Campaigns State
  const [allAds, setAllAds] = useState<ClientAd[]>(() => {
    const adsList: ClientAd[] = [];
    initialClients.forEach(c => {
      c.ads.forEach(ad => {
        adsList.push({
          ...ad,
          client: c
        });
      });
    });
    return adsList;
  });

  const [editingAd, setEditingAd] = useState<ClientAd | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [adClientId, setAdClientId] = useState('');
  const [adCategoryName, setAdCategoryName] = useState('Home');
  const [adPosition, setAdPosition] = useState(1);
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adStartDate, setAdStartDate] = useState('');
  const [adEndDate, setAdEndDate] = useState('');
  const [adIsActive, setAdIsActive] = useState(true);
  const [adDesktopImg, setAdDesktopImg] = useState<string | null>(null);
  const [adMobileImg, setAdMobileImg] = useState<string | null>(null);
  const [isAdFormOpen, setIsAdFormOpen] = useState(false);

  // Geotargeting states
  const [adTargetType, setAdTargetType] = useState('All');
  const [adTargetStates, setAdTargetStates] = useState<string[]>([]);
  const [adTargetDistricts, setAdTargetDistricts] = useState<string[]>([]);
  const [adTargetLat, setAdTargetLat] = useState('');
  const [adTargetLng, setAdTargetLng] = useState('');
  const [adTargetRadius, setAdTargetRadius] = useState('');
  const [adTargetSelectedState, setAdTargetSelectedState] = useState('');

  // Geocode Search states
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState('');
  const [geocodeError, setGeocodeError] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Dynamic recommendation engine for campaign uploads
  const getAdSizeRecommendation = (category: string, pos: number, device: 'desktop' | 'mobile') => {
    const isNews = category.trim().toLowerCase() === 'news';
    if (device === 'desktop') {
      if (pos === 1) return '970 x 250 px';
      if (pos === 2) return isNews ? '250 x 90 px' : '728 x 90 px';
      if (pos === 3) return '300 x 250 px';
      if (pos === 4) return '970 x 250 px';
      return '970 x 250 px';
    } else {
      if (pos === 1) return '320 x 100 px';
      if (pos === 2) return isNews ? '250 x 90 px' : '300 x 250 px';
      if (pos === 3) return '320 x 50 px';
      if (pos === 4) return '320 x 50 px';
      return '320 x 50 px';
    }
  };

  // ── Simple Mode Handlers ──────────────────────────────────────────────────

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    startTransition(async () => {
      const res = await createAdCategory(newCategoryName);
      if (res.success) {
        setNewCategoryName('');
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its banners?')) return;
    startTransition(async () => {
      const res = await deleteAdCategory(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  const handleUpsertBanner = async (e: React.FormEvent<HTMLFormElement>, position: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('categoryId', selectedCategoryId!);
    formData.append('type', activeTab);
    formData.append('position', position.toString());

    startTransition(async () => {
      const res = await upsertBanner(formData);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    startTransition(async () => {
      const res = await deleteBanner(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  // ── Advance Mode: Client CRUD Handlers ─────────────────────────────────────

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    startTransition(async () => {
      if (editingClient) {
        const res = await updateAdClient(editingClient.id, {
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          notes: clientNotes
        });
        if (res.success) {
          window.location.reload();
        } else {
          alert('Error: ' + res.error);
        }
      } else {
        const res = await createAdClient({
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          notes: clientNotes
        });
        if (res.success) {
          window.location.reload();
        } else {
          alert('Error: ' + res.error);
        }
      }
    });
  };

  const handleEditClientClick = (client: AdClient) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientEmail(client.email || '');
    setClientPhone(client.phone || '');
    setClientNotes(client.notes || '');
  };

  const handleResetClientForm = () => {
    setEditingClient(null);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setClientNotes('');
  };

  const handleDeleteClientClick = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this client and all their active advertising campaigns?')) return;
    startTransition(async () => {
      const res = await deleteAdClient(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert('Error: ' + res.error);
      }
    });
  };

  // ── Advance Mode: Campaigns CRUD Handlers ──────────────────────────────────

  const handleImageReader = (e: React.ChangeEvent<HTMLInputElement>, type: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'desktop') {
          setAdDesktopImg(reader.result as string);
        } else {
          setAdMobileImg(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenNewAdForm = () => {
    setEditingAd(null);
    setAdTitle('');
    setAdClientId(clients[0]?.id || '');
    setAdCategoryName('Home');
    setAdPosition(1);
    setAdLinkUrl('');
    setAdStartDate('');
    setAdEndDate('');
    setAdIsActive(true);
    setAdDesktopImg(null);
    setAdMobileImg(null);
    
    setAdTargetType('All');
    setAdTargetStates([]);
    setAdTargetDistricts([]);
    setAdTargetLat('');
    setAdTargetLng('');
    setAdTargetRadius('');
    setAdTargetSelectedState('');
    setGeoSearchQuery('');
    setGeocodeResult('');
    setGeocodeError('');
    setIsAdFormOpen(true);
  };

  const handleEditAdClick = (ad: ClientAd) => {
    setEditingAd(ad);
    setAdTitle(ad.title);
    setAdClientId(ad.clientId);
    setAdCategoryName(ad.categoryName);
    setAdPosition(ad.position);
    setAdLinkUrl(ad.linkUrl || '');
    setAdStartDate(ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : '');
    setAdEndDate(ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : '');
    setAdIsActive(ad.isActive);
    setAdDesktopImg(ad.desktopImgUrl);
    setAdMobileImg(ad.mobileImgUrl);
    
    setAdTargetType(ad.targetType || 'All');
    
    // Parse States
    let parsedStates: string[] = [];
    if (ad.targetStates) {
      try {
        parsedStates = JSON.parse(ad.targetStates);
      } catch (e) {
        console.error(e);
      }
    }
    setAdTargetStates(parsedStates);
    setAdTargetSelectedState(parsedStates[0] || '');

    // Parse Districts
    let parsedDistricts: string[] = [];
    if (ad.targetDistricts) {
      try {
        parsedDistricts = JSON.parse(ad.targetDistricts);
      } catch (e) {
        console.error(e);
      }
    }
    setAdTargetDistricts(parsedDistricts);

    setAdTargetLat(ad.targetLat !== null ? ad.targetLat.toString() : '');
    setAdTargetLng(ad.targetLng !== null ? ad.targetLng.toString() : '');
    setAdTargetRadius(ad.targetRadius !== null ? ad.targetRadius.toString() : '');
    setGeoSearchQuery('');
    setGeocodeResult('');
    setGeocodeError('');

    setIsAdFormOpen(true);
  };

  const handleGeocodeSearch = async () => {
    if (!geoSearchQuery.trim()) return;
    setIsGeocoding(true);
    setGeocodeError('');
    setGeocodeResult('');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(geoSearchQuery)}&format=json&limit=1`, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'TheDesiAndazAdServer/1.0 (contact: admin@thedesiandaz.com)'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          setAdTargetLat(parseFloat(item.lat).toFixed(6));
          setAdTargetLng(parseFloat(item.lon).toFixed(6));
          setGeocodeResult(`📍 Found: ${item.display_name}`);
        } else {
          setGeocodeError('Could not find coordinates for this place. Please try adding city or state name.');
        }
      } else {
        setGeocodeError('Failed to contact location database.');
      }
    } catch (e) {
      console.error(e);
      setGeocodeError('An error occurred during place lookup.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adClientId) {
      alert('Please fill out Title and Client fields.');
      return;
    }

    startTransition(async () => {
      const payload = {
        clientId: adClientId,
        title: adTitle,
        categoryName: adCategoryName,
        position: adPosition,
        desktopImgUrl: adDesktopImg,
        mobileImgUrl: adMobileImg,
        linkUrl: adLinkUrl,
        isActive: adIsActive,
        startDate: adStartDate ? new Date(adStartDate) : null,
        endDate: adEndDate ? new Date(adEndDate) : null,
        
        targetType: adTargetType,
        targetStates: adTargetType === 'State' ? JSON.stringify(adTargetStates) : null,
        targetDistricts: adTargetType === 'District' ? JSON.stringify(adTargetDistricts) : null,
        targetLat: adTargetType === 'Radius' && adTargetLat ? parseFloat(adTargetLat) : null,
        targetLng: adTargetType === 'Radius' && adTargetLng ? parseFloat(adTargetLng) : null,
        targetRadius: adTargetType === 'Radius' && adTargetRadius ? parseFloat(adTargetRadius) : null,
      };

      if (editingAd) {
        const res = await updateClientAd(editingAd.id, payload);
        if (res.success) {
          window.location.reload();
        } else {
          alert('Error updating campaign: ' + res.error);
        }
      } else {
        const res = await createClientAd(payload);
        if (res.success) {
          window.location.reload();
        } else {
          alert('Error creating campaign: ' + res.error);
        }
      }
    });
  };

  const handleDeleteAdClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign ad?')) return;
    startTransition(async () => {
      const res = await deleteClientAd(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert('Error deleting campaign: ' + res.error);
      }
    });
  };

  const handleToggleAdStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleClientAdActive(id, !currentStatus);
      if (res.success) {
        window.location.reload();
      } else {
        alert('Error toggling status: ' + res.error);
      }
    });
  };

  const handleResetAdStats = async (id: string) => {
    if (!confirm('Reset impression and click analytics to 0 for this campaign?')) return;
    startTransition(async () => {
      const res = await resetClientAdStats(id);
      if (res.success) {
        window.location.reload();
      } else {
        alert('Error resetting stats: ' + res.error);
      }
    });
  };

  const getCampaignStatusLabel = (ad: ClientAd) => {
    if (!ad.isActive) return { text: 'PAUSED', bg: '#f1f5f9', color: '#64748b' };
    const now = new Date();
    if (ad.startDate && new Date(ad.startDate) > now) {
      return { text: 'SCHEDULED', bg: '#fff7ed', color: '#ea580c' };
    }
    if (ad.endDate && new Date(ad.endDate) < now) {
      return { text: 'EXPIRED', bg: '#fef2f2', color: '#dc2626' };
    }
    return { text: 'RUNNING', bg: '#ecfdf5', color: '#16a34a' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* MODE TABS SWITCHER */}
      <div style={{
        display: 'flex',
        background: '#ffffff',
        borderRadius: '14px',
        padding: '6px',
        gap: '8px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)',
        width: 'fit-content',
        alignSelf: 'flex-start',
        marginBottom: '4px'
      }}>
        <button
          onClick={() => setDashboardMode('simple')}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            background: dashboardMode === 'simple' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'transparent',
            color: dashboardMode === 'simple' ? '#ffffff' : '#64748b',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: dashboardMode === 'simple' ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none'
          }}
        >
          <i className="fas fa-th-large" style={{ fontSize: '15px' }}></i> Simple Banner Slots
        </button>
        <button
          onClick={() => setDashboardMode('advance')}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            background: dashboardMode === 'advance' ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' : 'transparent',
            color: dashboardMode === 'advance' ? '#ffffff' : '#64748b',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: dashboardMode === 'advance' ? '0 4px 14px rgba(99, 102, 241, 0.25)' : 'none'
          }}
        >
          <i className="fas fa-server" style={{ fontSize: '15px' }}></i> Premium Client Ads Server
          <span style={{
            fontSize: '9px',
            background: dashboardMode === 'advance' ? '#ffffff' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: dashboardMode === 'advance' ? '#4f46e5' : '#ffffff',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: 800,
            marginLeft: '4px',
            letterSpacing: '0.5px'
          }}>NEW Core</span>
        </button>
      </div>

      {/* ── SIMPLE SLOTS MODE ── */}
      {dashboardMode === 'simple' && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Sidebar: Categories */}
          <div style={{
            width: '260px',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-tags" style={{ color: '#4f46e5' }}></i> Ad Categories
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: selectedCategoryId === cat.id ? 'linear-gradient(135deg, #f5f3ff 0%, #edd9ff 100%)' : '#f8fafc',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedCategoryId === cat.id ? '1px solid #d8b4fe' : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <span style={{ fontWeight: selectedCategoryId === cat.id ? 700 : 500, color: selectedCategoryId === cat.id ? '#6b21a8' : '#475569', fontSize: '13px' }}>
                    {cat.name}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
                    disabled={isPending}
                  >
                    <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              ))}
              {categories.length === 0 && <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '10px' }}>No categories.</div>}
            </div>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <input 
                type="text" 
                placeholder="New Category Name" 
                list="page-suggestions"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none', background: '#f8fafc' }}
                disabled={isPending}
              />
              <datalist id="page-suggestions">
                <option value="Home" />
                <option value="News" />
                <option value="Latest" />
                <option value="State" />
                <option value="LiveTV" />
                <option value="Contact" />
                <option value="About" />
                <option value="Global" />
              </datalist>
              <button
                type="submit"
                style={{
                  width: '100%',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
                }}
                disabled={isPending}
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Main Content: Banners */}
          <div style={{
            flex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08)'
          }}>
            {!selectedCategory ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '60px 40px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <i className="fas fa-image" style={{ fontSize: '32px', color: '#94a3b8', marginBottom: '12px', display: 'block' }}></i>
                Select or create a category to manage its banners.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-folder-open" style={{ color: '#8b5cf6' }}></i> Managing: {selectedCategory.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                    <button 
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'desktop' ? '#ffffff' : 'transparent',
                        color: activeTab === 'desktop' ? '#1e293b' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        boxShadow: activeTab === 'desktop' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => setActiveTab('desktop')}
                    >
                      <i className="fas fa-desktop" style={{ fontSize: '13px' }}></i> Desktop Banners
                    </button>
                    <button 
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: activeTab === 'mobile' ? '#ffffff' : 'transparent',
                        color: activeTab === 'mobile' ? '#1e293b' : '#64748b',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        boxShadow: activeTab === 'mobile' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => setActiveTab('mobile')}
                    >
                      <i className="fas fa-mobile-alt" style={{ fontSize: '13px' }}></i> Mobile Banners
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {[1, 2, 3, 4].map(pos => {
                    const existingBanner = selectedCategory.banners.find(b => b.type === activeTab && b.position === pos);
                    
                    let recommendedSize = '';
                    if (activeTab === 'desktop') {
                      if (pos === 1) recommendedSize = '970x250';
                      else if (pos === 2) {
                        recommendedSize = selectedCategory.name === 'News' ? '250x90' : '728x90';
                      }
                      else if (pos === 3) recommendedSize = '300x250';
                      else if (pos === 4) recommendedSize = '970x250';
                    } else {
                      if (pos === 1) recommendedSize = '320x100';
                      else if (pos === 2) {
                        recommendedSize = selectedCategory.name === 'News' ? '250x90' : '300x250';
                      }
                      else if (pos === 3) recommendedSize = '320x50';
                      else if (pos === 4) recommendedSize = '320x50';
                    }
                    
                    return (
                      <div key={`${activeTab}-${pos}`} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>Slot {pos}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>Rec: {recommendedSize}</span>
                        </h4>
                        
                        {existingBanner?.imageUrl && (
                          <div style={{ 
                            marginBottom: '16px', 
                            height: '110px', 
                            background: '#f8fafc', 
                            border: '1px dashed #cbd5e1', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            borderRadius: '6px',
                            padding: '6px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                          }}>
                            <img 
                              src={existingBanner.imageUrl} 
                              alt={`Slot ${pos}`} 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                              }} 
                            />
                          </div>
                        )}

                        <form onSubmit={(e) => handleUpsertBanner(e, pos)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Image File</label>
                            <input type="file" name="imageFile" accept="image/*" style={{ fontSize: '12px' }} disabled={isPending} />
                          </div>
                          
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Link URL (Optional)</label>
                            <input type="url" name="linkUrl" defaultValue={existingBanner?.linkUrl || ''} placeholder="https://..." style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} disabled={isPending} />
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" name="isActive" id={`active-${pos}`} defaultChecked={existingBanner ? existingBanner.isActive : true} disabled={isPending} />
                            <label htmlFor={`active-${pos}`} style={{ fontSize: '13px', color: '#475569' }}>Enable this banner</label>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="submit" className={styles.btnPrimary} style={{ flex: 1, padding: '8px', fontSize: '13px', background: '#dc2626', border: '1px solid #b91c1c' }} disabled={isPending}>
                              {existingBanner ? 'Update & Publish' : 'Publish Banner'}
                            </button>
                            {existingBanner && (
                              <button type="button" onClick={() => handleDeleteBanner(existingBanner.id)} style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }} disabled={isPending}>
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADVANCED MULTI-CLIENT MODE ── */}
      {dashboardMode === 'advance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Sub-tab Selection */}
          <div style={{
            display: 'flex',
            gap: '6px',
            background: '#f8fafc',
            padding: '5px',
            borderRadius: '12px',
            width: 'fit-content',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
          }}>
            <button
              onClick={() => setAdvanceSubTab('clients')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: advanceSubTab === 'clients' ? '#ffffff' : 'transparent',
                color: advanceSubTab === 'clients' ? '#4f46e5' : '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: advanceSubTab === 'clients' ? '0 4px 12px -2px rgba(79, 70, 229, 0.12), 0 2px 4px -1px rgba(79, 70, 229, 0.04)' : 'none',
                border: advanceSubTab === 'clients' ? '1px solid #e0e7ff' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-users" style={{ color: advanceSubTab === 'clients' ? '#4f46e5' : '#64748b' }}></i> Clients Directory
            </button>
            <button
              onClick={() => setAdvanceSubTab('campaigns')}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: advanceSubTab === 'campaigns' ? '#ffffff' : 'transparent',
                color: advanceSubTab === 'campaigns' ? '#4f46e5' : '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: advanceSubTab === 'campaigns' ? '0 4px 12px -2px rgba(79, 70, 229, 0.12), 0 2px 4px -1px rgba(79, 70, 229, 0.04)' : 'none',
                border: advanceSubTab === 'campaigns' ? '1px solid #e0e7ff' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <i className="fas fa-chart-line" style={{ color: advanceSubTab === 'campaigns' ? '#4f46e5' : '#64748b' }}></i> Campaigns & Live Analytics
            </button>
          </div>

          {/* SUBTAB 1: CLIENTS DIRECTORY */}
          {advanceSubTab === 'clients' && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* Client Add/Edit form */}
              <div style={{
                width: '340px',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.05)'
              }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingClient ? (
                    <>✏️ Edit Client Profile</>
                  ) : (
                    <><i className="fas fa-user-plus" style={{ color: '#4f46e5' }}></i> Add New Client</>
                  )}
                </h3>
                
                <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Client Name / Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Jio Infocomm, Client ABC"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 99999-99999"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Internal Admin Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Premium client, billing cycle monthly..."
                      value={clientNotes}
                      onChange={e => setClientNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button type="submit" className={styles.btnPrimary} style={{ flex: 1, fontSize: '13px' }} disabled={isPending}>
                      {editingClient ? 'Save Profile' : 'Add Client'}
                    </button>
                    {editingClient && (
                      <button
                        type="button"
                        onClick={handleResetClientForm}
                        style={{ padding: '8px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Client List */}
              <div style={{
                flex: 1,
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.05)'
              }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-users" style={{ color: '#4f46e5' }}></i> Clients Directory ({clients.length})
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Client Name</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Contact Details</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Active Ads</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Agg. Impressions</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Agg. Clicks</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            No clients created yet. Add a client using the form on the left.
                          </td>
                        </tr>
                      ) : (
                        clients.map(client => {
                          const aggImpressions = client.ads.reduce((acc, ad) => acc + ad.impressions, 0);
                          const aggClicks = client.ads.reduce((acc, ad) => acc + ad.clicks, 0);
                          return (
                            <tr key={client.id} style={{
                              background: '#f8fafc',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01)',
                              borderRadius: '8px'
                            }}>
                              <td style={{ padding: '14px 16px', fontWeight: 'bold', color: '#1e293b', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', border: '1px solid #e2e8f0', borderRight: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}>
                                    {client.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span style={{ fontSize: '14px', color: '#1f2937' }}>{client.name}</span>
                                    {client.notes && (
                                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '400', marginTop: '2px', fontStyle: 'italic' }}>
                                        {client.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {client.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}><i className="far fa-envelope" style={{ color: '#8b5cf6' }}></i> {client.email}</div>}
                                {client.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', marginTop: '4px' }}><i className="fas fa-phone-alt" style={{ color: '#8b5cf6' }}></i> {client.phone}</div>}
                                {!client.email && !client.phone && <span style={{ color: '#cbd5e1' }}>N/A</span>}
                              </td>
                              <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  borderRadius: '20px',
                                  fontSize: '11.5px',
                                  fontWeight: 700
                                }}>
                                  {client.ads.length} campaigns
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 500, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {aggImpressions.toLocaleString()}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 500, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {aggClicks.toLocaleString()}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => handleEditClientClick(client)}
                                    style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Edit Client Profile"
                                  >
                                    <i className="fas fa-edit" style={{ fontSize: '12px' }}></i> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClientClick(client.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Delete Client"
                                    disabled={isPending}
                                  >
                                    <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SUBTAB 2: CAMPAIGNS & LIVE ANALYTICS */}
          {advanceSubTab === 'campaigns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Campaign Table HUD header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '18px 24px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-bullhorn" style={{ color: '#818cf8' }}></i> Client Advertising Campaigns
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Currently hosting {allAds.length} active geofenced or regional marketing campaigns.
                  </span>
                </div>
                <button
                  onClick={handleOpenNewAdForm}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  <i className="fas fa-plus-circle" style={{ fontSize: '14px' }}></i> Create Client Campaign
                </button>
              </div>

              {/* Campaign Form Overlay Modal */}
              {isAdFormOpen && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(15, 23, 42, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                  backdropFilter: 'blur(12px)',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '650px',
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '32px',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(15, 23, 42, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editingAd ? (
                          <>✏️ Edit Campaign Ad</>
                        ) : (
                          <><i className="fas fa-plus-circle" style={{ color: '#4f46e5' }}></i> Create Dynamic Client Campaign</>
                        )}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAdFormOpen(false)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>

                    <form onSubmit={handleSaveAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Campaign Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Summer Promo 2026"
                            value={adTitle}
                            onChange={e => setAdTitle(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Client</label>
                          <select
                            value={adClientId}
                            onChange={e => setAdClientId(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                            required
                          >
                            <option value="">-- Choose Client --</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Slot Category</label>
                          <select
                            value={adCategoryName}
                            onChange={e => setAdCategoryName(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          >
                            <option value="Home">Home</option>
                            <option value="Global">Global (All Pages)</option>
                            <option value="LiveTV">LiveTV</option>
                            <option value="News">News Details</option>
                          </select>
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Slot Position (1-4)</label>
                          <select
                            value={adPosition}
                            onChange={e => setAdPosition(parseInt(e.target.value, 10))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          >
                            <option value={1}>Position 1</option>
                            <option value={2}>Position 2</option>
                            <option value={3}>Position 3</option>
                            <option value={4}>Position 4</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Status</label>
                          <select
                            value={adIsActive ? "true" : "false"}
                            onChange={e => setAdIsActive(e.target.value === "true")}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          >
                            <option value="true">Active / Running</option>
                            <option value="false">Paused / Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Target Destination URL (Redirect Link)</label>
                        <input
                          type="text"
                          placeholder="e.g. www.clientwebsite.com/summer-promo"
                          value={adLinkUrl}
                          onChange={e => setAdLinkUrl(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                        />
                      </div>

                      {/* GEOTARGETING CONTROLS */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '4px' }}>
                          <i className="fas fa-map-marked-alt" style={{ marginRight: '8px', color: '#dc2626' }} />
                          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 'bold', color: '#1e293b' }}>📍 Advanced Ad Geotargeting</h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Target Location Type</label>
                            <select
                              value={adTargetType}
                              onChange={e => {
                                setAdTargetType(e.target.value);
                                setAdTargetStates([]);
                                setAdTargetDistricts([]);
                                setAdTargetLat('');
                                setAdTargetLng('');
                                setAdTargetRadius('');
                                setAdTargetSelectedState('');
                              }}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                            >
                              <option value="All">All India / Global (No Limit)</option>
                              <option value="State">State Specific (राज्य के अनुसार)</option>
                              <option value="District">District Specific (जिला के अनुसार)</option>
                              <option value="Radius">Radius Geofence (दूरी/व्यास के अनुसार)</option>
                            </select>
                          </div>

                          {/* STATE SELECTION */}
                          {adTargetType === 'State' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Select Target States</label>
                              <div style={{
                                maxHeight: '100px',
                                overflowY: 'auto',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '8px',
                                background: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}>
                                {allStates.map(state => {
                                  const checked = adTargetStates.includes(state);
                                  return (
                                    <label key={state} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer', color: '#334155' }}>
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          if (checked) {
                                            setAdTargetStates(adTargetStates.filter(s => s !== state));
                                          } else {
                                            setAdTargetStates([...adTargetStates, state]);
                                          }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                      />
                                      {state}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* DISTRICT SELECTION */}
                          {adTargetType === 'District' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>1. Choose State</label>
                              <select
                                value={adTargetSelectedState}
                                onChange={e => {
                                  setAdTargetSelectedState(e.target.value);
                                  setAdTargetDistricts([]); // reset selected districts when state changes
                                }}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                              >
                                <option value="">-- Choose State --</option>
                                {allStates.map(state => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* RADIUS TARGETING FIELDS */}
                          {adTargetType === 'Radius' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' }}>
                              
                              {/* Search Bar for geocoding */}
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                                  🔍 Find Location by Name / PIN Code (एरिया या पिन कोड खोजें)
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    placeholder="e.g. Ranchi, 834001, Connaught Place, etc."
                                    value={geoSearchQuery}
                                    onChange={e => setGeoSearchQuery(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleGeocodeSearch();
                                      }
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '8px 12px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      outline: 'none',
                                      background: '#fff',
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={handleGeocodeSearch}
                                    disabled={isGeocoding}
                                    style={{
                                      padding: '8px 14px',
                                      background: isGeocoding ? '#94a3b8' : 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '12.5px',
                                      fontWeight: 600,
                                      cursor: isGeocoding ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s',
                                      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                                    }}
                                  >
                                    {isGeocoding ? 'Searching...' : 'Find Place'}
                                  </button>
                                </div>
                                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                  Tip: Enter city name or Pin code and click Find Place to auto-fill coordinates.
                                </span>
                              </div>

                              {/* Search Results / Status Notifications */}
                              {geocodeResult && (
                                <div style={{
                                  padding: '8px 12px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#166534',
                                  fontWeight: 500,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  wordBreak: 'break-word'
                                }}>
                                  {geocodeResult}
                                </div>
                              )}

                              {geocodeError && (
                                <div style={{
                                  padding: '8px 12px',
                                  background: '#fef2f2',
                                  border: '1px solid #fee2e2',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#991b1b',
                                  fontWeight: 500,
                                  wordBreak: 'break-word'
                                }}>
                                  ⚠️ {geocodeError}
                                </div>
                              )}

                              {/* Coordinate Input Fields Row */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Latitude</label>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 23.34"
                                    value={adTargetLat}
                                    onChange={e => setAdTargetLat(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', background: '#fff' }}
                                    required
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Longitude</label>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 85.30"
                                    value={adTargetLng}
                                    onChange={e => setAdTargetLng(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', background: '#fff' }}
                                    required
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Radius (KM)</label>
                                  <input
                                    type="number"
                                    placeholder="e.g. 10"
                                    value={adTargetRadius}
                                    onChange={e => setAdTargetRadius(e.target.value)}
                                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12.5px', outline: 'none', background: '#fff' }}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                        </div>

                        {/* DISTRICTS LIST MULTIPLE CHECKLIST */}
                        {adTargetType === 'District' && adTargetSelectedState && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                              2. Select Districts in {adTargetSelectedState} (Multi-select)
                            </label>
                            <div style={{
                              maxHeight: '120px',
                              overflowY: 'auto',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '8px',
                              background: '#fff',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                              gap: '8px'
                            }}>
                              {(stateDistricts[adTargetSelectedState] || []).map(dist => {
                                const checked = adTargetDistricts.includes(dist);
                                return (
                                  <label key={dist} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#334155' }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        if (checked) {
                                          setAdTargetDistricts(adTargetDistricts.filter(d => d !== dist));
                                        } else {
                                          setAdTargetDistricts([...adTargetDistricts, dist]);
                                        }
                                      }}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    {dist}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Schedule Start (Optional)</label>
                          <input
                            type="datetime-local"
                            value={adStartDate}
                            onChange={e => setAdStartDate(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Schedule End (Optional)</label>
                          <input
                            type="datetime-local"
                            value={adEndDate}
                            onChange={e => setAdEndDate(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                        
                        {/* Desktop Image */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                            💻 Desktop Banner Image
                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'normal', marginLeft: '6px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                              Rec: {getAdSizeRecommendation(adCategoryName, adPosition, 'desktop')}
                            </span>
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {adDesktopImg ? (
                              <div style={{ height: '70px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={adDesktopImg} alt="Desktop Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            ) : (
                              <div style={{ height: '70px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', borderRadius: '4px' }}>
                                NO DESKTOP AD BANNER
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageReader(e, 'desktop')}
                              style={{ fontSize: '11px' }}
                            />
                          </div>
                        </div>

                        {/* Mobile Image */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                            📱 Mobile Banner Image
                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 'normal', marginLeft: '6px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                              Rec: {getAdSizeRecommendation(adCategoryName, adPosition, 'mobile')}
                            </span>
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {adMobileImg ? (
                              <div style={{ height: '70px', border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <img src={adMobileImg} alt="Mobile Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                            ) : (
                              <div style={{ height: '70px', background: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', borderRadius: '4px' }}>
                                NO MOBILE AD BANNER
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => handleImageReader(e, 'mobile')}
                              style={{ fontSize: '11px' }}
                            />
                          </div>
                        </div>

                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: '14px' }}>
                        <button
                          type="button"
                          onClick={() => setIsAdFormOpen(false)}
                          style={{
                            padding: '10px 20px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          Cancel / Close
                        </button>
                        <button
                          type="submit"
                          style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                            transition: 'all 0.2s'
                          }}
                          disabled={isPending}
                        >
                          {editingAd ? 'Save Campaign' : 'Publish Campaign'}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

              {/* Campaigns List Table */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.05)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', fontSize: '13.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.75px' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Campaign (Client)</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Slot Placement</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Geotargeting</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Scheduling Schedule</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Impressions</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>Clicks</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold' }}>CTR (%)</th>
                        <th style={{ padding: '12px 16px', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allAds.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            No dynamic client campaigns created yet. Click "Create Client Campaign" above.
                          </td>
                        </tr>
                      ) : (
                        allAds.map(ad => {
                          const status = getCampaignStatusLabel(ad);
                          const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
                          
                          // Format target text for display
                          let targetText = "All India / Global";
                          if (ad.targetType === "State" && ad.targetStates) {
                            try {
                              targetText = "States: " + JSON.parse(ad.targetStates).join(', ');
                            } catch (e) {
                              targetText = "State Specific";
                            }
                          } else if (ad.targetType === "District" && ad.targetDistricts) {
                            try {
                              targetText = "Districts: " + JSON.parse(ad.targetDistricts).join(', ');
                            } catch (e) {
                              targetText = "District Specific";
                            }
                          } else if (ad.targetType === "Radius" && ad.targetLat && ad.targetLng && ad.targetRadius) {
                            targetText = `Radius: ${ad.targetRadius} KM around (${ad.targetLat}, ${ad.targetLng})`;
                          }

                          return (
                            <tr key={ad.id} style={{
                              background: '#f8fafc',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                              borderRadius: '8px'
                            }}>
                              <td style={{ padding: '14px 16px', borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px', border: '1px solid #e2e8f0', borderRight: 'none' }}>
                                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{ad.title}</div>
                                <div style={{ fontSize: '11px', color: '#4f46e5', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="far fa-user" style={{ fontSize: '10px' }}></i> {ad.client?.name || 'Unknown Client'}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  background: '#f1f5f9',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '11.5px',
                                  color: '#334155'
                                }}>
                                  {ad.categoryName}
                                </span>
                                <span style={{ margin: '0 4px', color: '#94a3b8' }}>›</span>
                                <span style={{ fontWeight: 700, color: '#4f46e5' }}>Pos {ad.position}</span>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: '12.5px', color: '#475569', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }} title={targetText}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 8px',
                                  background: ad.targetType === 'Radius' ? '#fff7ed' : ad.targetType === 'State' ? '#e0f2fe' : ad.targetType === 'District' ? '#f0fdf4' : '#f8fafc',
                                  border: `1px solid ${ad.targetType === 'Radius' ? '#ffedd5' : ad.targetType === 'State' ? '#bae6fd' : ad.targetType === 'District' ? '#bbf7d0' : '#cbd5e1'}`,
                                  borderRadius: '6px',
                                  color: ad.targetType === 'Radius' ? '#c2410c' : ad.targetType === 'State' ? '#0369a1' : ad.targetType === 'District' ? '#15803d' : '#475569',
                                  fontWeight: 600,
                                  fontSize: '11px'
                                }}>
                                  <i className="fas fa-map-marker-alt" style={{ fontSize: '9px' }}></i> {ad.targetType === 'Radius' ? 'Radius Geofence' : ad.targetType === 'State' ? 'States' : ad.targetType === 'District' ? 'Districts' : 'All/Global'}
                                </span>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {targetText}
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: '12px', color: '#64748b', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {ad.startDate ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><i className="far fa-calendar-alt" style={{ color: '#10b981' }}></i> {new Date(ad.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 500 }}><i className="fas fa-bolt"></i> Immediate Start</div>
                                )}
                                {ad.endDate ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><i className="far fa-calendar-times" style={{ color: '#ef4444' }}></i> {new Date(ad.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#10b981', fontWeight: 500 }}><i className="fas fa-infinity"></i> Unlimited</div>
                                )}
                              </td>
                              <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.color}30`
                                }}>
                                  {status.text}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {ad.impressions.toLocaleString()}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                {ad.clicks.toLocaleString()}
                              </td>
                              <td style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderLeft: 'none', borderRight: 'none' }}>
                                <div style={{ fontWeight: 800, color: '#1f2937', fontSize: '13.5px' }}>{ctr}%</div>
                                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(parseFloat(ctr), 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)', borderRadius: '3px' }} />
                                </div>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', borderTopRightRadius: '10px', borderBottomRightRadius: '10px', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    onClick={() => handleToggleAdStatus(ad.id, ad.isActive)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: ad.isActive ? '#ea580c' : '#10b981',
                                      cursor: 'pointer',
                                      padding: '6px',
                                      fontSize: '15px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    title={ad.isActive ? "Pause Campaign" : "Resume Campaign"}
                                  >
                                    <i className={`fas ${ad.isActive ? 'fa-pause-circle' : 'fa-play-circle'}`}></i>
                                  </button>
                                  <button
                                    onClick={() => handleResetAdStats(ad.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#8b5cf6',
                                      cursor: 'pointer',
                                      padding: '6px',
                                      fontSize: '13px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    title="Reset Analytics Stats"
                                  >
                                    <i className="fas fa-undo-alt"></i>
                                  </button>
                                  <button
                                    onClick={() => handleEditAdClick(ad)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#3b82f6',
                                      cursor: 'pointer',
                                      padding: '6px',
                                      fontSize: '13px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    title="Edit Campaign Details"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdClick(ad.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      padding: '6px',
                                      fontSize: '13px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    title="Delete Campaign"
                                    disabled={isPending}
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
