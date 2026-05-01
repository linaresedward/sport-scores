import { NextRequest, NextResponse } from "next/server"

const BASE = "https://soccer.highlightly.net"
const KEY  = process.env.HIGHLIGHTLY_KEY ?? ""

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const res = await fetch(
      `${BASE}/matches/${id}`,
      {
        headers: {
          "x-rapidapi-key":  KEY,
          "x-rapidapi-host": "soccer.highlightly.net",
        },
        next: { revalidate: 30 },
      }
    )

    if (!res.ok) {
      console.error("Highlightly match error:", res.status)
      return NextResponse.json(null, { status: res.status })
    }

    const data = await res.json()

    // L'API peut retourner [match] ou { data: [match] } ou { data: match }
    const match = Array.isArray(data)       ? data[0]       :
                  Array.isArray(data.data)  ? data.data[0]  :
                  (data.data ?? data ?? null)

    if (!match || !match.state) {
      return NextResponse.json(null, { status: 404 })
    }

    return NextResponse.json(match)

  } catch (err) {
    console.error("Match route error:", err)
    return NextResponse.json(null, { status: 500 })
  }
}