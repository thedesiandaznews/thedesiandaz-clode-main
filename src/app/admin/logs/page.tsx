'use server';

import React from 'react';
import LogsClient from './LogsClient';
import { getActivityLogs } from '@/actions/logs';

export default async function ActivityLogsPage() {
  const res = await getActivityLogs(200); // fetch recent 200 logs
  const initialLogs = res.success ? res.logs : [];
  return <LogsClient initialLogs={initialLogs} />;
}
