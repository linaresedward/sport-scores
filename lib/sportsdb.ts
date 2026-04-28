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

// Ligues affichées en premier (ordre de priorité)
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

export async function getAllMatchesByDate(
  dateStr: string
): Promise<Record<string, Match[]>> {
  try {
    const url = `${BASE_URL}/eventsday.php?d=${dateStr}&s=Soccer`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return {}
    const data = await res.json()
    const events: Match[] = data.events || []
    if (events.length === 0) return {}

    // Grouper par ligue — SANS filtre
    const grouped: Record<string, Match[]> = {}
    for (const match of events) {
      const league = match.strLeague || 'Autre'
      if (!grouped[league]) grouped[league] = []
      grouped[league].push(match)
    }

    // Trier : prioritaires en premier, reste après par ordre alphabétique
    const sorted: Record<string, Match[]> = {}

    // 1. Ligues prioritaires dans l'ordre défini
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

    // 2. Reste des ligues triées alphabétiquement
    const remaining = Object.keys(grouped).sort()
    for (const league of remaining) {
      sorted[league] = grouped[league]
    }

    return sorted
  } catch (err) {
    console.error('Erreur getAllMatchesByDate:', err)
    return {}
  }
}

// ─── Fonctions legacy conservées ─────────────────────────────────
export async function getRecentMatches(leagueId: string): Promise<Match[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventspastleague.php?id=${leagueId}`,
      { next: { revalidate: 60 } }
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
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch { return [] }
}

export async function getTodayMatches(): Promise<Match[]> {
  const today = new Date().toISOString().split('T')[0]
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