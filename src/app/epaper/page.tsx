import { getEpapers } from '@/actions/epaper';
import EpaperViewer from './EpaperViewer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital E-Paper Archive | The Desi Andaz Media Network',
  description: 'Read the latest physical news editions digitally. View complete printed editions of The Desi Andaz newspaper online.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/epaper',
  },
};

export default async function EpaperPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const epapers = await getEpapers(date ? { date } : undefined);
  const allEpapers = await getEpapers(); // for archive

  // Use the most recent or the filtered one
  const activePaper = epapers[0] || null;

  return (
    <EpaperViewer 
      activePaper={activePaper} 
      archives={allEpapers.slice(0, 10)} 
    />
  );
}
