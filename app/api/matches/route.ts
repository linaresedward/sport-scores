import { NextRequest, NextResponse } from "next/server"

const BASE = "https://sports.highlightly.net/football"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

// ⚠️ Ordre exact d'affichage des ligues prioritaires (IDs Highlightly réels)
const PRIORITY_LEAGUE_IDS = [
  2486,   // UEFA Champions League
  3337,   // UEFA Europa League
  722432, // UEFA Conference League
  1635,   // FIFA World Cup
  4188,   // UEFA Euro Championship
  5890,   // Africa Cup of Nations
  8443,   // Copa América
  33973,  // Premier League (England)
  67162,  // Bundesliga
  119924, // La Liga
  52695,  // Ligue 1
  115669, // Serie A
  75672,  // Eredivisie
  80778,  // Primeira Liga
  173537, // Süper Lig
]

const NON_PRIORITY_IDS = new Set(["61205", "62056"]) // Serie A / B Brésil → toujours en bas

function sortGrouped(grouped: Record<string, any[]>): Record<string, any[]> {
  const sorted: Record<string, any[]> = {}

  // 1. Ligues prioritaires dans l'ordre exact défini
  for (const id of PRIORITY_LEAGUE_IDS.map(String)) {
    if (grouped[id]) {
      sorted[id] = grouped[id]
      delete grouped[id]
    }
  }

  // 2. Reste → alphabétique par pays puis par nom de ligue, Brésil toujours en bas
  const remaining = Object.entries(grouped).sort(([keyA, a], [keyB, b]) => {
    const aLast = NON_PRIORITY_IDS.has(keyA)
    const bLast = NON_PRIORITY_IDS.has(keyB)
    if (aLast && !bLast) return 1
    if (bLast && !aLast) return -1
    const cmp = (a[0]?.country?.name ?? "").localeCompare(b[0]?.country?.name ?? "")
    if (cmp !== 0) return cmp
    return (a[0]?.league?.name ?? "").localeCompare(b[0]?.league?.name ?? "")
  })

  for (const [key, matches] of remaining) {
    sorted[key] = matches
  }

  return sorted
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({}, { status: 400 })

  const grouped: Record<string, any[]> = {}

  try {
    let offset = 0
    const limit = 100

    // Boucle jusqu'à épuisement des pages — sans dépendre de totalCount
    // (Highlightly ne retourne pas toujours pagination.totalCount de façon fiable)
    while (offset < 2000) {
      const res = await fetch(
        `${BASE}/matches?date=${date}&timezone=UTC&limit=${limit}&offset=${offset}`,
        {
          headers: {
            "x-rapidapi-key":  KEY,
            "x-rapidapi-host": "sports.highlightly.net",
          },
          cache: "no-store",
        }
      )
      if (!res.ok) break

      const data = await res.json()
      const matches: any[] = data.data ?? []

      for (const match of matches) {
        const key = String(match.league?.id ?? "unknown")
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(match)
      }

      // Dernière page : moins de résultats que demandé → on arrête
      if (matches.length < limit) break
      offset += limit
    }
  } catch (err) {
    console.error("Highlightly error:", err)
  }

  return NextResponse.json(sortGrouped(grouped))
}