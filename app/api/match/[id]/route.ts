import { NextRequest, NextResponse } from "next/server"

const BASE = "https://sports.highlightly.net/football"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = {
  "x-rapidapi-key":  KEY,
  "x-rapidapi-host": "sports.highlightly.net",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const matchRes = await fetch(`${BASE}/matches/${id}`, { 
  headers: HEADERS, cache: "no-store" 
})

if (!matchRes.ok) return NextResponse.json(null, { status: 404 })

const matchData = await matchRes.json()

    // Highlightly retourne tout dans un objet avec clé "0"
const match = matchData["0"] ?? matchData.match ?? matchData

return NextResponse.json(match)
  } catch (e) {
    console.error("Match API error:", e)
    return NextResponse.json(null, { status: 500 })
  }
}