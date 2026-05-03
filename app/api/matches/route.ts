import { NextRequest, NextResponse } from "next/server"

const BASE = "https://sports.highlightly.net/football"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

// ⚠️ Ordre exact d'affichage des ligues prioritaires
const PRIORITY_LEAGUE_IDS = [
  17423,  // UEFA Champions League
  19374,  // UEFA Europa League
  20696,  // UEFA Conference League
  28543,  // FIFA World Cup
  6132,   // UEFA Euro
  117551, // Africa Cup of Nations
  112759, // Copa América
  33973,  // Premier League
  67162,  // Bundesliga
  119924, // La Liga
  52695,  // Ligue 1
  115669, // Serie A Italie
  75672,  // Eredivisie
  80778,  // Primeira Liga
  173537,  // Süper Lig
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

  // 2. Reste → alphabétique, Brésil toujours en bas
  const remaining = Object.entries(grouped).sort(([keyA, a], [keyB, b]) => {
    const aLast = NON_PRIORITY_IDS.has(keyA)
    const bLast = NON_PRIORITY_IDS.has(keyB)
    if (aLast && !bLast) return 1
    if (bLast && !aLast) return -1
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
    let totalCount = Infinity

    while (offset < totalCount && offset < 300) {
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
      console.log("Highlightly status:", res.status, "date:", date)
      if (!res.ok) break

      const data = await res.json()
      console.log("RAW DATA:", JSON.stringify(data).slice(0, 500))
      const matches: any[] = data.data ?? []
      totalCount = data.pagination?.totalCount ?? 0

      for (const match of matches) {
        const key = String(match.league?.id ?? "unknown")
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(match)
      }

      offset += limit
      if (matches.length === 0) break
    }
  } catch (err) {
    console.error("Highlightly error:", err)
  }

  return NextResponse.json(sortGrouped(grouped))
}