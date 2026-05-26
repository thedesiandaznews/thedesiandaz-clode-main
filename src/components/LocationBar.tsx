'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { stateDistricts } from '@/lib/localization';
import styles from './locationbar.module.css';

export default function LocationBar() {
  const router = useRouter();
  const [selectedState,    setSelectedState]    = useState<string>('Jharkhand');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const states    = Object.keys(stateDistricts);
  const districts = selectedState ? (stateDistricts[selectedState as keyof typeof stateDistricts] || []) : [];

  const handleStateClick = (stateName: string) => {
    if (selectedState === stateName) {
      router.push(`/state/${stateName.toLowerCase().replace(/ /g, '-')}`);
    } else {
      setSelectedState(stateName);
      setSelectedDistrict(null);
    }
  };

  const handleDistrictClick = (districtName: string) => {
    setSelectedDistrict(districtName);
    const stateSlug = selectedState.toLowerCase().replace(/ /g, '-');
    const distSlug  = districtName.toLowerCase().replace(/ /g, '-');
    router.push(`/state/${stateSlug}/${distSlug}`);
  };

  return (
    <div className={styles.locationBar}>
      <div className={styles.inner}>

        {/* ── STATE ROW ── */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>📍 राज्य :</span>
          <div className={styles.scroll}>
            {states.map(stateName => (
              <button
                key={stateName}
                id={`state-chip-${stateName.toLowerCase().replace(/ /g, '-')}`}
                className={`${styles.stateChip} ${selectedState === stateName ? styles.stateChipActive : ''}`}
                onClick={() => handleStateClick(stateName)}
              >
                {stateName}
              </button>
            ))}
          </div>
        </div>

        {/* ── DISTRICT ROW ── */}
        {districts.length > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>🏘️ जिला :</span>
            <div className={styles.scroll}>
              {districts.map(districtName => (
                <button
                  key={districtName}
                  id={`dist-chip-${districtName.toLowerCase().replace(/ /g, '-')}`}
                  className={`${styles.districtChip} ${selectedDistrict === districtName ? styles.districtChipActive : ''}`}
                  onClick={() => handleDistrictClick(districtName)}
                >
                  {districtName}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
