import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'unanxgqdzhcztpahgnxg.supabase.co' },
      { protocol: 'https', hostname: '**.thesportsdb.com' },
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
    ],
  },
}

export default nextConfig