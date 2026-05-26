'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './join.module.css';
import { registerContributor } from '@/actions/community';
import { uploadImage } from '@/actions/upload';
import { stateDistricts } from '@/lib/localization';

export default function JoinCommunity() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    otp: '',
    password: '',
    state: 'Jharkhand',
    district: 'Ranchi',
    block: '',
    area: '',
    locationLat: null as number | null,
    locationLng: null as number | null,
  });

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'state') {
        newData.district = stateDistricts[value]?.[0] || '';
      }
      return newData;
    });
  };

  const handleSendOTP = () => {
    if (formData.mobile.length < 10) return alert('Enter valid 10-digit mobile number');
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
  };

  const verifyOTP = () => {
    if (formData.otp === generatedOtp) {
      setIsOtpVerified(true);
    } else {
      alert('Invalid OTP. Please check the code shown above and try again.');
    }
  };

  const [isLocating, setIsLocating] = useState(false);

  const getLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            const address = data.address || {};
            
            const state = address.state || '';
            const district = address.state_district || address.county || '';
            const block = address.city_district || address.city || address.town || address.municipality || address.county || '';
            
            // Extract all micro-level details for "Area" to ensure nothing is missed (Village, Panchayat, Pincode)
            const pincode = address.postcode ? ` - ${address.postcode}` : '';
            const microDetails = [
              address.neighbourhood,
              address.residential,
              address.road,
              address.hamlet,
              address.village,
              address.suburb
            ].filter(Boolean);
            
            const exactArea = Array.from(new Set(microDetails)).join(', ') + pincode;

            setFormData(prev => ({
              ...prev,
              locationLat: lat,
              locationLng: lng,
              state: state,
              district: district,
              block: block || 'Not Found',
              area: exactArea || 'Not Found'
            }));
            setIsLocating(false);
            alert(`Location detected successfully!\nDetected: ${district}, ${state}`);
          } catch (err) {
            // Fallback if reverse geocoding fails
            setFormData(prev => ({
              ...prev,
              locationLat: lat,
              locationLng: lng
            }));
            setIsLocating(false);
            alert('GPS Coordinates secured, but could not auto-fill address text. Please type your Block/City manually.');
          }
        },
        (error) => {
          setIsLocating(false);
          let errorMessage = 'Error detecting location.';
          if (error.code === 1) errorMessage = 'Location access denied. Please allow location permissions in your browser settings to proceed.';
          else if (error.code === 2) errorMessage = 'Location unavailable. Please try again.';
          else if (error.code === 3) errorMessage = 'Location request timed out. Please check your internet connection.';
          alert(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.mobile || !formData.password || !formData.otp) {
        return alert('Please fill all required fields.');
      }
      if (!isOtpVerified) {
        return alert('Please verify your OTP before proceeding.');
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!formData.locationLat || !formData.locationLng) {
      return alert('Mandatory: Please click "Auto-Detect Live Location" to securely attach your GPS coordinates before generating your ID.');
    }
    if (!formData.block || !formData.area) {
      return alert('Please provide your block and area details.');
    }

    setIsLoading(true);

    try {
      let selfieUrl = null;
      if (selfieFile) {
        const uploadData = new FormData();
        uploadData.append('image', selfieFile);
        const res = await uploadImage(uploadData);
        if (res.success) selfieUrl = res.url;
      }

      const finalData = {
        ...formData,
        selfieUrl
      };

      const res = await registerContributor(finalData);
      
      if (res.success) {
        // Auto login and activate dashboard
        localStorage.setItem('contributorAuth', JSON.stringify({ 
          id: res.contributorId, 
          mobile: formData.mobile,
          generatedId: res.generatedId
        }));
        router.push('/anonymous/dashboard');
      } else {
        alert(res.message);
      }
    } catch (error: any) {
      console.error(error);
      alert('Error during registration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page} style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className={styles.container} style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #e2e8f0', width: '100%', maxWidth: '600px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', color: '#2563eb', marginBottom: '16px' }}>
            <i className="fas fa-user-secret" style={{ fontSize: '28px' }}></i>
          </div>
          <h2 className={styles.title} style={{ color: '#0f172a', fontSize: '28px', marginBottom: '8px', fontWeight: 'bold' }}>Anonymous Registration</h2>
          <p className={styles.subtitle} style={{ color: '#475569', fontSize: '15px' }}>Your identity stays fully protected. Raise your voice safely.</p>
        </div>

        <div className={styles.stepIndicator} style={{ display: 'flex', gap: '8px', marginBottom: '30px', justifyContent: 'center' }}>
          <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ''}`} style={step >= 1 ? {background: '#2563eb', flex: '1', height: '4px', borderRadius: '4px'} : {background: '#e2e8f0', flex: '1', height: '4px', borderRadius: '4px'}} />
          <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ''}`} style={step >= 2 ? {background: '#2563eb', flex: '1', height: '4px', borderRadius: '4px'} : {background: '#e2e8f0', flex: '1', height: '4px', borderRadius: '4px'}} />
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
              <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Full Name (Kept strictly private)</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={styles.input} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none' }} placeholder="Rahul Kumar" />
            </div>
            
            <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
              <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Mobile Number (Used for login only)</label>
              <div className={styles.otpGroup} style={{ display: 'flex', gap: '10px' }}>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className={styles.input} style={{ flex: '1', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none' }} placeholder="9876543210" maxLength={10} disabled={isOtpVerified} />
                <button type="button" onClick={handleSendOTP} className={styles.btnOtp} disabled={otpSent || isOtpVerified} style={otpSent ? {background: '#e2e8f0', color: '#94a3b8', padding: '0 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold'} : {background: '#f1f5f9', color: '#475569', padding: '0 20px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer'}}>
                  {otpSent ? 'Sent' : 'Get OTP'}
                </button>
              </div>
            </div>

            {otpSent && !isOtpVerified && (
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px dashed #2563eb', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1e3a8a' }}>For security verification, your temporary OTP is:</p>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', letterSpacing: '4px', margin: '8px 0' }}>{generatedOtp}</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>(Please enter this code below)</p>
              </div>
            )}

            {otpSent && (
              <div className={styles.formGroup} style={{ marginBottom: '20px' }}>
                <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Enter OTP</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" name="otp" value={formData.otp} onChange={handleInputChange} className={styles.input} style={{ flex: '1', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: isOtpVerified ? '#ecfdf5' : '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none' }} placeholder="Enter 4-digit code" maxLength={4} disabled={isOtpVerified} />
                  {!isOtpVerified ? (
                    <button type="button" onClick={verifyOTP} style={{ background: '#2563eb', color: '#fff', padding: '0 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                      Verify
                    </button>
                  ) : (
                    <button type="button" disabled style={{ background: '#10b981', color: '#fff', padding: '0 20px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>
                      Verified ✓
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={styles.formGroup} style={{ marginBottom: '30px' }}>
              <label className={styles.label} style={{ color: '#334155', fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Create Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={styles.input} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '16px', outline: 'none' }} placeholder="••••••••" />
            </div>

            <button onClick={handleNext} className={styles.btnPrimary} style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#fff', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>Secure Next Step <i className="fas fa-arrow-right" style={{marginLeft: '8px'}}></i></button>
            
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
              Already have an anonymous account? <Link href="/anonymous/login" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
            </p>
          </div>
        )}

        {/* STEP 2: Location & Final */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <i className="fas fa-shield-check" style={{ color: '#2563eb', marginTop: '2px', fontSize: '18px' }}></i>
              <p style={{ fontSize: '14px', color: '#1e3a8a', margin: 0, lineHeight: 1.5 }}>Your location helps us generate your anonymous Contributor ID and direct your reports to the right local authorities.</p>
            </div>

            {!formData.locationLat ? (
              <button type="button" onClick={getLocation} disabled={isLocating} style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: isLocating ? 'wait' : 'pointer', marginBottom: '24px', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', animation: 'pulseGlow 2s infinite' }}>
                <i className={isLocating ? "fas fa-spinner fa-spin" : "fas fa-map-marker-alt"} style={{ marginRight: '8px' }}></i> 
                {isLocating ? 'Detecting Exact Location...' : 'Auto-Detect Live Location (Required *)'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '100%', padding: '16px', background: '#ecfdf5', color: '#065f46', border: '1px solid #10b981', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-check-circle" style={{ color: '#10b981', marginRight: '8px', fontSize: '18px' }}></i> 
                  Exact Location Secured
                </div>
                <button type="button" onClick={getLocation} disabled={isLocating} style={{ width: '100%', padding: '12px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: isLocating ? 'wait' : 'pointer', transition: 'all 0.2s' }}>
                  <i className={isLocating ? "fas fa-spinner fa-spin" : "fas fa-sync-alt"} style={{ marginRight: '8px' }}></i> 
                  {isLocating ? 'Detecting...' : 'Wrong Location? Re-Detect Again'}
                </button>
              </div>
            )}

            <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#0f172a', margin: 0, fontWeight: 'bold' }}>
                  <i className="fas fa-satellite" style={{ marginRight: '6px', color: '#2563eb' }}></i> GPS Secured: {formData.locationLat}, {formData.locationLng}
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-pen" style={{ marginRight: '6px' }}></i> Auto-Filled by GPS (You can correct Village/Area)
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px', display: 'block' }}>State</label>
                  <input type="text" value={formData.state || ''} readOnly className={styles.input} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#e2e8f0', color: '#334155', fontSize: '15px', outline: 'none', cursor: 'not-allowed' }} placeholder="Auto-detected" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px', display: 'block' }}>District</label>
                  <input type="text" value={formData.district || ''} readOnly className={styles.input} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#e2e8f0', color: '#334155', fontSize: '15px', outline: 'none', cursor: 'not-allowed' }} placeholder="Auto-detected" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Block / City</label>
                  <input type="text" value={formData.block || ''} onChange={e => setFormData({...formData, block: e.target.value})} className={styles.input} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '15px', outline: 'none' }} placeholder="Block Name" />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: '#475569', fontWeight: '600', fontSize: '13px', marginBottom: '8px', display: 'block' }}>Area / Locality / Village</label>
                  <input type="text" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} className={styles.input} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontSize: '15px', outline: 'none' }} placeholder="Village or Area" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setStep(1)} className={styles.btnOtp} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} disabled={isLoading}>Back</button>
              <button onClick={handleSubmit} className={styles.btnPrimary} style={{ flex: 2, padding: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }} disabled={isLoading}>
                {isLoading ? 'Encrypting...' : 'Generate Contributor ID'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
