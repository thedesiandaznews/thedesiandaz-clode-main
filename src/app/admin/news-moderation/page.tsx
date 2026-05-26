'use server';

import React from 'react';
import NewsModerationClient from './NewsModerationClient';
import { getPendingArticlesForModeration } from '@/actions/reporter';

export default async function NewsModerationPage() {
  const pendingArticles = await getPendingArticlesForModeration();
  return <NewsModerationClient initialArticles={pendingArticles} />;
}
