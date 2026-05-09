import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/hockey"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

function dateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
  const leagueName = req.nextUrl.searchParams.get("leagueName")
  if (!leagueName) return NextResponse.json({ error: "leagueName required" }, { status: 400 })

  const offsets = Array.from({ length: 34 }, (_, i) => i - 20) // -20 → +13
  const dates   = offsets.map(dateStr)

  const fetchDay = async (date: string) => {
    try {
      const res = await fetch(`${BASE}/matches?date=${date}&timezone=UTC&limit=100`,
        { headers: HEADERS, next: { revalidate: 300 } })
      if (!res.ok) return []
      const data = await res.json()
      return (data.data ?? []).filter((m: any) => m.league?.name === leagueName)
    } catch { return [] }
  }

  const results = await Promise.all(dates.map(fetchDay))
  const allMatches = results.flat()

  // Grouper par date
  const byDate: Record<string, any[]> = {}
  let leagueInfo: { name: string; logo: string | null; country: string } | null = null

  for (const m of allMatches) {
    const d = (m.date ?? "").split("T")[0]
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(m)
    if (!leagueInfo) leagueInfo = {
      name:    m.league?.name ?? leagueName,
      logo:    m.league?.logo ?? null,
      country: m.country?.name ?? "",
    }
  }

  return NextResponse.json({ matches: byDate, leagueInfo })
}
