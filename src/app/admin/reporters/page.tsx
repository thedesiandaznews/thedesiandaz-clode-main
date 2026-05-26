'use server';

import React from 'react';
import ReportersClient from './ReportersClient';
import { getReportersList } from '@/actions/reporter';

export default async function ReportersAdminPage() {
  const list = await getReportersList();
  return <ReportersClient initialList={list} />;
}
