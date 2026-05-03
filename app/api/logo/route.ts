import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")

  // Sécurité : on n'accepte que les URLs Highlightly
  if (!url || !url.includes("highlightly.net")) {
    return new NextResponse(transparentSvg(), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    })
  }

  try {
    const res = await fetch(url, {
      headers: {
        // Referer obligatoire pour que Highlightly accepte la requête
        Referer: "https://highlightly.net/",
        "User-Agent": "Mozilla/5.0 (compatible; ScoreBot/1.0)",
      },
      // Cache Next.js côté serveur : 24h
      next: { revalidate: 86400 },
    })

    if (!res.ok) {
      return new NextResponse(transparentSvg(), {
        status: 200,
        headers: { "Content-Type": "image/svg+xml" },
      })
    }

    const contentType = res.headers.get("content-type") ?? "image/png"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache navigateur : 24h
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    })
  } catch {
    return new NextResponse(transparentSvg(), {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    })
  }
}

// SVG transparent 1x1px — fallback si le logo est introuvable
function transparentSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`
}
