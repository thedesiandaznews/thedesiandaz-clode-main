import React from 'react';
import { getCategories } from '@/actions/categories';
import CategoryManager from './CategoryManager';

export default async function CategoryManagementPage() {
  const categories = await getCategories();
  
  return <CategoryManager initialCategories={categories} />;
}

