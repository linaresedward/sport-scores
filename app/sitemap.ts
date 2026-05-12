import type { MetadataRoute } from 'next'
import { HIGHLIGHTLY_TO_SPORTSDB } from '@/lib/labels'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nyxscores.vercel.app'

const BASKETBALL_LEAGUES = ['NBA', 'NCAA', 'EuroLeague', 'LNB Pro A']
const HOCKEY_LEAGUES     = ['NHL', 'KHL', 'AHL', 'IIHF']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // ── Pages statiques ────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                      lastModified: now, changeFrequency: 'hourly',  priority: 1.0 },
    { url: `${SITE_URL}/basketball`,      lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/hockey`,          lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${SITE_URL}/tennis`,          lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
    { url: `${SITE_URL}/classements`,     lastModified: now, changeFrequency: 'daily',   priority: 0.7 },
  ]

  // ── Ligues football (Highlightly IDs) ─────────────────────
  const footballLeagues: MetadataRoute.Sitemap = Object.keys(HIGHLIGHTLY_TO_SPORTSDB).map(id => ({
    url: `${SITE_URL}/ligue/${id}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // ── Ligues basketball ──────────────────────────────────────
  const basketballLeagues: MetadataRoute.Sitemap = BASKETBALL_LEAGUES.map(name => ({
    url: `${SITE_URL}/basketball/league/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // ── Ligues hockey ──────────────────────────────────────────
  const hockeyLeagues: MetadataRoute.Sitemap = HOCKEY_LEAGUES.map(name => ({
    url: `${SITE_URL}/hockey/league/${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...footballLeagues, ...basketballLeagues, ...hockeyLeagues]
}
