'use client';

import { useEffect, useRef } from 'react';
import { incrementViews } from '@/actions/news';

export default function ViewCounter({ id }: { id: string }) {
  const incremented = useRef(false);

  useEffect(() => {
    if (!incremented.current) {
      incrementViews(id);
      incremented.current = true;
    }
  }, [id]);

  return null;
}
