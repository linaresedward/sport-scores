import { NextRequest, NextResponse } from "next/server"

const HEADERS = {
  "x-rapidapi-key":  process.env.HIGHLIGHTLY_KEY ?? "",
  "x-rapidapi-host": "sports.highlightly.net",
}

export interface Scorer {
  rank:    number
  name:    string
  photo:   string | null
  team:    string
  teamLogo:string | null
  goals:   number
  assists: number
  played:  number
}

// Cache 15 min
const cache = new Map<string, { data: Scorer[]; ts: number }>()

function parseScorers(raw: unknown): Scorer[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.topScorers ?? (raw as any)?.scorers ?? (raw as any)?.players ?? []

  return list.map((item: any, idx) => ({
    rank:     item.rank ?? idx + 1,
    name:     item.player?.name ?? item.name ?? "—",
    photo:    item.player?.photo ?? item.photo ?? null,
    team:     item.team?.name ?? item.teamName ?? "—",
    teamLogo: item.team?.logo ?? item.teamLogo ?? null,
    goals:    item.goals ?? item.statistics?.goals ?? item.stat ?? 0,
    assists:  item.assists ?? item.statistics?.assists ?? 0,
    played:   item.played ?? item.statistics?.played ?? 0,
  })).filter(s => s.name !== "—")
}

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId")
  const type     = req.nextUrl.searchParams.get("type") ?? "scorers" // scorers | assists
  if (!leagueId) return NextResponse.json([], { status: 400 })

  const cacheKey = `${leagueId}-${type}`
  const cached   = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < 900_000) {
    return NextResponse.json(cached.data)
  }

  const endpoint = type === "assists" ? "top-assists" : "top-scorers"

  try {
    const res = await fetch(
      `https://sports.highlightly.net/football/${endpoint}?leagueId=${leagueId}&season=2025`,
      { headers: HEADERS, cache: "no-store" }
    )

    if (!res.ok) {
      return NextResponse.json([])
    }

    const raw  = await res.json()
    const data = parseScorers(raw)
    cache.set(cacheKey, { data, ts: Date.now() })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
