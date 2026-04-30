import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://soccer.highlightly.net"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""

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

function sortGrouped(grouped: Record<string, any[]>): Record<string, any[]> {
  const sorted: Record<string, any[]> = {}
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
      const league = match.league?.name ?? "Autre"
      if (!grouped[league]) grouped[league] = []
      grouped[league].push(match)
    }

    return NextResponse.json(sortGrouped(grouped))
  } catch (err) {
    console.error("Route API error:", err)
    return NextResponse.json({})
  }
}