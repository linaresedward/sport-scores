'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import FavoriteButton from '../../components/FavoriteButton'
import { computeMatchTimer } from '@/lib/matchTimer'

const BASE = "https://www.thesportsdb.com/api/v1/json/139695"

const LIVE_STATUSES = ['In Progress', 'HT', '1H', '2H', 'ET', 'P', 'LIVE']

interface MatchEvent {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  intMinute: string | null
  dateEvent: string
  strTime: string
  strLeague: string
  idLeague: string
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

function formatDate(dateStr: string, timeStr: string) {
  const dt = new Date(`${dateStr}T${timeStr}`)
  return dt.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function isReallyLive(status: string, dateStr: string, timeStr: string): boolean {
  if (status === 'Match Finished') return false
  if (!LIVE_STATUSES.includes(status)) return false
  const matchDate = new Date(`${dateStr}T${timeStr}Z`)
  const diffHours = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60)
  return diffHours < 4
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

function MatchTimerDisplay({ timer }: { timer: ReturnType<typeof computeMatchTimer> }) {

  if (timer.period === "upcoming") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "30px", fontWeight: 700, color: "#2563eb" }}>{timer.label}</div>
        <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Coup d'envoi</div>
      </div>
    )
  }

  if (timer.period === "finished") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "30px", fontWeight: 700, color: "#64748b" }}>FT</div>
        <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Terminé</div>
      </div>
    )
  }

  if (timer.period === "half_time") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "30px", fontWeight: 700, color: "#f59e0b" }}>HT</div>
        <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Mi-temps</div>
      </div>
    )
  }

  if (timer.period === "penalties") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "30px", fontWeight: 700, color: "#f97316" }}>TAB</div>
        <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>Tirs au but</div>
      </div>
    )
  }

  // ── LIVE avec ou sans minute ───────────────────────────
  const isExtra = timer.period === "extra_time"
  const color      = isExtra ? "#f59e0b" : "#ef4444"
  const trackColor = isExtra ? "#fef3c7" : "#fee2e2"

  const periodLabel: Record<string, string> = {
    first_half:   "1ère mi-temps",
    second_half:  "2ème mi-temps",
    extra_time:   "Prolongations",
    live_unknown: "En direct",
  }

  return (
    <div style={{ maxWidth: "200px", margin: "0 auto" }}>

      {/* Minute (API uniquement) ou LIVE */}
      {timer.minute !== null ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "2px", marginBottom: "4px" }}>
          <span style={{ fontSize: "38px", fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {timer.minute}
          </span>
          <span style={{ fontSize: "22px", fontWeight: 700, color }}>′</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", marginBottom: "4px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block", animation: "livePulse 1.2s infinite" }} />
          <span style={{ fontSize: "22px", fontWeight: 700, color }}>LIVE</span>
        </div>
      )}

      {/* Label période */}
      <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", marginBottom: "8px" }}>
        {periodLabel[timer.period] ?? "En direct"}
      </div>

      {/* Barre de progression — seulement si minute connue */}
      {timer.minute !== null && (
        <>
          <div style={{ height: "3px", background: trackColor, borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "999px", background: color,
              width: `${Math.min(timer.progress, 100)}%`,
              transition: "width 1s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>{timer.periodStart}′</span>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>{timer.periodEnd}′</span>
          </div>
        </>
      )}

      <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}`}</style>
    </div>
  )
}

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [match, setMatch]         = useState<MatchEvent | null>(null)
  const [timeline, setTimeline]   = useState<TimelineEvent[]>([])
  const [lineup, setLineup]       = useState<LineupPlayer[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'events' | 'lineup' | 'info'>('events')

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
        const [matchData, timelineData, lineupData] = await Promise.all([
          matchRes.json(), timelineRes.json(), lineupRes.json()
        ])
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

  useEffect(() => {
    if (!match) return
    const live = isReallyLive(match.strStatus, match.dateEvent, match.strTime)
    if (!live) return
    const interval = setInterval(async () => {
      try {
        const updated = await fetchMatch()
        if (updated?.strStatus === 'Match Finished') {
          const tlRes  = await fetch(`${BASE}/lookuptimeline.php?id=${matchId}`)
          const tlData = await tlRes.json()
          setTimeline(tlData.timeline ?? [])
        }
      } catch (e) {
        console.error('Refresh error:', e)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [match, fetchMatch, matchId])

  if (loading) return null
  if (!match) return (
    <div className="text-center py-20 text-gray-400">Match introuvable</div>
  )

  const timer = computeMatchTimer(match.strStatus, match.dateEvent, match.strTime, match.intMinute)
  const isLive = timer.isLive
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

        {/* Ligue + statut — Option B chrono */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm mb-4">{match.strLeague}</p>
          <MatchTimerDisplay timer={timer} />
          {isLive && (
            <p className="text-xs text-gray-600 mt-3">Mise à jour toutes les 30s</p>
          )}
        </div>

        {/* ── Équipes + score avec étoiles ── */}
        <div className="flex items-center justify-between gap-4">

          {/* Équipe domicile : étoile à gauche, logo + nom à droite */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            {/* Étoile favori équipe domicile */}
            <FavoriteButton
              item={{
                id: match.idHomeTeam,
                type: "team",
                name: match.strHomeTeam,
                logo: match.strHomeTeamBadge,
              }}
              size="md"
            />
            <Link
              href={`/equipe/${match.idHomeTeam}`}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition"
            >
              <img
                src={match.strHomeTeamBadge}
                alt={match.strHomeTeam}
                className="w-20 h-20 object-contain"
              />
              <span className="font-semibold text-center text-sm md:text-base">
                {match.strHomeTeam}
              </span>
            </Link>
          </div>

          {/* Score central */}
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

          {/* Équipe extérieure : logo + nom à gauche, étoile à droite */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <Link
              href={`/equipe/${match.idAwayTeam}`}
              className="flex flex-col items-center gap-2 hover:opacity-80 transition"
            >
              <img
                src={match.strAwayTeamBadge}
                alt={match.strAwayTeam}
                className="w-20 h-20 object-contain"
              />
              <span className="font-semibold text-center text-sm md:text-base">
                {match.strAwayTeam}
              </span>
            </Link>
            {/* Étoile favori équipe extérieure */}
            <FavoriteButton
              item={{
                id: match.idAwayTeam,
                type: "team",
                name: match.strAwayTeam,
                logo: match.strAwayTeamBadge,
              }}
              size="md"
            />
          </div>
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
            { label: 'Statut',      value: match.strStatus },
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