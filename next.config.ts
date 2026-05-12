import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'unanxgqdzhcztpahgnxg.supabase.co' },
      { protocol: 'https', hostname: '**.thesportsdb.com' },
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
      { protocol: 'https', hostname: 'highlightly.net' },
      { protocol: 'https', hostname: '**.highlightly.net' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
    // Formats modernes pour de meilleures performances
    formats: ['image/avif', 'image/webp'],
  },

  // Headers HTTP pour le preconnect et la sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Preconnect vers les APIs externes → réduit la latence DNS/TLS
          { key: 'Link', value: '<https://www.thesportsdb.com>; rel=preconnect, <https://sports.highlightly.net>; rel=preconnect' },
          // Sécurité de base
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Cache long pour les assets statiques
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  // Compression activée (déjà par défaut, explicite pour la clarté)
  compress: true,
}

export default nextConfig
