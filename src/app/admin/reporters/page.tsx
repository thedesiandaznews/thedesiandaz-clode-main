'use server';

import React from 'react';
import ReportersClient from './ReportersClient';
import { getReportersList } from '@/actions/reporter';

export const dynamic = 'force-dynamic';

export default async function ReportersAdminPage() {
  const list = await getReportersList();
  return <ReportersClient initialList={list} />;
}

