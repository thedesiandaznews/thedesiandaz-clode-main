import ResponsiveBanner from '@/components/ResponsiveBanner';
import LiveTVClient from './LiveTVClient';
import { getSiteSettings } from '@/actions/settings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LiveTVPage() {
  const settings = await getSiteSettings();

  // Channels JSON parser
  let channels = null;
  if (settings.liveTvChannels) {
    try {
      channels = JSON.parse(settings.liveTvChannels);
    } catch (e) {
      console.error("Error parsing liveTvChannels", e);
    }
  }

  // Sponsor object mapping
  const sponsor = {
    label: settings.liveTvSponsorLabel || 'Premium Sponsor',
    title: settings.liveTvSponsorTitle || 'Elevate Your Brand',
    desc: settings.liveTvSponsorDesc || 'Join our premium advertising circle and reach millions across India.',
    link: settings.liveTvSponsorLink || '#',
    img: settings.liveTvSponsorImg || null,
  };

  // Shows schedule parser
  let shows = null;
  if (settings.liveTvShows) {
    try {
      shows = JSON.parse(settings.liveTvShows);
    } catch (e) {
      console.error("Error parsing liveTvShows", e);
    }
  }

  // Ticker parser
  let ticker = null;
  if (settings.liveTvTicker) {
    try {
      ticker = JSON.parse(settings.liveTvTicker);
    } catch (e) {
      ticker = settings.liveTvTicker.split(',').map((s: string) => s.trim());
    }
  }

  return (
    <>
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: '20px', paddingLeft: '15px', paddingRight: '15px' }}>
        <ResponsiveBanner categoryName="LiveTV" position={1} />
      </div>
      <LiveTVClient 
        initialChannels={channels}
        initialSponsor={sponsor}
        initialShows={shows}
        initialTicker={ticker}
      />
    </>
  );
}
