// Composant générique pour injecter du JSON-LD dans <head>
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ── Builders ──────────────────────────────────────────────────

export function buildSportsEventLd({
  name,
  startDate,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
  url,
}: {
  name: string
  startDate: string
  homeTeam: string
  awayTeam: string
  homeScore?: string | number | null
  awayScore?: string | number | null
  league?: string
  url: string
}) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate,
    url,
    competitor: [
      { "@type": "SportsTeam", name: homeTeam },
      { "@type": "SportsTeam", name: awayTeam },
    ],
  }
  if (league) ld.superEvent = { "@type": "SportsEvent", name: league }
  if (homeScore != null && awayScore != null) {
    ld.result = { "@type": "GameResult", resultType: "sports", description: `${homeScore} – ${awayScore}` }
  }
  return ld
}

export function buildSportsOrganizationLd({
  name,
  sport,
  url,
}: {
  name: string
  sport: string
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name,
    sport,
    url,
  }
}
