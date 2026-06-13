'use server';

import React, { Suspense } from 'react';
import RegisterClient from '@/app/reporter/register/RegisterClient';

export default async function StateRegisterPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', fontWeight: 650, color: '#4f46e5' }}>Loading Registration Workspace...</div>}>
      <RegisterClient defaultRole="STATE_CORRESPONDENT" />
    </Suspense>
  );
}
