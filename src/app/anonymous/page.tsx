import { Metadata } from 'next';
import AnonymousClient from './AnonymousClient';

export const metadata: Metadata = {
  title: 'Anonymous News Submission | The Desi Andaz Media Network',
  description: 'Report local updates, issues, and ground-level news anonymously. Your identity remains 100% confidential and secure.',
  alternates: {
    canonical: 'https://www.thedesiandaz.com/anonymous',
  },
};

export default function AnonymousPage() {
  return <AnonymousClient />;
}
