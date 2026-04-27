const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3'

export const LEAGUE_IDS = {
  ligue1: '4334',
  premierLeague: '4328',
  laLiga: '4335',
  bundesliga: '4331',
  serieA: '4332',
}

export const ALLOWED_LEAGUES = new Set([
  'French Ligue 1',
  'English Premier League',
  'Spanish La Liga',
  'German Bundesliga',
  'Italian Serie A',
  'UEFA Champions League',
])

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

export async function getRecentMatches(leagueId: string): Promise<Match[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/eventspastleague.php?id=${leagueId}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.events || []
  } catch {
    return []
  }
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
  } catch {
    return []
  }
}

export async function getTodayMatches(): Promise<Match[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(
      `${BASE_URL}/eventsday.php?d=${today}&s=Soccer`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.events || []).filter((m: Match) => ALLOWED_LEAGUES.has(m.strLeague))
  } catch {
    return []
  }
}

export async function getYesterdayMatches(): Promise<Match[]> {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]
    const res = await fetch(
      `${BASE_URL}/eventsday.php?d=${date}&s=Soccer`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.events || []).filter((m: Match) => ALLOWED_LEAGUES.has(m.strLeague))
  } catch {
    return []
  }
}