import { Metadata } from 'next';
import AdvertiseClient from './AdvertiseClient';

export const metadata: Metadata = {
  title: 'Advertise with Us | The Desi Andaz Media Network',
  description: 'Reach local buyers in Jharkhand with hyper-local targeted advertising. Print, digital, and video sponsorship slots available.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/advertise',
  },
};

export default function AdvertisePage() {
  return <AdvertiseClient />;
}
