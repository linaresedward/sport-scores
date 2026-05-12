import { NextResponse } from "next/server"

const SPORTSDB_KEY = "139695"

// Dates clés de la saison NBA 2025-2026
const PLAYIN_START  = "2026-04-13"
const PLAYIN_END    = "2026-04-17"
const ROUND1_START  = "2026-04-18"
const ROUND2_START  = "2026-05-01"
const SF_START      = "2026-05-15"
const FINALS_START  = "2026-05-28"

const EAST = new Set([
  "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
  "Chicago Bulls", "Cleveland Cavaliers", "Detroit Pistons", "Indiana Pacers",
  "Miami Heat", "Milwaukee Bucks", "New York Knicks", "Orlando Magic",
  "Philadelphia 76ers", "Toronto Raptors", "Washington Wizards",
])

interface Series {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: number; startDate: string; done: boolean
  conference: 'East' | 'West' | 'Finals'
}

function getRound(startDate: string): string {
  if (startDate >= FINALS_START) return "Finale"
  if (startDate >= SF_START)     return "Demi-finales"
  if (startDate >= ROUND2_START) return "Quarts de finale"
  if (startDate >= ROUND1_START) return "1/8 de finale"
  return "Promotion"
}

const cache = new Map<string, { data: any; ts: number }>()

export async function GET() {
  const cached = cache.get("nba")
  if (cached && Date.now() - cached.ts < 1_800_000) return NextResponse.json(cached.data)

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v2/json/schedule/league/4387/2025-2026`,
      { headers: { "X-API-KEY": SPORTSDB_KEY, "Accept": "application/json" }, next: { revalidate: 1800 } }
    )
    if (!res.ok) return NextResponse.json({ rounds: [] })
    const json = await res.json()
    const allGames: any[] = json[Object.keys(json)[0]] ?? []

    // Exclure uniquement les jeux play-in (intRound 26 et 400) — les autres sont des playoffs
    const PLAYIN_ROUNDS = new Set([26, 400])
    const playoffGames = allGames.filter(g => {
      const round = parseInt(g.intRound ?? '0')
      return g.dateEvent >= ROUND1_START && !PLAYIN_ROUNDS.has(round)
    })

    // Grouper par paire d'équipes
    const seriesMap = new Map<string, Series>()
    playoffGames.forEach(g => {
      const [tA, tB] = [g.strHomeTeam, g.strAwayTeam].sort()
      const key = tA + "|" + tB
      if (!seriesMap.has(key)) {
        const confA = EAST.has(tA) ? 'East' : 'West'
        const confB = EAST.has(tB) ? 'East' : 'West'
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
        else       { if (g.strAwayTeam === tA) s.winsA++; else s.winsB++ }
      }
      if (s.winsA >= 4 || s.winsB >= 4) s.done = true
    })

    // Regrouper par round (filtrer séries avec >= 2 jeux = vrais séries éliminatoires)
    const roundsMap = new Map<string, Series[]>()
    const ROUND_ORDER = ["Promotion","1/8 de finale","Quarts de finale","Demi-finales","Finale"]
    ROUND_ORDER.forEach(r => roundsMap.set(r, []))

    seriesMap.forEach(s => {
      if (s.games < 2) return
      const round = getRound(s.startDate)
      roundsMap.get(round)?.push(s)
    })

    // Marquer done=true si une équipe de la série apparaît dans le round suivant
    const CONF_ROUND_ORDER = ["1/8 de finale", "Quarts de finale", "Demi-finales", "Finale"]
    for (let ri = 0; ri < CONF_ROUND_ORDER.length - 1; ri++) {
      const nextSeries = roundsMap.get(CONF_ROUND_ORDER[ri + 1]) ?? []
      const teamsInNext = new Set(nextSeries.flatMap(s => [s.teamA, s.teamB]))
      for (const s of (roundsMap.get(CONF_ROUND_ORDER[ri]) ?? [])) {
        if (teamsInNext.has(s.teamA) || teamsInNext.has(s.teamB)) s.done = true
      }
    }

    // Convertir en tableau de rounds
    const rounds = ROUND_ORDER
      .map(name => ({ name, series: (roundsMap.get(name) ?? []).sort((a,b) => a.startDate.localeCompare(b.startDate)) }))
      .filter(r => r.series.length > 0)

    const data = { rounds }
    cache.set("nba", { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ rounds: [] })
  }
}
