import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';
import ThemeScript from '@/components/ThemeScript';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import SiteMetadata from '@/components/SiteMetadata';
import ReferralTracker from '@/components/ReferralTracker';
import Script from 'next/script';
import { Suspense } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.thedesiandaz.com'),
  title: 'The Desi Andaz - देसी नज़रिया, सच्ची खबर',
  description: 'Premium Hindi News Portal - The Desi Andaz',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mukta:wght@200;300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link href="https://db.onlinewebfonts.com/c/aaba86b816ab0ba63ce0a0b74ef16072?family=Munshi+Devanagari+Semibold" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeScript />
        <ReferralTracker />
        <Suspense fallback={null}>
          <SiteMetadata />
        </Suspense>
        <div className="flex flex-col min-h-screen">
          <Suspense fallback={null}>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </Suspense>
        </div>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7CTKGE7ZXR"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7CTKGE7ZXR');
          `}
        </Script>
      </body>
    </html>
  );
}

