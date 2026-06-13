import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Advertising Pricing & Plans | The Desi Andaz Media Network',
  description: 'Affordable advertisement packages for local shops, showrooms, startups, and season season campaigns in Jharkhand.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/pricing',
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
