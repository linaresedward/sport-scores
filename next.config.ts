import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unanxgqdzhcztpahgnxg.supabase.co',
      },
    ],
  },
}

export default nextConfig