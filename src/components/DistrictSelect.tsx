'use client';

import { useRouter } from 'next/navigation';

export default function DistrictSelect({ 
  stateSlug, 
  districts, 
  currentDistrict 
}: { 
  stateSlug: string;
  districts: string[];
  currentDistrict?: string;
}) {
  const router = useRouter();

  return (
    <div className="district-filter" style={{ background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
      <span style={{ fontWeight: 'bold', marginRight: '10px' }}>🏘️ जिला चुनें:</span>
      <select 
        style={{ padding: '5px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
        value={currentDistrict || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') {
            router.push(`/state/${stateSlug}`);
          } else {
            const districtSlug = val.toLowerCase().replace(/ /g, '-');
            router.push(`/state/${stateSlug}/${districtSlug}`);
          }
        }}
      >
        <option value="">सभी जिले</option>
        {districts.map(district => (
          <option key={district} value={district}>{district}</option>
        ))}
      </select>
    </div>
  );
}
