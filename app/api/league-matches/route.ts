import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/football"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

function dateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId")
  if (!leagueId) return NextResponse.json({ error: "leagueId required" }, { status: 400 })

  // Scanne -10 jours → +30 jours (40 dates) en parallèle
  // +30 pour inclure les finales et matchs tardifs (ex: Conference League finale mai-juin)
  const offsets = Array.from({ length: 40 }, (_, i) => i - 10)
  const dates   = offsets.map(dateStr)

  const fetchDay = async (date: string) => {
    try {
      const res = await fetch(
        `${BASE}/matches?date=${date}&timezone=UTC&limit=100`,
        { headers: HEADERS, next: { revalidate: 300 } }
      )
      if (!res.ok) return []
      const data = await res.json()
      return (data.data ?? []).filter((m: any) => String(m.league?.id) === leagueId)
    } catch { return [] }
  }

  const results = await Promise.all(dates.map(fetchDay))
  const allMatches = results.flat()

  // Grouper par date
  const byDate: Record<string, any[]> = {}
  for (const m of allMatches) {
    const d = (m.date ?? "").split("T")[0]
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
  }

  // Info ligue depuis standings
  let leagueInfo: { name: string; logo: string | null } | null = null
  try {
    const sRes = await fetch(
      `${BASE}/standings?leagueId=${leagueId}&season=2025`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    )
    if (sRes.ok) {
      const sd = await sRes.json()
      const league = sd.league
      if (league) leagueInfo = { name: league.name, logo: league.logo ?? null }
    }
  } catch {}

  return NextResponse.json({ matches: byDate, leagueInfo })
}
