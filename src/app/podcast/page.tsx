import { Metadata } from 'next';
import PodcastClient from './PodcastClient';

export const metadata: Metadata = {
  title: 'Podcast Episodes | The Desi Andaz Media Network',
  description: 'Listen to the latest podcasts covering Jharkhand politics, culture, sports, agriculture, and local entrepreneur stories.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/podcast',
  },
};

export default function PodcastPage() {
  return <PodcastClient />;
}
