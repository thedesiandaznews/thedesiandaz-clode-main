import type { Metadata } from 'next';
import './globals.css';
import ConditionalLayout from '@/components/ConditionalLayout';
import ThemeScript from '@/components/ThemeScript';
import ResponsiveBanner from '@/components/ResponsiveBanner';
import SiteMetadata from '@/components/SiteMetadata';
import ReferralTracker from '@/components/ReferralTracker';
import Script from 'next/script';
import { Suspense } from 'react';
import { Mukta, Poppins } from 'next/font/google';

const mukta = Mukta({
  subsets: ['latin', 'devanagari'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-mukta',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

import { getSiteSettings } from '@/actions/settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName || 'The Desi Andaz';
  const version = settings.siteIcon ? settings.siteIcon.length : 'default';
  const siteIcon = `/favicon.ico?v=${version}`;

  return {
    metadataBase: new URL('https://www.thedesiandaz.com'),
    title: `${siteName} - देसी नज़रिया, सच्ची खबर`,
    description: `Premium Hindi News Portal - ${siteName}`,
    icons: {
      icon: siteIcon,
      shortcut: siteIcon,
      apple: siteIcon,
    },
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" data-scroll-behavior="smooth" className={`${mukta.variable} ${poppins.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var fa = document.createElement('link');
                fa.rel = 'stylesheet';
                fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
                document.head.appendChild(fa);

                var wf = document.createElement('link');
                wf.rel = 'stylesheet';
                wf.href = 'https://db.onlinewebfonts.com/c/aaba86b816ab0ba63ce0a0b74ef16072?family=Munshi+Devanagari+Semibold';
                document.head.appendChild(wf);
              })();
            `
          }}
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

