import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/podcast',
        destination: 'https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d',
        permanent: true,
      },
      {
        source: '/certificate',
        destination: 'https://prgi.gov.in/registration-title-details-data/362243ff-eda1-4502-8134-db4efd89261d',
        permanent: true,
      },
      {
        source: '/affiliate',
        destination: '/affiliates',
        permanent: true,
      },
      {
        source: '/affiliate/:path*',
        destination: '/affiliates/:path*',
        permanent: true,
      },
      {
        source: '/reporter',
        destination: '/correspondent',
        permanent: true,
      },
      {
        source: '/reporter/:path*',
        destination: '/correspondent/:path*',
        permanent: true,
      },
      {
        source: '/admin/reporters',
        destination: '/admin/correspondents',
        permanent: true,
      },
      {
        source: '/admin/reporters/:path*',
        destination: '/admin/correspondents/:path*',
        permanent: true,
      },
      {
        source: '/reporter-verification',
        destination: '/correspondent-verification',
        permanent: true,
      },
      {
        source: '/reporter-verification/:path*',
        destination: '/correspondent-verification/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/correspondent',
        destination: '/reporter',
      },
      {
        source: '/correspondent/:path*',
        destination: '/reporter/:path*',
      },
      {
        source: '/admin/correspondents',
        destination: '/admin/reporters',
      },
      {
        source: '/admin/correspondents/:path*',
        destination: '/admin/reporters/:path*',
      },
      {
        source: '/correspondent-verification',
        destination: '/reporter-verification',
      },
      {
        source: '/correspondent-verification/:path*',
        destination: '/reporter-verification/:path*',
      },
    ];
  },
};

export default nextConfig;
