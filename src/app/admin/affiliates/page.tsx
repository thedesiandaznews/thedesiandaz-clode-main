'use server';

import React from 'react';
import AffiliatesClient from './AffiliatesClient';
import { getAffiliatesForAdmin } from '@/actions/affiliate';

export default async function AffiliatesAdminPage() {
  const list = await getAffiliatesForAdmin();
  return <AffiliatesClient initialList={list} />;
}
