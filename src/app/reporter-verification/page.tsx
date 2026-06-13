import { Metadata } from 'next';
import ReporterVerificationClient from './ReporterVerificationClient';

export const metadata: Metadata = {
  title: 'Reporter Verification | The Desi Andaz Media Network',
  description: 'Verify the authenticity and identity of official reporters, correspondents, and contributors of The Desi Andaz.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/reporter-verification',
  },
};

export default function ReporterVerificationPage() {
  return <ReporterVerificationClient />;
}
