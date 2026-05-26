import { getEpapers } from '@/actions/epaper';
import EpaperViewer from './EpaperViewer';

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
