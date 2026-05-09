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
  const seenIds = new Set<number>()

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
        if (seenIds.has(m.id)) continue // déduplique les matchs identiques
        seenIds.add(m.id)
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
