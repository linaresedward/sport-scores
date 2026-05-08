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

  try {
    const res = await fetch(
      `${BASE}/matches?date=${date}&timezone=UTC&limit=100`,
      { headers: HEADERS, cache: "no-store" }
    )
    if (!res.ok) return NextResponse.json({})

    const data   = await res.json()
    const matches = data.data ?? []

    // Grouper par ligue
    const grouped: Record<string, any[]> = {}
    for (const m of matches) {
      const key = String(m.league?.id ?? "unknown")
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(m)
    }

    return NextResponse.json(grouped)
  } catch {
    return NextResponse.json({})
  }
}
