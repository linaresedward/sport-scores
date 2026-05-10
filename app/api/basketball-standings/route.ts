import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/basketball"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

const cache = new Map<string, { data: any; ts: number }>()

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId")
  if (!leagueId) return NextResponse.json({ groups: [] }, { status: 400 })

  const cached = cache.get(leagueId)
  if (cached && Date.now() - cached.ts < 3_600_000) return NextResponse.json(cached.data)

  try {
    const res = await fetch(
      `${BASE}/standings?leagueId=${leagueId}&season=2025`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    )
    if (!res.ok) return NextResponse.json({ groups: [] })
    const raw = await res.json()
    if (!raw.groups?.length) return NextResponse.json({ groups: [] })

    // Normaliser pour BasketStandingsModal
    const groups = raw.groups.map((g: any) => ({
      name: g.name,
      standings: (g.standings ?? []).map((row: any) => ({
        position:      row.position,
        team:          row.team,
        gamesPlayed:   row.gamesPlayed ?? 0,
        wins:          row.wins ?? 0,
        loses:         row.loses ?? 0,
        scoredPoints:  row.scoredPoints ?? 0,
        receivedPoints:row.receivedPoints ?? 0,
        // Win% NBA style
        pct: row.gamesPlayed > 0 ? (row.wins / row.gamesPlayed).toFixed(3) : "0.000",
        // Points NBA : wins × 2 (approximation, NBA doesn't use points like this but it's for sorting)
      })),
    }))

    const data = { groups, leagueName: raw.league?.name ?? "" }
    cache.set(leagueId, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ groups: [] })
  }
}
