import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/hockey"
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
    const data = await res.json()
    if (!data.groups?.length) return NextResponse.json({ groups: [] })

    // Normaliser chaque standing pour StandingsPanel
    for (const group of data.groups) {
      for (const row of group.standings ?? []) {
        row.intRank          = String(row.position ?? "")
        row.strTeam          = row.team?.name ?? ""
        row.strBadge         = row.team?.logo ? `/api/logo?url=${encodeURIComponent(row.team.logo)}` : ""
        row.intPlayed        = String(row.total?.games ?? "")
        row.intWin           = String(row.total?.wins ?? "")
        row.intLoss          = String(row.total?.loses ?? "")
        row.intDraw          = String(row.total?.draws ?? "")
        row.intPoints        = String(row.points ?? "")
        row.intGoalDifference= String((row.total?.scoredGoals ?? 0) - (row.total?.receivedGoals ?? 0))
        row.intGoalsFor      = String(row.total?.scoredGoals ?? "")
        row.intGoalsAgainst  = String(row.total?.receivedGoals ?? "")
        row.strForm          = row.strForm ?? ""
        row.strDescription   = row.description ?? ""
      }
    }

    cache.set(leagueId, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ groups: [] })
  }
}
