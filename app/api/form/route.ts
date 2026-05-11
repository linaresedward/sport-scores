import { NextRequest, NextResponse } from "next/server"

// Table de correspondance Highlightly → TheSportsDB
const LEAGUE_MAP: Record<string, { sportsdbId: string; season: string }> = {
  "33973":  { sportsdbId: "4328", season: "2025-2026" }, // Premier League
  "119924": { sportsdbId: "4335", season: "2025-2026" }, // La Liga
  "52695":  { sportsdbId: "4334", season: "2025-2026" }, // Ligue 1
  "67162":  { sportsdbId: "4331", season: "2025-2026" }, // Bundesliga
  "115669": { sportsdbId: "4332", season: "2025-2026" }, // Serie A
  "75672":  { sportsdbId: "4337", season: "2025-2026" }, // Eredivisie
  "80778":  { sportsdbId: "4344", season: "2025-2026" }, // Primeira Liga
}

const SPORTSDB_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY ?? "139695"

// Cache en mémoire — 15 minutes
const cache = new Map<string, { data: Record<string, string>; ts: number }>()

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId") ?? ""
  const mapping  = LEAGUE_MAP[leagueId]

  if (!mapping) {
    return NextResponse.json({}, { status: 200 })
  }

  const cacheKey = leagueId
  const cached   = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < 900_000) {
    return NextResponse.json(cached.data)
  }

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/lookuptable.php?l=${mapping.sportsdbId}&s=${mapping.season}`
    const res  = await fetch(url, { next: { revalidate: 900 } })
    const json = await res.json()

    // Retourne { "TeamName": "WWDLW", ... }
    const formMap: Record<string, string> = {}
    for (const row of json.table ?? []) {
      if (row.strTeam && row.strForm) {
        formMap[row.strTeam] = row.strForm
      }
    }

    cache.set(cacheKey, { data: formMap, ts: Date.now() })
    return NextResponse.json(formMap)
  } catch {
    return NextResponse.json({})
  }
}