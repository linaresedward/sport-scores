import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/basketball"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({}, { status: 400 })

  const grouped: Record<string, any[]> = {}
  const seenKeys = new Set<string>()

  try {
    let offset = 0
    while (offset < 1000) {
      const res = await fetch(
        `${BASE}/matches?date=${date}&timezone=UTC&limit=100&offset=${offset}`,
        { headers: HEADERS, cache: "no-store" }
      )
      if (!res.ok) break
      const data    = await res.json()
      const matches = data.data ?? []

      for (const m of matches) {
        const key = `${m.league?.id}-${m.homeTeam?.id}-${m.awayTeam?.id}`
        if (seenKeys.has(key)) continue
        seenKeys.add(key)
        const leagueKey = String(m.league?.id ?? "unknown")
        if (!grouped[leagueKey]) grouped[leagueKey] = []
        grouped[leagueKey].push(m)
      }
      if (matches.length < 100) break
      offset += 100
    }
  } catch (e) {
    console.error("Highlightly basketball error:", e)
  }

  return NextResponse.json(grouped)
}
