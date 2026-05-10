import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/hockey"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = {
  "x-rapidapi-key":  KEY,
  "x-rapidapi-host": "sports.highlightly.net",
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({}, { status: 400 })

  const grouped: Record<string, any[]> = {}
  // Déduplique par (leagueId-homeTeamId-awayTeamId) : Highlightly crée parfois
  // deux entrées pour le même match avec des IDs différents
  const seenMatchKeys = new Set<string>()

  try {
    let offset = 0
    while (offset < 1000) {
      const res: Response = await fetch(
        `${BASE}/matches?date=${date}&timezone=UTC&limit=100&offset=${offset}`,
        { headers: HEADERS, cache: "no-store" }
      )
      if (!res.ok) break
      const data: any    = await res.json()
      const matches: any[] = data.data ?? []

      for (const m of matches) {
        // Filtrer par date exacte — Highlightly retourne parfois des matchs d'autres jours
        const matchDate: string = (m.date ?? "").split("T")[0]
        if (matchDate !== date) continue

        const matchKey = `${m.league?.id}-${m.homeTeam?.id}-${m.awayTeam?.id}`
        if (seenMatchKeys.has(matchKey)) continue
        seenMatchKeys.add(matchKey)
        const key = String(m.league?.id ?? "unknown")
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(m)
      }
      if (matches.length < 100) break
      offset += 100
    }
  } catch {
    return NextResponse.json({})
  }

  return NextResponse.json(grouped)
}
