// lib/highlightly.ts

const BASE = "https://soccer.highlightly.net"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

const HEADERS = {
  "x-rapidapi-key":  KEY,
  "x-rapidapi-host": "soccer.highlightly.net",
}

// ─── Types Highlightly ─────────────────────────────────────
export interface HMatch {
  id: number
  round: string
  date: string
  country: {
    code: string
    name: string
    logo: string
  }
  state: {
    clock: number | null
    score: {
      current: string | null
      penalties: string | null
    }
    description: string
  }
  homeTeam: {
    id: number
    name: string
    logo: string | null
  }
  awayTeam: {
    id: number
    name: string
    logo: string | null
  }
  league: {
    id: number
    name: string
    logo: string | null
    season: number
  }
}

// Description → statut normalisé
export function normalizeStatus(description: string): string {
  const map: Record<string, string> = {
    "Not started":   "NS",
    "First half":    "1H",
    "Half time":     "HT",
    "Second half":   "2H",
    "Extra time":    "ET",
    "Penalties":     "P",
    "Finished":      "Match Finished",
    "Postponed":     "Postponed",
    "Cancelled":     "Cancelled",
    "Suspended":     "Suspended",
  }
  return map[description] ?? description
}

// Priorité d'affichage des ligues
const PRIORITY_LEAGUES = [
  "UEFA Champions League",
  "UEFA Europa League",
  "UEFA Europa Conference League",
  "English Premier League",
  "French Ligue 1",
  "Spanish La Liga",
  "German Bundesliga",
  "Italian Serie A",
  "Dutch Eredivisie",
  "Copa Libertadores",
  "Copa Sudamericana",
]

function sortGrouped(
  grouped: Record<string, HMatch[]>
): Record<string, HMatch[]> {
  const sorted: Record<string, HMatch[]> = {}

  for (const priority of PRIORITY_LEAGUES) {
    const key = Object.keys(grouped).find(
      (k) =>
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
export async function getMatchesByDate(
  dateStr: string
): Promise<Record<string, HMatch[]>> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const revalidate = dateStr === today ? 30 : 600

    const res = await fetch(
      `${BASE}/matches?date=${dateStr}&timezone=Europe/Paris`,
      {
        headers: HEADERS,
        next: { revalidate },
      }
    )

    if (!res.ok) {
      console.error("Highlightly error:", res.status)
      return {}
    }

    const data = await res.json()
    const matches: HMatch[] = data.data ?? []
    if (matches.length === 0) return {}

    // Grouper par ligue
    const grouped: Record<string, HMatch[]> = {}
    for (const match of matches) {
      const leagueName = match.league?.name ?? "Autre"
      if (!grouped[leagueName]) grouped[leagueName] = []
      grouped[leagueName].push(match)
    }

    return sortGrouped(grouped)
  } catch (err) {
    console.error("Highlightly fetch error:", err)
    return {}
  }
}