import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get("leagueId")
  if (!leagueId) return NextResponse.json({ error: "Missing leagueId" }, { status: 400 })

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
  return NextResponse.json(data)
}