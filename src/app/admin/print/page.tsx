'use server';

import React from 'react';
import PrintWorkspaceClient from './PrintWorkspaceClient';
import { getCompanyApprovedNews } from '@/actions/print';

export default async function PrintEditionPage() {
  const approvedNews = await getCompanyApprovedNews();
  return <PrintWorkspaceClient initialArticles={approvedNews} />;
}
