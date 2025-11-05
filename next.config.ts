import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lxfnryfvovzpjctyfuza.storage.supabase.co',
        pathname: '/storage/v1/object/public/Counter_images/**'
      }
    ]
  }
};

export default nextConfig;
