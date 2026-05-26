import React from 'react';
import { getArticleById } from '@/actions/news';
import { getCategories } from '@/actions/categories';
import EditNewsClient from './EditNewsClient';
import { notFound } from 'next/navigation';

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  const categories = await getCategories();

  if (!article) {
    notFound();
  }

  return <EditNewsClient article={article} categories={categories} />;
}
