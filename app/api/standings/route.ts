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
  "173537": "4339", // Süper Lig — nécessaire pour strForm + strDescription (zones européennes)
}

// Saisons TheSportsDB spéciales (quand la saison active n'est pas "2025-2026")
const SPECIAL_SEASONS: Record<string, string> = {
  "5890": "2023",   // CAN 2024 (Ivory Coast) = saison "2023" dans TheSportsDB
}

const SPORTSDB_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY ?? "139695"

// Cache mémoire TheSportsDB — 1 heure
const formCache = new Map<string, { data: Record<string, string>; ts: number }>()

interface TeamData { form: string; description: string }

async function getFormMap(highlightlyId: string): Promise<Record<string, TeamData>> {
  const sportsdbId = LEAGUE_MAP[highlightlyId]
  if (!sportsdbId) return {}

  const cached = formCache.get(highlightlyId)
  if (cached && Date.now() - cached.ts < 3_600_000) return cached.data as any

  const season = SPECIAL_SEASONS[highlightlyId] ?? "2025-2026"
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/lookuptable.php?l=${sportsdbId}&s=${season}`
    const res  = await fetch(url, { next: { revalidate: 3600 } })
    const json = await res.json()

    const map: Record<string, TeamData> = {}
    for (const row of json.table ?? []) {
      if (row.strTeam) {
        map[row.strTeam.toLowerCase()] = {
          form:        row.strForm ?? "",
          description: row.strDescription ?? "",
        }
      }
    }

    formCache.set(highlightlyId, { data: map as any, ts: Date.now() })
    return map
  } catch {
    return {}
  }
}

function matchTeam(formMap: Record<string, TeamData>, teamName: string): TeamData {
  const lower = teamName.toLowerCase()

  // 1. Correspondance exacte
  if (formMap[lower]) return formMap[lower]

  // 2. L'un contient l'autre ("SC Freiburg" ↔ "Freiburg")
  for (const [key, val] of Object.entries(formMap)) {
    if (key.includes(lower) || lower.includes(key)) return val
  }

  // 3. Meilleur chevauchement de mots (> 3 lettres) — gère "Paris SG" ↔ "Paris Saint Germain"
  const teamWords = new Set(lower.split(/\W+/).filter(w => w.length > 3))
  let bestKey: string | null = null
  let bestScore = 0
  for (const [key] of Object.entries(formMap)) {
    const keyWords = key.split(/\W+/).filter(w => w.length > 3)
    const overlap  = keyWords.filter(w => teamWords.has(w)).length
    if (overlap > bestScore) { bestScore = overlap; bestKey = key }
  }
  if (bestScore > 0 && bestKey) return formMap[bestKey]

  return { form: "", description: "" }
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
  // Merge TheSportsDB form + description into Highlightly standings rows
  const groups = data.groups ?? []
  for (const group of groups) {
    for (const row of group.standings ?? []) {
      const teamName = row.team?.name ?? ""
      const td = matchTeam(formMap, teamName)
      row.strForm        = td.form
      row.strDescription = td.description || row.description || ""
      // Normaliser les champs au format attendu par StandingsPanel
      row.strTeam         = teamName
      row.intRank         = String(row.position ?? "")
      row.intPlayed       = String(row.total?.games ?? "")
      row.intWin          = String(row.total?.wins ?? "")
      row.intLoss         = String(row.total?.loses ?? "")
      row.intDraw         = String(row.total?.draws ?? "")
      row.intPoints       = String(row.points ?? "")
      row.intGoalDifference = String(
        (row.total?.scoredGoals ?? 0) - (row.total?.receivedGoals ?? 0)
      )
      row.intGoalsFor     = String(row.total?.scoredGoals ?? "")
      row.intGoalsAgainst = String(row.total?.receivedGoals ?? "")
      row.strBadge        = row.team?.logo ?? ""
    }
  }

  return NextResponse.json(data)
}