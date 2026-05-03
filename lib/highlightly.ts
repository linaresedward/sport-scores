// lib/highlightly.ts

const BASE = "https://soccer.highlightly.net"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

export interface HMatch {
  id: number
  round: string
  date: string
  country: { code: string; name: string; logo: string }
  state: {
    clock: number | null
    score: { current: string | null; penalties: string | null }
    description: string
  }
  homeTeam: { id: number; name: string; logo: string | null }
  awayTeam: { id: number; name: string; logo: string | null }
  league: { id: number; name: string; logo: string | null; season: number }
}

export function normalizeStatus(description: string): string {
  const map: Record<string, string> = {
    "Not started": "NS",
    "First half":  "1H",
    "Half time":   "HT",
    "Second half": "2H",
    "Extra time":  "ET",
    "Penalties":   "P",
    "Finished":    "Match Finished",
    "Postponed":   "Postponed",
    "Cancelled":   "Cancelled",
    "Suspended":   "Suspended",
  }
  return map[description] ?? description
}


// IDs connus comme "non prioritaires" malgré un nom similaire à une ligue majeure
const NON_PRIORITY_IDS = new Set([
  "61205", // Serie A Brésil
  "62056", // Serie B Brésil
])

export async function getMatchesByDate(
  dateStr: string
): Promise<Record<string, HMatch[]>> {
  try {
    const res = await fetch(`/api/matches?date=${dateStr}`)
    if (!res.ok) return {}
    // La route API trie déjà — on retourne tel quel
    return await res.json()
  } catch (err) {
    console.error("getMatchesByDate error:", err)
    return {}
  }
}
