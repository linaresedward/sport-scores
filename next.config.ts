import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'unanxgqdzhcztpahgnxg.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.thesportsdb.com',  // ← cette ligne doit être présente
      },
    ],
  },
}

export default nextConfig