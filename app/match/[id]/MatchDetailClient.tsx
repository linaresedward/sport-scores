'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`

const LIVE_STATUSES = ['In Progress', 'HT', '1H', '2H', 'ET', 'P', 'LIVE']

interface MatchEvent {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  intMinute: string | null   // ✅ minute exacte de jeu
  dateEvent: string
  strTime: string
  strLeague: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  strVenue: string | null
  strOfficial: string | null
  idHomeTeam: string
  idAwayTeam: string
}

interface TimelineEvent {
  idTimeline: string
  strTimeline: string
  strTimelineDetail: string
  strHome: string | null
  strAway: string | null
  strPlayer: string | null
  strAssist: string | null
  strComment: string | null
}

interface LineupPlayer {
  strPlayer: string
  strPosition: string
  strNumber: string
  strHome: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, timeStr: string) {
  const dt = new Date(`${dateStr}T${timeStr}`)
  return dt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function isReallyLive(status: string, dateStr: string, timeStr: string): boolean {
  // ✅ On fait confiance à l'API en priorité
  if (status === 'Match Finished') return false
  if (!LIVE_STATUSES.includes(status)) return false

  // ✅ Fallback sécurité : si l'API est bloquée depuis > 4h, on considère terminé
  // 4h couvre : 90min match + 30min prolongations + 30min tirs au but + marge
  const matchDate = new Date(`${dateStr}T${timeStr}Z`)
  const diffHours = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60)
  return diffHours < 4
}

function statusLabel(match: MatchEvent) {
  const live = isReallyLive(match.strStatus, match.dateEvent, match.strTime)

  if (!live && match.strStatus !== 'NS') {
    return { label: 'Terminé', color: 'text-gray-400', isLive: false }
  }

  // ✅ Libellé période + minute exacte si disponible
  const minute = match.intMinute ? ` • ${match.intMinute}'` : ''

  const map: Record<string, string> = {
    'In Progress': `EN DIRECT${minute}`,
    '1H':          `1ère MT${minute}`,
    '2H':          `2ème MT${minute}`,
    'HT':          'Mi-temps',
    'ET':          `Prol.${minute}`,
    'P':           'Tirs au but',
    'NS':          'À venir',
  }

  const label = map[match.strStatus] ?? `LIVE${minute}`

  if (match.strStatus === 'NS') {
    return { label, color: 'text-blue-400', isLive: false }
  }
  if (match.strStatus === 'HT') {
    return { label, color: 'text-yellow-400', isLive: true }
  }
  return { label, color: 'text-red-400', isLive: true }
}

function eventIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('goal'))         return '⚽'
  if (t.includes('yellow'))       return '🟨'
  if (t.includes('red'))          return '🟥'
  if (t.includes('substitution')) return '🔄'
  if (t.includes('penalty'))      return '🎯'
  return '•'
}

function extractMinute(ev: TimelineEvent): string {
  if (ev.strTimeline && ev.strTimeline.trim() !== '') return ev.strTimeline.trim()
  const m = ev.strTimelineDetail?.match(/^(\d+)'/)
  if (m) return m[1]
  return '?'
}

function cleanEventLabel(detail: string): string {
  return detail?.replace(/^\d+'\s*[-–]?\s*/i, '').trim() ?? ''
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [match, setMatch]         = useState<MatchEvent | null>(null)
  const [timeline, setTimeline]   = useState<TimelineEvent[]>([])
  const [lineup, setLineup]       = useState<LineupPlayer[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'events' | 'lineup' | 'info'>('events')

  // ✅ fetchMatch séparé pour le refresh live (on ne re-fetch pas lineup/timeline inutilement)
  const fetchMatch = useCallback(async () => {
    const res  = await fetch(`${BASE}/lookupevent.php?id=${matchId}`)
    const data = await res.json()
    const event = data.events?.[0] ?? data.event?.[0] ?? null
    setMatch(event)
    return event
  }, [matchId])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [matchRes, timelineRes, lineupRes] = await Promise.all([
          fetch(`${BASE}/lookupevent.php?id=${matchId}`),
          fetch(`${BASE}/lookuptimeline.php?id=${matchId}`),
          fetch(`${BASE}/lookuplineup.php?id=${matchId}`),
        ])
        const matchData    = await matchRes.json()
        const timelineData = await timelineRes.json()
        const lineupData   = await lineupRes.json()

        const event = matchData.events?.[0] ?? matchData.event?.[0] ?? null
        setMatch(event)
        setTimeline(timelineData.timeline ?? [])
        setLineup(lineupData.lineup ?? [])
      } catch (e) {
        console.error('Fetch error:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [matchId])

  // ✅ Refresh toutes les 30s si le match est LIVE
  useEffect(() => {
    if (!match) return
    const live = isReallyLive(match.strStatus, match.dateEvent, match.strTime)
    if (!live) return

    const interval = setInterval(async () => {
      try {
        const updated = await fetchMatch()
        // Si le match vient de se terminer, on re-fetch aussi la timeline
        if (updated?.strStatus === 'Match Finished') {
          const tlRes  = await fetch(`${BASE}/lookuptimeline.php?id=${matchId}`)
          const tlData = await tlRes.json()
          setTimeline(tlData.timeline ?? [])
        }
      } catch (e) {
        console.error('Refresh error:', e)
      }
    }, 30_000) // 30 secondes

    return () => clearInterval(interval)
  }, [match, fetchMatch, matchId])

  if (loading) return null
  if (!match)  return (
    <div className="text-center py-20 text-gray-400">Match introuvable</div>
  )

  const { label: statusText, color: statusColor, isLive } = statusLabel(match)
  const hasScore   = match.intHomeScore !== null && match.intAwayScore !== null
  const homeLineup = lineup.filter(p => p.strHome === 'Home')
  const awayLineup = lineup.filter(p => p.strHome === 'Away')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Fil d'Ariane */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-white transition">Accueil</Link>
        <span>/</span>
        <span className="text-gray-300">{match.strLeague}</span>
      </div>

      {/* ── Header match ── */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">

        {/* Ligue + statut */}
        <div className="text-center mb-4">
          <p className="text-gray-400 text-sm">{match.strLeague}</p>
          <p className={`font-bold text-sm mt-1 ${statusColor} ${isLive ? 'animate-pulse' : ''}`}>
            {/* ✅ Pastille rouge pour les matchs live */}
            {isLive && (
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
            )}
            {statusText}
          </p>
          {/* ✅ Indicateur de refresh */}
          {isLive && (
            <p className="text-xs text-gray-600 mt-1">Mise à jour toutes les 30s</p>
          )}
        </div>

        {/* Équipes + score */}
        <div className="flex items-center justify-between gap-4">

          <Link href={`/equipe/${match.idHomeTeam}`}
            className="flex flex-col items-center gap-3 flex-1 hover:opacity-80 transition">
            <img src={match.strHomeTeamBadge} alt={match.strHomeTeam}
              className="w-20 h-20 object-contain" />
            <span className="font-semibold text-center text-sm md:text-base">
              {match.strHomeTeam}
            </span>
          </Link>

          <div className="text-center flex-shrink-0">
            {hasScore ? (
              <div className={`text-5xl font-black tracking-tight ${isLive ? 'text-white' : ''}`}>
                {match.intHomeScore}
                <span className="text-gray-600 mx-2">-</span>
                {match.intAwayScore}
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-500">
                {match.strTime?.slice(0, 5) ?? 'VS'}
              </div>
            )}
            {match.dateEvent && (
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(match.dateEvent, match.strTime ?? '00:00:00')}
              </p>
            )}
          </div>

          <Link href={`/equipe/${match.idAwayTeam}`}
            className="flex flex-col items-center gap-3 flex-1 hover:opacity-80 transition">
            <img src={match.strAwayTeamBadge} alt={match.strAwayTeam}
              className="w-20 h-20 object-contain" />
            <span className="font-semibold text-center text-sm md:text-base">
              {match.strAwayTeam}
            </span>
          </Link>
        </div>

        {match.strVenue && (
          <p className="text-center text-xs text-gray-500 mt-4">
            🏟️ {match.strVenue}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-xl border border-gray-800">
        {(['events', 'lineup', 'info'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'events' ? '⚽ Événements' : tab === 'lineup' ? '👥 Compositions' : 'ℹ️ Infos'}
          </button>
        ))}
      </div>

      {/* ── Tab Événements ── */}
      {activeTab === 'events' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {timeline.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun événement disponible</p>
          ) : (
            timeline.map((ev) => {
              const isHome = !!ev.strHome
              const minute = extractMinute(ev)
              const label  = cleanEventLabel(ev.strTimelineDetail)
              return (
                <div
                  key={ev.idTimeline}
                  className={`flex items-center gap-3 px-4 py-3 ${isHome ? '' : 'flex-row-reverse'}`}
                >
                  <span className="text-xs text-gray-500 w-8 text-center font-mono shrink-0">
                    {minute}'
                  </span>
                  <span className="text-lg shrink-0">{eventIcon(ev.strTimelineDetail)}</span>
                  <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                    <p className="text-sm font-medium truncate">{ev.strPlayer ?? '—'}</p>
                    {ev.strAssist && (
                      <p className="text-xs text-gray-500 truncate">↳ {ev.strAssist}</p>
                    )}
                    <p className="text-xs text-gray-500 capitalize">{label}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Tab Compositions ── */}
      {activeTab === 'lineup' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: match.strHomeTeam, players: homeLineup },
            { title: match.strAwayTeam, players: awayLineup },
          ].map(({ title, players }) => (
            <div key={title} className="bg-gray-900 rounded-xl border border-gray-800">
              <h3 className="text-sm font-bold px-4 py-3 border-b border-gray-800 truncate">
                {title}
              </h3>
              {players.length === 0 ? (
                <p className="text-center text-gray-500 text-xs py-6">Non disponible</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {players.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <span className="text-xs text-gray-500 w-5 text-center shrink-0">
                        {p.strNumber}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{p.strPlayer}</p>
                        <p className="text-xs text-gray-500">{p.strPosition}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Infos ── */}
      {activeTab === 'info' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
          {[
            { label: 'Compétition', value: match.strLeague },
            { label: 'Date',        value: formatDate(match.dateEvent, match.strTime ?? '00:00:00') },
            { label: 'Stade',       value: match.strVenue ?? '—' },
            { label: 'Arbitre',     value: match.strOfficial ?? '—' },
            { label: 'Statut',      value: statusText },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-gray-500 text-sm">{label}</span>
              <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}