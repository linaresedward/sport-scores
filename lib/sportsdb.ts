// lib/sportsdb.ts

const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${process.env.NEXT_PUBLIC_SPORTSDB_KEY}`

export const LEAGUE_IDS = {
  championsLeague: '4480',
  europaLeague:    '4481',
  ligue1:          '4334',
  premierLeague:   '4328',
  laLiga:          '4335',
  bundesliga:      '4331',
  serieA:          '4332',
  eredivisie:      '4337',
  ligaPortugal:    '4344',
}

export const ALLOWED_LEAGUES = new Set([
  'French Ligue 1',
  'English Premier League',
  'Spanish La Liga',
  'German Bundesliga',
  'Italian Serie A',
  'UEFA Champions League',
])

const PRIORITY_LEAGUES = [
  'UEFA Champions League',
  'UEFA Europa League',
  'UEFA Europa Conference League',
  'English Premier League',
  'French Ligue 1',
  'Spanish La Liga',
  'German Bundesliga',
  'Italian Serie A',
  'Dutch Eredivisie',
  'Copa Libertadores',
  'Copa Sudamericana',
]

export interface Match {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  idHomeTeam: string
  idAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  dateEvent: string
  strTime: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  strLeague: string
  idLeague: string
  strVenue: string | null
  intMinute?: string | null
}

// ─── Helpers ──────────────────────────────────────────────
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getCacheOption(dateStr: string): RequestInit {
  const today = getTodayStr()
  if (dateStr === today) {
    // Aujourd'hui : revalidation toutes les 60s (matchs live)
    return { next: { revalidate: 60 } }
  }
  // Hier ou demain : revalidation toutes les 10min
  return { next: { revalidate: 600 } }
}

function sortGrouped(grouped: Record<string, Match[]>): Record<string, Match[]> {
  const sorted: Record<string, Match[]> = {}

  for (const priority of PRIORITY_LEAGUES) {
    const key = Object.keys(grouped).find(k =>
      k.toLowerCase().includes(priority.toLowerCase()) ||
      priority.toLowerCase().includes(k.toLowerCase())
    )
    if (key && grouped[key]) {
      sorted[key] = grouped[key]
      delete grouped[key]
    }
  }

  for (const league of Object.keys(grouped).sort()) {
    sorted[league] = grouped[league]
  }

  return sorted
}

// ─── Fonction principale ───────────────────────────────────
export async function getAllMatchesByDate(
  dateStr: string
): Promise<Record<string, Match[]>> {
  try {
    const url = `${BASE_URL}/eventsday.php?d=${dateStr}&s=Soccer`
    const res = await fetch(url, getCacheOption(dateStr))
    if (!res.ok) return {}
    const data = await res.json()
    const events: Match[] = data.events || []
    if (events.length === 0) return {}

    const grouped: Record<string, Match[]> = {}
    for (const match of events) {
      const league = match.strLeague || 'Autre'
      if (!grouped[league]) grouped[league] = []
      grouped[league].push(match)
    }

    return sortGrouped(grouped)
  } catch (err) {
    console.error('Erreur getAllMatchesByDate:', err)
    return {}
  }
}

// ─── Fonctions legacy ─────────────────────────────────────
export async function getRecentMatches(leagueId: string): Promise<Match[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventspastleague.php?id=${leagueId}`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch { return [] }
}

export async function getUpcomingMatches(leagueId: string): Promise<Match[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventsnextleague.php?id=${leagueId}`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch { return [] }
}

export async function getTodayMatches(): Promise<Match[]> {
  const today = getTodayStr()
  const grouped = await getAllMatchesByDate(today)
  return Object.values(grouped).flat()
}

export async function getYesterdayMatches(): Promise<Match[]> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = yesterday.toISOString().split('T')[0]
  const grouped = await getAllMatchesByDate(date)
  return Object.values(grouped).flat()
}