import React from 'react';
import { getNewsArticles } from '@/actions/news';
import { getCategories } from '@/actions/categories';
import NewsClient from './NewsClient';

export default async function NewsManagementPage() {
  const news = await getNewsArticles({ limit: 500 });
  const categories = await getCategories();

  return <NewsClient initialNews={news} categories={categories} />;
}

