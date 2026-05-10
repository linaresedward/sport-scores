import { NextRequest, NextResponse } from "next/server"

const BASE    = "https://sports.highlightly.net/basketball"
const KEY     = process.env.HIGHLIGHTLY_KEY ?? ""
const HEADERS = { "x-rapidapi-key": KEY, "x-rapidapi-host": "sports.highlightly.net" }

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json(null, { status: 400 })

  try {
    const res = await fetch(`${BASE}/matches/${id}`, { headers: HEADERS, cache: "no-store" })
    if (!res.ok) return NextResponse.json(null, { status: 404 })
    const data = await res.json()
    return NextResponse.json(data["0"] ?? data)
  } catch {
    return NextResponse.json(null, { status: 500 })
  }
}
