import { NextRequest, NextResponse } from "next/server"

const BASE = "https://soccer.highlightly.net"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

const PRIORITY_LEAGUE_IDS = [
  17423, 19374, 20093, 33973, 52695,
  119924, 58588, 115669, 75672, 123328,
  90990, 173537, 102053, 153113, 120775, 81629,
]

function sortGrouped(grouped: Record<string, any[]>): Record<string, any[]> {
  const sorted: Record<string, any[]> = {}
  for (const id of PRIORITY_LEAGUE_IDS.map(String)) {
    if (grouped[id]) {
      sorted[id] = grouped[id]
      delete grouped[id]
    }
  }
  const remaining = Object.entries(grouped).sort(([, a], [, b]) => {
    const nameA = a[0]?.league?.name ?? ""
    const nameB = b[0]?.league?.name ?? ""
    return nameA.localeCompare(nameB)
  })
  for (const [key, matches] of remaining) {
    sorted[key] = matches
  }
  return sorted
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date")
  if (!date) return NextResponse.json({}, { status: 400 })
  try {
    const res = await fetch(
      `${BASE}/matches?date=${date}&timezone=Europe/Paris`,
      {
        headers: {
          "x-rapidapi-key":  KEY,
          "x-rapidapi-host": "soccer.highlightly.net",
        },
        next: { revalidate: 30 },
      }
    )
    if (!res.ok) {
      console.error("Highlightly error:", res.status)
      return NextResponse.json({}, { status: res.status })
    }
    const data    = await res.json()
    const matches = data.data ?? []
    const grouped: Record<string, any[]> = {}
    for (const match of matches) {
      const key = String(match.league?.id ?? "unknown")
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(match)
    }
    return NextResponse.json(sortGrouped(grouped))
  } catch (err) {
    console.error("Route API error:", err)
    return NextResponse.json({})
  }
}
