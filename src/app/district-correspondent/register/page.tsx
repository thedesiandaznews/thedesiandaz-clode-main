'use server';

import React, { Suspense } from 'react';
import RegisterClient from '@/app/reporter/register/RegisterClient';

export default async function DistrictRegisterPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', fontWeight: 650, color: '#4f46e5' }}>Loading Registration Workspace...</div>}>
      <RegisterClient defaultRole="DISTRICT_CORRESPONDENT" />
    </Suspense>
  );
}
