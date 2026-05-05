import { NextRequest, NextResponse } from "next/server"

// Correspondance Highlightly → TheSportsDB
const LEAGUE_MAP: Record<string, string> = {
  "33973":  "4328", // Premier League
  "119924": "4335", // La Liga
  "52695":  "4334", // Ligue 1
  "67162":  "4331", // Bundesliga
  "115669": "4332", // Serie A
  "75672":  "4337", // Eredivisie
  "80778":  "4344", // Primeira Liga
}

const SPORTSDB_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY ?? "139695"

// Cache mémoire TheSportsDB — 1 heure
const formCache = new Map<string, { data: Record<string, string>; ts: number }>()

async function getFormMap(highlightlyId: string): Promise<Record<string, string>> {
  const sportsdbId = LEAGUE_MAP[highlightlyId]
  if (!sportsdbId) return {}

  const cached = formCache.get(highlightlyId)
  if (cached && Date.now() - cached.ts < 3_600_000) return cached.data

  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/lookuptable.php?l=${sportsdbId}&s=2024-2025`
    const res  = await fetch(url, { next: { revalidate: 3600 } })
    const json = await res.json()

    const map: Record<string, string> = {}
    for (const row of json.table ?? []) {
      if (row.strTeam && row.strForm) {
        map[row.strTeam.toLowerCase()] = row.strForm
      }
    }

    formCache.set(highlightlyId, { data: map, ts: Date.now() })
    return map
  } catch {
    return {}
  }
}

function matchForm(formMap: Record<string, string>, teamName: string): string {
  const lower = teamName.toLowerCase()
  // Recherche exacte
  if (formMap[lower]) return formMap[lower]
  // Recherche partielle
  for (const [key, val] of Object.entries(formMap)) {
    if (key.includes(lower) || lower.includes(key)) return val
  }
  return ""
}

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId")
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 })

  // 1. Fetch Highlightly
  const res = await fetch(
    `https://sports.highlightly.net/football/standings?leagueId=${leagueId}&season=2025`,
    {
      headers: {
        "x-rapidapi-key":  process.env.HIGHLIGHTLY_KEY!,
        "x-rapidapi-host": "sports.highlightly.net",
      },
      cache: "no-store",
    }
  )

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: "API error", status: res.status, body }, { status: res.status })
  }

  const data = await res.json()

  // 2. Fetch forme TheSportsDB
  const formMap = await getFormMap(leagueId)

  // 3. Merge — injecter strForm dans chaque row
  if (Object.keys(formMap).length > 0) {
    const groups = data.groups ?? []
    for (const group of groups) {
      for (const row of group.standings ?? []) {
        const teamName = row.team?.name ?? ""
        row.strForm    = matchForm(formMap, teamName)
        // Copier aussi les champs TheSportsDB attendus par StandingsPanel
        row.strTeam    = teamName
        row.intRank    = String(row.position ?? "")
        row.intPlayed  = String(row.total?.games ?? "")
        row.intWin     = String(row.total?.wins ?? "")
        row.intLoss    = String(row.total?.loses ?? "")
        row.intPoints  = String(row.points ?? "")
        row.intGoalDifference = String(
          (row.total?.scoredGoals ?? 0) - (row.total?.receivedGoals ?? 0)
        )
        row.strBadge   = row.team?.logo ?? ""
        row.strDescription = row.description ?? ""
      }
    }
  }

  return NextResponse.json(data)
}