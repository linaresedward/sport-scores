import { Suspense } from 'react'
import type { Metadata } from 'next'
import MatchDetailClient from './MatchDetailClient'
import MatchDetailHighlightly from './MatchDetailHighlightly'
import JsonLd, { buildSportsEventLd } from '../../components/JsonLd'

interface PageProps {
  params: Promise<{ id: string }>
}

function isHighlightlyId(id: string): boolean {
  return /^\d+$/.test(id)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  try {
    if (isHighlightlyId(id)) {
      const res = await fetch(
        `https://sports.highlightly.net/football/matches/${id}`,
        { headers: { 'x-rapidapi-key': process.env.HIGHLIGHTLY_KEY ?? '', 'x-rapidapi-host': 'sports.highlightly.net' }, next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const match = data['0'] ?? data.match ?? data
        const home = match?.homeTeam?.name ?? match?.home ?? ''
        const away = match?.awayTeam?.name ?? match?.away ?? ''
        const league = match?.league?.name ?? match?.competition ?? ''
        if (home && away) {
          const title = `${home} – ${away}`
          const desc = `Résultat et score du match ${home} vs ${away}${league ? ` · ${league}` : ''} sur NyxScores.`
          return { title, description: desc, openGraph: { title: `${title} | NyxScores`, description: desc } }
        }
      }
    } else {
      const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
      const res = await fetch(
        `https://www.thesportsdb.com/api/v1/json/${KEY}/lookupevent.php?id=${id}`,
        { next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const ev = data.events?.[0]
        if (ev) {
          const title = `${ev.strHomeTeam} – ${ev.strAwayTeam}`
          const desc = `Résultat et score : ${ev.strHomeTeam} vs ${ev.strAwayTeam} · ${ev.strLeague ?? ''} sur NyxScores.`
          return { title, description: desc, openGraph: { title: `${title} | NyxScores`, description: desc } }
        }
      }
    }
  } catch { /* silently fallback */ }

  return { title: 'Match en direct', description: 'Résultat et score du match sur NyxScores.' }
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params
  const useHighlightly = isHighlightlyId(id)
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sport-scores.vercel.app'

  // Récupération légère pour le JSON-LD (les composants clients refetcheront eux-mêmes)
  let ldData: Record<string, unknown> | null = null
  try {
    if (useHighlightly) {
      const res = await fetch(
        `https://sports.highlightly.net/football/matches/${id}`,
        { headers: { 'x-rapidapi-key': process.env.HIGHLIGHTLY_KEY ?? '', 'x-rapidapi-host': 'sports.highlightly.net' }, next: { revalidate: 300 } }
      )
      if (res.ok) {
        const data = await res.json()
        const m = data['0'] ?? data.match ?? data
        if (m?.homeTeam && m?.awayTeam) {
          ldData = buildSportsEventLd({
            name: `${m.homeTeam.name} – ${m.awayTeam.name}`,
            startDate: m.date ?? m.startDate ?? '',
            homeTeam: m.homeTeam.name, awayTeam: m.awayTeam.name,
            homeScore: m.homeScore, awayScore: m.awayScore,
            league: m.league?.name,
            url: `${SITE_URL}/match/${id}`,
          })
        }
      }
    } else {
      const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/lookupevent.php?id=${id}`, { next: { revalidate: 300 } })
      if (res.ok) {
        const data = await res.json()
        const ev = data.events?.[0]
        if (ev) {
          ldData = buildSportsEventLd({
            name: `${ev.strHomeTeam} – ${ev.strAwayTeam}`,
            startDate: ev.strTimestamp ?? ev.dateEvent ?? '',
            homeTeam: ev.strHomeTeam, awayTeam: ev.strAwayTeam,
            homeScore: ev.intHomeScore, awayScore: ev.intAwayScore,
            league: ev.strLeague,
            url: `${SITE_URL}/match/${id}`,
          })
        }
      }
    }
  } catch { /* silently ignore */ }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--text-primary)" }}>
      {ldData && <JsonLd data={ldData} />}
      <Suspense fallback={<MatchDetailSkeleton />}>
        {useHighlightly
          ? <MatchDetailHighlightly matchId={id} />
          : <MatchDetailClient matchId={id} />
        }
      </Suspense>
    </main>
  )
}

function MatchDetailSkeleton() {
  return (
    <div style={{ maxWidth: 896, margin: "0 auto", padding: "32px 16px", animation: "shimmer 1.6s ease-in-out infinite" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
      <div style={{ background: "var(--bg-surface)", borderRadius: 16, height: 192, marginBottom: 16, border: "1px solid var(--border)" }} />
      <div style={{ background: "var(--bg-surface)", borderRadius: 12, height: 256, border: "1px solid var(--border)" }} />
    </div>
  )
}