import { NextRequest, NextResponse } from "next/server"

const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY ?? "139695"

// IDs TheSportsDB connus pour les ligues basket
const BASKET_IDS: Record<string, string> = {
  "NBA": "4387",
  "French LNB": "4423",
  "LNB Pro A": "4423",
  "Spanish Liga ACB": "4408",
  "Spanish ACB": "4408",
  "Turkish Basketbol Super Ligi": "4475",
  "BNXT League": "5270",
  "WNBA": "4516",
  "Chinese CBA": "4442",
  "Argentine LNB": "4734",
  "Greek Basket League": "4452",
  "Lithuanian LKL": "4478",
  "Adriatic ABA League": "4477",
  "Basketball Champions League": "4548",
  "EuroLeague Basketball": "4386",
  "EuroCup": "4426",
  "French LNB Pro B": "4577",
}

const cache = new Map<string, { data: any; ts: number }>()

export async function GET(req: NextRequest) {
  const leagueId    = req.nextUrl.searchParams.get("leagueId")    // TheSportsDB ID direct
  const leagueName  = req.nextUrl.searchParams.get("leagueName")  // ou nom pour lookup

  const sdbId = leagueId ?? (leagueName ? BASKET_IDS[leagueName] : null)
  if (!sdbId) return NextResponse.json({ error: "Unknown league", groups: [] }, { status: 404 })

  const cached = cache.get(sdbId)
  if (cached && Date.now() - cached.ts < 3_600_000) return NextResponse.json(cached.data)

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${KEY}/lookuptable.php?l=${sdbId}&s=2025-2026`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`TheSportsDB error ${res.status}`)
    const json = await res.json()
    const table: any[] = json.table ?? []
    if (table.length === 0) return NextResponse.json({ groups: [] })

    // Normaliser au format attendu par StandingsPanel
    const standings = table.map(row => ({
      position: parseInt(row.intRank ?? "0"),
      team:     { id: parseInt(row.idTeam ?? "0"), name: row.strTeam ?? "", logo: row.strBadge ?? "" },
      total:    {
        games:        parseInt(row.intPlayed ?? "0"),
        wins:         parseInt(row.intWin ?? "0"),
        loses:        parseInt(row.intLoss ?? "0"),
        draws:        parseInt(row.intDraw ?? "0"),
        scoredGoals:  parseInt(row.intGoalsFor ?? "0"),
        receivedGoals:parseInt(row.intGoalsAgainst ?? "0"),
      },
      points:       parseInt(row.intPoints ?? "0"),
      // Champs déjà normalisés pour StandingsPanel
      intRank:           row.intRank ?? "",
      strTeam:           row.strTeam ?? "",
      strBadge:          row.strBadge ?? "",
      intPlayed:         row.intPlayed ?? "",
      intWin:            row.intWin ?? "",
      intLoss:           row.intLoss ?? "",
      intDraw:           row.intDraw ?? "",
      intPoints:         row.intPoints ?? "",
      intGoalDifference: row.intGoalDifference ?? "",
      intGoalsFor:       row.intGoalsFor ?? "",
      intGoalsAgainst:   row.intGoalsAgainst ?? "",
      strForm:           row.strForm ?? "",
      strDescription:    row.strDescription ?? "",
      idTeam:            row.idTeam ?? "",
    }))

    const data = { groups: [{ name: "Classement", standings }] }
    cache.set(sdbId, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ groups: [] })
  }
}
