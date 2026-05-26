import React from 'react';
import { getEpapers } from '@/actions/epaper';
import EpaperClient from './EpaperClient';

export default async function EpaperAdminPage() {
  const epapers = await getEpapers();

  return <EpaperClient initialEpapers={epapers} />;
}
