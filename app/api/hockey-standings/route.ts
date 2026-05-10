import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/hockey"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

// Mapping nom ligue → ID Highlightly hockey (pour faciliter les recherches par nom)
export const HOCKEY_LEAGUE_IDS: Record<string, string> = {
  "NHL":        "49291",
  "AHL":        "50142",
  "ECHL":       "50993",
  "OHL":        "3337",
  "PWHL Women": "222895",
  "VHL":        "31420",
  "MHL":        "32271",
}

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

    // Normaliser les groupes pour le HockeyStandingsModal
    const groups = raw.groups.map((g: any) => ({
      name: g.name,
      standings: (g.standings ?? []).map((row: any) => ({
        position:      row.position,
        team:          row.team,
        gamesPlayed:   row.gamesPlayed ?? 0,
        wins:          row.wins ?? 0,           // total wins (includes OT)
        winsOvertime:  row.winsOvertime ?? 0,   // VP — victoires en prolongation
        losesOvertime: row.losesOvertime ?? 0,  // DP — défaites en prolongation
        loses:         row.loses ?? 0,          // total losses (includes OT)
        scoredGoals:   row.scoredGoals ?? 0,
        receivedGoals: row.receivedGoals ?? 0,
        // Points NHL : wins×2 + losesOvertime×1
        points: (row.wins ?? 0) * 2 + (row.losesOvertime ?? 0),
      })),
    }))

    const data = { groups, leagueName: raw.league?.name ?? "" }
    cache.set(leagueId, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ groups: [] })
  }
}
