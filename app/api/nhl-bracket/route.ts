import { NextResponse } from "next/server"

const SPORTSDB_KEY = "139695"
const NHL_LEAGUE   = "4380"

const NHL_R1_START  = "2026-04-18"
const NHL_R2_START  = "2026-05-03"
const NHL_SF_START  = "2026-05-16"
const NHL_FIN_START = "2026-05-30"

const EAST_NHL = new Set([
  "Boston Bruins", "Buffalo Sabres", "Carolina Hurricanes", "Columbus Blue Jackets",
  "Detroit Red Wings", "Florida Panthers", "Montreal Canadiens", "New Jersey Devils",
  "New York Islanders", "New York Rangers", "Ottawa Senators", "Philadelphia Flyers",
  "Pittsburgh Penguins", "Tampa Bay Lightning", "Toronto Maple Leafs", "Washington Capitals",
])

interface NHLSeries {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: number; startDate: string; done: boolean
  conference: 'East' | 'West' | 'Finals'
}

function getNHLRound(date: string): string {
  if (date >= NHL_FIN_START) return "Finale Stanley Cup"
  if (date >= NHL_SF_START)  return "Demi-finales"
  if (date >= NHL_R2_START)  return "Quarts de finale"
  return "1/8 de finale"
}

const cache = new Map<string, { data: any; ts: number }>()

export async function GET() {
  const cached = cache.get("nhl")
  if (cached && Date.now() - cached.ts < 1_800_000) return NextResponse.json(cached.data)

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v2/json/schedule/league/${NHL_LEAGUE}/2025-2026`,
      { headers: { "X-API-KEY": SPORTSDB_KEY, "Accept": "application/json" }, next: { revalidate: 1800 } }
    )
    if (!res.ok) return NextResponse.json({ rounds: [] })
    const json = await res.json()
    const allGames: any[] = json.schedule ?? json[Object.keys(json)[0]] ?? []

    // Playoffs uniquement — pas de play-in en NHL, filtrer par date
    const playoffGames = allGames.filter(g => g.dateEvent >= NHL_R1_START)

    const seriesMap = new Map<string, NHLSeries>()
    playoffGames.forEach(g => {
      const [tA, tB] = [g.strHomeTeam, g.strAwayTeam].sort()
      const key = tA + "|" + tB
      if (!seriesMap.has(key)) {
        const confA = EAST_NHL.has(tA) ? 'East' : 'West'
        const confB = EAST_NHL.has(tB) ? 'East' : 'West'
        const conference: 'East' | 'West' | 'Finals' = confA === confB ? confA : 'Finals'
        seriesMap.set(key, {
          teamA: tA, teamB: tB,
          badgeA: g.strHomeTeam === tA ? g.strHomeTeamBadge : g.strAwayTeamBadge,
          badgeB: g.strHomeTeam === tA ? g.strAwayTeamBadge : g.strHomeTeamBadge,
          winsA: 0, winsB: 0, games: 0, startDate: g.dateEvent, done: false, conference,
        })
      }
      const s = seriesMap.get(key)!
      s.games++
      if (g.intHomeScore !== null && g.intAwayScore !== null) {
        const hWin = parseInt(g.intHomeScore) > parseInt(g.intAwayScore)
        if (hWin) { if (g.strHomeTeam === tA) s.winsA++; else s.winsB++ }
        else      { if (g.strAwayTeam === tA) s.winsA++; else s.winsB++ }
      }
      if (s.winsA >= 4 || s.winsB >= 4) s.done = true
    })

    const ROUND_ORDER = ["1/8 de finale", "Quarts de finale", "Demi-finales", "Finale Stanley Cup"]
    const roundsMap = new Map<string, NHLSeries[]>()
    ROUND_ORDER.forEach(r => roundsMap.set(r, []))

    seriesMap.forEach(s => {
      const round = getNHLRound(s.startDate)
      roundsMap.get(round)?.push(s)
    })

    const rounds = ROUND_ORDER
      .map(name => ({ name, series: (roundsMap.get(name) ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate)) }))
      .filter(r => r.series.length > 0)

    const data = { rounds }
    cache.set("nhl", { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ rounds: [] })
  }
}
