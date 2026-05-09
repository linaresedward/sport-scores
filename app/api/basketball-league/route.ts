import { NextRequest, NextResponse } from "next/server"

const SPORTSDB = `https://www.thesportsdb.com/api/v1/json/${process.env.NEXT_PUBLIC_SPORTSDB_KEY ?? "139695"}`

function dateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split("T")[0]
}

export async function GET(req: NextRequest) {
  const leagueName = req.nextUrl.searchParams.get("leagueName")
  if (!leagueName) return NextResponse.json({ error: "leagueName required" }, { status: 400 })

  const offsets = Array.from({ length: 34 }, (_, i) => i - 20)
  const dates   = offsets.map(dateStr)

  const fetchDay = async (date: string) => {
    try {
      const res = await fetch(`${SPORTSDB}/eventsday.php?d=${date}&s=Basketball`,
        { next: { revalidate: 300 } })
      if (!res.ok) return []
      const data = await res.json()
      return (data.events ?? []).filter((e: any) => e.strLeague === leagueName)
    } catch { return [] }
  }

  const results = await Promise.all(dates.map(fetchDay))
  const allEvents = results.flat()

  const today = new Date().toISOString().split("T")[0]
  const past     = allEvents.filter((e: any) => e.dateEvent <  today && e.intHomeScore !== null)
  const upcoming = allEvents.filter((e: any) => e.dateEvent >= today)

  // Info ligue depuis premier événement trouvé
  const first = allEvents[0]
  const leagueInfo = first ? {
    name:    first.strLeague ?? leagueName,
    logo:    first.strLeagueBadge ?? null,
    country: first.strCountry ?? "",
  } : { name: leagueName, logo: null, country: "" }

  return NextResponse.json({ past, upcoming, leagueInfo })
}
