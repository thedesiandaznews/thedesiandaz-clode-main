import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
