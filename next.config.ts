import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'unanxgqdzhcztpahgnxg.supabase.co' },
      { protocol: 'https', hostname: '**.thesportsdb.com' },
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
      // ← Ajouté pour les logos de ligues et équipes Highlightly
      { protocol: 'https', hostname: 'highlightly.net' },
      { protocol: 'https', hostname: '**.highlightly.net' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },
}

export default nextConfig