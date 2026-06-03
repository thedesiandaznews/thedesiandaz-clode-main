'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../reporter.module.css';
import { registerReporter } from '@/actions/reporter';
import { uploadFileAction } from '@/actions/upload';
import { stateDistricts, allStates, jharkhandBlocks } from '@/lib/localization';

export default function RegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Step 2: Geography
  const [state, setState] = useState('Jharkhand');
  const [district, setDistrict] = useState('Ranchi');
  const [poPs, setPoPs] = useState('');
  const [block, setBlock] = useState('Ranchi');
  const [fullAddress, setFullAddress] = useState('');

  // Step 3: Documents Upload URLs
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  const [aadhaarBackUrl, setAadhaarBackUrl] = useState('');
  const [panUrl, setPanUrl] = useState('');
  const [voterIdUrl, setVoterIdUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [educationUrl, setEducationUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // File Upload Status States
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'idle' | 'uploading' | 'success' | 'error'>>({
    aadhaar: 'idle',
    aadhaarBack: 'idle',
    pan: 'idle',
    voterId: 'idle',
    photo: 'idle',
    education: 'idle',
    video: 'idle',
  });

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setState(selectedState);
    // Reset district based on new state's first available option
    const districtsForState = stateDistricts[selectedState];
    if (districtsForState && districtsForState.length > 0) {
      const nextDistrict = districtsForState[0];
      setDistrict(nextDistrict);
      if (selectedState === 'Jharkhand') {
        const blocks = jharkhandBlocks[nextDistrict];
        setBlock(blocks && blocks.length > 0 ? blocks[0] : '');
      } else {
        setBlock('');
      }
    } else {
      setDistrict('');
      setBlock('');
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistrict = e.target.value;
    setDistrict(selectedDistrict);
    if (state === 'Jharkhand') {
      const blocks = jharkhandBlocks[selectedDistrict];
      setBlock(blocks && blocks.length > 0 ? blocks[0] : '');
    }
  };

// Browser-side lightweight image compression using HTML5 Canvas to prevent Vercel 4.5MB Serverless function payload limits.
// Reduces camera shots (~5MB) to highly legible optimized documents (~150KB) in milliseconds.
function compressImage(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file); // Don't compress PDFs/Zips
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];
      setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));

      try {
        // Compress image client-side before converting to Base64 to bypass Vercel limits
        if (file.type.startsWith('image/')) {
          try {
            file = await compressImage(file);
          } catch (compressError) {
            console.warn('Image compression failed, using original file:', compressError);
          }
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'kyc'); // store in /uploads/kyc

        const res = await uploadFileAction(formData);

        if (res.success && res.url) {
          setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
          
          // Map to correct field
          if (type === 'aadhaar') setAadhaarUrl(res.url);
          else if (type === 'aadhaarBack') setAadhaarBackUrl(res.url);
          else if (type === 'pan') setPanUrl(res.url);
          else if (type === 'voterId') setVoterIdUrl(res.url);
          else if (type === 'photo') setPhotoUrl(res.url);
          else if (type === 'education') setEducationUrl(res.url);
          else if (type === 'video') setVideoUrl(res.url);
        } else {
          setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
          alert('Upload failed: ' + (res.message || 'Unknown error'));
        }
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
        console.error(err);
      }
    }
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!fullName.trim() || !fatherHusbandName.trim() || !email.trim() || !password.trim() || !mobile.trim() || !bloodGroup) {
        setError('Please fill out all required fields.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
    } else if (step === 2) {
      if (!state || !district || !poPs.trim() || !block.trim() || !fullAddress.trim()) {
        setError('Please fill out all geographical details.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Ensure Aadhaar Card Number is valid
    if (!aadhaarNumber.trim() || aadhaarNumber.trim().length !== 12 || isNaN(Number(aadhaarNumber.trim()))) {
      setError('Please enter a valid 12-digit Aadhaar Card Number.');
      return;
    }

    // Ensure all critical docs uploaded
    if (!aadhaarUrl || !aadhaarBackUrl || !panUrl || !voterIdUrl || !photoUrl || !educationUrl || !videoUrl) {
      setError('Please upload all documents (Aadhaar Card Front, Aadhaar Card Back, PAN Card, Voter ID, Passport Photo, Education Certs, and Introduction Video).');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerReporter({
        email,
        password,
        fullName,
        fatherHusbandName,
        mobile,
        bloodGroup: bloodGroup || undefined,
        state,
        district,
        poPs,
        block,
        fullAddress,
        aadhaarNumber: aadhaarNumber || undefined,
        aadhaarUrl,
        aadhaarBackUrl,
        panUrl,
        voterIdUrl: voterIdUrl || undefined,
        photoUrl,
        educationUrl,
        videoUrl: videoUrl || undefined
      });

      if (res.success) {
        alert('Application Submitted Successfully! Your KYC is now pending super admin approval.');
        router.push('/reporter/login');
      } else {
        setError(res.message || 'Failed to submit application.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reporterContainer}>
      <div className={styles.glassCard}>
        
        {/* Stepper Header */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step === 1 ? styles.stepActive : step > 1 ? styles.stepCompleted : ''}`}>
            1
            <span className={styles.stepLabel}>Account</span>
          </div>
          <div className={`${styles.step} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepCompleted : ''}`}>
            2
            <span className={styles.stepLabel}>Address</span>
          </div>
          <div className={`${styles.step} ${step === 3 ? styles.stepActive : ''}`}>
            3
            <span className={styles.stepLabel}>KYC Uploads</span>
          </div>
        </div>

        <h1 className={styles.cardTitle} style={{ marginTop: '20px' }}>
          Reporter Onboarding <span className={styles.highlightText}>Wizard</span>
        </h1>
        <p className={styles.cardSubtitle}>
          Complete your KYC details to join the official Desi Andaz reporting network
        </p>

        {error && (
          <div 
            style={{ 
              background: '#fee2e2', 
              border: '1px solid #fca5a5', 
              color: '#b91c1c', 
              padding: '14px 20px', 
              borderRadius: '10px', 
              fontSize: '13px', 
              marginBottom: '24px',
              fontWeight: 500
            }}
          >
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          
          {/* STEP 1: ACCOUNT DETAILS */}
          {step === 1 && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sonu Kumar"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Father/Husband Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={fatherHusbandName}
                  onChange={(e) => setFatherHusbandName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mobile Number <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="tel" 
                  className={styles.input} 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10 Digit Phone Number"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sonu@example.com"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="password" 
                  className={styles.input} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Blood Group <span style={{ color: 'red' }}>*</span></label>
                <select className={styles.select} value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: GEOGRAPHY DETAILS */}
          {step === 2 && (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>State <span style={{ color: 'red' }}>*</span></label>
                <select className={styles.select} value={state} onChange={handleStateChange}>
                  {allStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>District <span style={{ color: 'red' }}>*</span></label>
                <select className={styles.select} value={district} onChange={handleDistrictChange}>
                  {stateDistricts[state]?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>PO + PS (Post Office & Police Station) <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={poPs}
                  onChange={(e) => setPoPs(e.target.value)}
                  placeholder="e.g. Lalpur PO, Lalpur PS"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Block <span style={{ color: 'red' }}>*</span></label>
                {state === 'Jharkhand' && jharkhandBlocks[district] ? (
                  <select 
                    className={styles.select} 
                    value={block} 
                    onChange={(e) => setBlock(e.target.value)}
                    required
                  >
                    <option value="">Select Block</option>
                    {jharkhandBlocks[district].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. Kanke Block"
                    required
                  />
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Full Address <span style={{ color: 'red' }}>*</span></label>
                <textarea 
                  className={styles.textarea} 
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Provide your complete residential or official address details..."
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: DOCUMENT UPLOADS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                <label className={styles.label}>Aadhaar Card Number <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="12 Digit Aadhaar Number"
                />
              </div>

              <div className={styles.uploadGrid}>
                {/* Aadhaar Card Front */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.aadhaar === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('aadhaarUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.aadhaar === 'success' ? 'fa-check-circle' : uploadStatus.aadhaar === 'uploading' ? 'fa-spinner fa-spin' : 'fa-id-card'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Aadhaar Card (Front) <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>PDF, PNG or JPG supported</span>
                  <input type="file" id="aadhaarUpload" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'aadhaar')} />
                </div>

                {/* Aadhaar Card Back */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.aadhaarBack === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('aadhaarBackUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.aadhaarBack === 'success' ? 'fa-check-circle' : uploadStatus.aadhaarBack === 'uploading' ? 'fa-spinner fa-spin' : 'fa-id-card'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Aadhaar Card (Back) <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>PDF, PNG or JPG supported</span>
                  <input type="file" id="aadhaarBackUpload" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'aadhaarBack')} />
                </div>

                {/* PAN Card */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.pan === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('panUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.pan === 'success' ? 'fa-check-circle' : uploadStatus.pan === 'uploading' ? 'fa-spinner fa-spin' : 'fa-credit-card'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>PAN Card <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>PDF, PNG or JPG supported</span>
                  <input type="file" id="panUpload" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'pan')} />
                </div>

                {/* Voter ID Card */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.voterId === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('voterIdUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.voterId === 'success' ? 'fa-check-circle' : uploadStatus.voterId === 'uploading' ? 'fa-spinner fa-spin' : 'fa-address-card'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Voter ID Card <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>PDF, PNG or JPG supported</span>
                  <input type="file" id="voterIdUpload" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'voterId')} />
                </div>

                {/* Passport Photo */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.photo === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('photoUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.photo === 'success' ? 'fa-check-circle' : uploadStatus.photo === 'uploading' ? 'fa-spinner fa-spin' : 'fa-user-circle'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Passport Size Photo <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>PNG or JPG supported</span>
                  <input type="file" id="photoUpload" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                </div>

                {/* Educational Certificates */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.education === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('educationUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.education === 'success' ? 'fa-check-circle' : uploadStatus.education === 'uploading' ? 'fa-spinner fa-spin' : 'fa-graduation-cap'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Education Certs <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>Zip, PDF or Combine JPGs</span>
                  <input type="file" id="educationUpload" style={{ display: 'none' }} accept="image/*,application/pdf,application/zip,application/x-zip-compressed" onChange={(e) => handleFileUpload(e, 'education')} />
                </div>

                {/* Introduction Video */}
                <div 
                  className={`${styles.uploadZone} ${uploadStatus.video === 'success' ? styles.uploadSuccess : ''}`}
                  onClick={() => document.getElementById('videoUpload')?.click()}
                >
                  <i className={`fas ${uploadStatus.video === 'success' ? 'fa-check-circle' : uploadStatus.video === 'uploading' ? 'fa-spinner fa-spin' : 'fa-video'} ${styles.uploadIcon}`}></i>
                  <span className={styles.uploadTitle}>Introduction Video <span style={{ color: 'red' }}>*</span></span>
                  <span className={styles.uploadSubtitle}>Short clip (MP4, max 50MB)</span>
                  <input type="file" id="videoUpload" style={{ display: 'none' }} accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
                </div>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className={styles.btnGroup}>
            {step > 1 ? (
              <button type="button" className={styles.btnSecondary} onClick={handleBack} disabled={isSubmitting}>
                <i className="fas fa-arrow-left"></i> Previous Step
              </button>
            ) : (
              <Link href="/reporter/login" className={styles.btnSecondary}>
                Back to Login
              </Link>
            )}

            {step < 3 ? (
              <button type="button" className={styles.btnPrimary} onClick={handleNext}>
                Next Step <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button 
                type="button" 
                className={styles.btnPrimary} 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.spinner}></span> Registering...
                  </div>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> Submit Application
                  </>
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
