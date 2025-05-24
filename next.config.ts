import type { NextConfig } from 'next/types';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false
      },
    ];
  },
}

export default nextConfig;
