import { Metadata } from 'next';
import LaunchOfferClient from './LaunchOfferClient';

export const metadata: Metadata = {
  title: 'Exclusive Launch Offers | The Desi Andaz Media Network',
  description: 'Limited-time visibility packages for local Jharkhand brands. Get print ads, homepage banners, social updates, and scrolling news tickers.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/launch-offer',
  },
};

export default function LaunchOfferPage() {
  return <LaunchOfferClient />;
}
