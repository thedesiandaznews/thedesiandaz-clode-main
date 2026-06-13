import { Metadata } from 'next';
import AffiliatesClient from './AffiliatesClient';

export const metadata: Metadata = {
  title: 'Affiliate Program | The Desi Andaz Media Network',
  description: 'Join the affiliate network of Santhal Pargana\'s first registered media network and earn by referring advertisers.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/affiliates',
  },
};

export default function AffiliatesPage() {
  return <AffiliatesClient />;
}
