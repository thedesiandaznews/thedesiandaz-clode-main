'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../join/join.module.css';
import { submitIncidentReport } from '@/actions/community';
import { uploadImage } from '@/actions/upload';
import { compressImage } from '@/lib/imageCompressor';

const CATEGORIES = ['Accident', 'Corruption', 'Crime', 'Public Complaint', 'Politics', 'Local Event', 'Government Issue', 'Water Problem', 'Electricity Problem', 'Social Issue', 'Road Accident', 'Emergency', 'Other'];

interface MediaItem {
  file: File;
  previewUrl: string;
  type: string;
  originalSize: number;
  compressedSize?: number;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export default function SubmitReport() {
  const router = useRouter();
  const [contributorId, setContributorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Public Complaint',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    isGroundAlert: false
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const authData = localStorage.getItem('contributorAuth');
    if (!authData) {
      router.push('/anonymous/login');
      return;
    }
    setContributorId(JSON.parse(authData).id);
  }, []);

  const getLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            
            // Extract the most detailed address possible provided by OpenStreetMap
            // This includes Village, Panchayat, Block, District, State, and Pincode
            let fullLocation = data.display_name || '';
            
            // Remove ", India" to keep it clean
            if (fullLocation.endsWith(', India')) {
              fullLocation = fullLocation.replace(', India', '');
            }

            setFormData(prev => ({
              ...prev,
              lat: lat,
              lng: lng,
              address: fullLocation || 'GPS Location Secured'
            }));
            setIsLocating(false);
          } catch (error) {
            setFormData(prev => ({
              ...prev,
              lat: lat,
              lng: lng,
              address: 'GPS Coordinates Secured (Address Fetch Failed)'
            }));
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);
          alert('Location access denied. Please allow location permissions in your browser settings.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      const selectedFiles = Array.from(e.target.files);
      const newItems: MediaItem[] = [];

      for (const file of selectedFiles) {
        if (file.type.startsWith('video/')) {
          // Check video size (Max 3.5 MB for secure anonymous submission)
          if (file.size > 3.5 * 1024 * 1024) {
            alert(`Video "${file.name}" exceeds the 3.5MB size limit. Please select a smaller video or compress it first to ensure a successful secure upload.`);
            continue;
          }
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            file,
            previewUrl,
            type: 'video',
            originalSize: file.size,
            compressedSize: file.size
          });
        } else if (file.type.startsWith('image/')) {
          try {
            const compressedFile = await compressImage(file);
            const previewUrl = URL.createObjectURL(compressedFile);
            newItems.push({
              file: compressedFile,
              previewUrl,
              type: 'image',
              originalSize: file.size,
              compressedSize: compressedFile.size
            });
          } catch (err) {
            console.error('Image compression error:', err);
            const previewUrl = URL.createObjectURL(file);
            newItems.push({
              file,
              previewUrl,
              type: 'image',
              originalSize: file.size,
              compressedSize: file.size
            });
          }
        } else {
          const previewUrl = URL.createObjectURL(file);
          newItems.push({
            file,
            previewUrl,
            type: 'file',
            originalSize: file.size,
            compressedSize: file.size
          });
        }
      }

      setMediaItems(prev => [...prev, ...newItems]);
      setIsCompressing(false);
      // Reset input so the same files can be selected again if needed
      e.target.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => {
      const newItems = [...prev];
      URL.revokeObjectURL(newItems[index].previewUrl); // free memory
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      return alert('Please fill in Title and Description.');
    }
    if (!formData.lat || !formData.lng || !formData.address) {
      return alert('Mandatory: Please click "Auto-Detect Live Location" to securely attach your GPS coordinates.');
    }

    setIsLoading(true);

    try {
      let mediaUrls: string[] = [];
      
      // Upload all media files sequentially (or Promise.all for parallel)
      for (const item of mediaItems) {
        const uploadData = new FormData();
        uploadData.append('image', item.file);
        // Note: actions/upload currently might assume 'image' but it should handle any file in standard multer/Next.js setup if written generically
        const uploadRes = await uploadImage(uploadData);
        if (uploadRes.success && uploadRes.url) {
          mediaUrls.push(uploadRes.url);
        } else {
          console.error('Failed to upload file:', item.file.name, uploadRes.message);
        }
      }

      const payload = {
        contributorId,
        ...formData,
        mediaUrls
      };

      const res = await submitIncidentReport(payload);
      
      if (res.success) {
        alert('Report submitted successfully! (+2 Points)');
        // Cleanup URLs
        mediaItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        router.push('/anonymous/dashboard');
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '40px 20px', color: '#fff' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#111827', padding: '30px', borderRadius: '16px', border: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1f2937', paddingBottom: '20px' }}>
          <Link href="/anonymous/dashboard" style={{ color: '#9ca3af', marginRight: '16px', fontSize: '20px', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h2 style={{ margin: 0, textAlign: 'left', fontSize: '24px', color: '#fff' }}>Secure Incident Report</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Media Upload Area */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                width: '100%', minHeight: '120px', background: '#0a0a0a', border: '2px dashed #374151', 
                borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: '20px', marginBottom: '16px', transition: 'border 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#ef4444'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#374151'}
              onClick={() => !isCompressing && document.getElementById('media-upload')?.click()}
            >
              {isCompressing ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#10b981', marginBottom: '8px' }}></i>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>Optimizing & Compressing Media...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: '32px', color: '#6b7280', marginBottom: '8px' }}></i>
                  <span style={{ color: '#9ca3af' }}>Tap to Securely Upload Multiple Photos/Videos</span>
                </>
              )}
            </div>
            
            <input type="file" id="media-upload" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleMediaChange} />
            
            {/* Media Previews Grid */}
            {mediaItems.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {mediaItems.map((item, index) => (
                  <div key={index} style={{ position: 'relative', flexShrink: 0, width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {item.type === 'video' ? (
                      <video src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={item.previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button 
                      type="button" 
                      onClick={() => removeMedia(index)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', zIndex: 10 }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    {item.type === 'video' && (
                      <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px', fontSize: '9px', color: 'white', zIndex: 10 }}>
                        <i className="fas fa-video"></i>
                      </div>
                    )}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: '4px', 
                        left: '4px', 
                        background: item.type === 'video' ? 'rgba(0,0,0,0.7)' : 'rgba(16, 185, 129, 0.85)', 
                        padding: '2px 4px', 
                        borderRadius: '4px', 
                        fontSize: '9px', 
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        zIndex: 10
                      }}
                    >
                      {item.compressedSize && item.compressedSize < item.originalSize ? (
                        <>
                          <i className="fas fa-bolt" style={{ marginRight: '2px' }}></i>
                          {formatSize(item.compressedSize)}
                        </>
                      ) : (
                        formatSize(item.file.size)
                      )}
                    </div>
                  </div>
                ))}
                <div 
                  onClick={() => !isCompressing && document.getElementById('media-upload')?.click()}
                  style={{ flexShrink: 0, width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Write a clear headline..." 
              style={{ fontSize: '18px', fontWeight: 'bold', background: '#0a0a0a', color: '#fff', borderColor: '#374151' }}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <textarea 
              className={styles.input} 
              placeholder="Describe the incident in detail... What happened? When?" 
              rows={5}
              style={{ resize: 'none', background: '#0a0a0a', color: '#fff', borderColor: '#374151' }}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <select className={styles.select} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ background: '#0a0a0a', color: '#fff', borderColor: '#374151' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            {formData.lat && (
              <div style={{ background: '#064e3b', color: '#34d399', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                  <i className="fas fa-satellite"></i> GPS Coordinates Secured: {formData.lat}, {formData.lng}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a7f3d0' }}>
                  <i className="fas fa-pen"></i> Auto-Filled by GPS (You can correct Village/Panchayat if needed)
                </div>
              </div>
            )}
            <input 
              type="text" 
              className={styles.input} 
              placeholder="Exact Location will auto-fill here..." 
              style={{ background: '#1f2937', color: '#fff', borderColor: '#374151' }}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={getLocation} disabled={isLocating} className={styles.locationBtn} style={{ flex: 1, minWidth: '200px', margin: 0, background: formData.lat ? '#065f46' : '#2563eb', color: '#fff', borderColor: formData.lat ? '#059669' : '#1d4ed8' }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#fff' }}></i> 
                {isLocating ? 'Detecting Exact Location...' : formData.lat ? 'Exact Location Secured ✓' : 'Auto-Detect Live Location (Required *)'}
              </button>
              <label style={{ flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isGroundAlert} onChange={e => setFormData({...formData, isGroundAlert: e.target.checked})} />
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>GROUND ALERT (Urgent)</span>
              </label>
            </div>
            
            {formData.lat && (
              <button type="button" onClick={getLocation} style={{ display: 'block', width: '100%', padding: '10px', background: 'transparent', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <i className="fas fa-sync-alt"></i> Wrong Location? Re-Detect Again
              </button>
            )}
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={isLoading} style={{ width: '100%', background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)', border: 'none', padding: '16px', fontSize: '18px' }}>
            {isLoading ? 'Encrypting & Uploading...' : 'Secure Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
