'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const BASE = `https://www.thesportsdb.com/api/v1/json/139695`

interface TennisEvent {
  idEvent: string
  strEvent: string
  strDescriptionEN: string | null
  strResult: string | null
  strStatus: string
  dateEvent: string
  strTime: string
  strCity: string | null
  strCountry: string | null
  strLeague: string
  idLeague: string
}

function parsePlayers(strEvent: string): { p1: string; p2: string } {
  const vsIdx = strEvent.indexOf(' vs ')
  if (vsIdx < 0) return { p1: strEvent, p2: '' }
  const beforeVs = strEvent.slice(0, vsIdx).trim().split(' ')
  const p1 = beforeVs[beforeVs.length - 1]
  const p2 = strEvent.slice(vsIdx + 4).trim()
  return { p1, p2 }
}

function parseMeta(strEvent: string, desc: string | null): {
  tournament: string; phase: string; surface: string; surfaceColor: string
} {
  let tournament = ''
  let phase = ''

  if (desc) {
    const lines = desc.split('\n')
    const parts = lines[0]?.split(' - ') ?? []
    tournament = parts[0]?.trim() ?? ''
    phase = parts[2]?.trim() ?? parts[1]?.trim() ?? ''
  }

  if (!tournament) {
    const vsIdx = strEvent.indexOf(' vs ')
    if (vsIdx > 0) {
      const words = strEvent.slice(0, vsIdx).trim().split(' ')
      words.pop()
      tournament = words.join(' ')
    }
  }

  const t = tournament.toLowerCase()
  let surface = 'Dur'
  let surfaceColor = '#3b82f6'
  if (t.includes('madrid') || t.includes('barcelona') || t.includes('roland') ||
      t.includes('monte') || t.includes('rome') || t.includes('munich') ||
      t.includes('bmw') || t.includes('hamburg') || t.includes('lyon')) {
    surface = 'Terre battue'; surfaceColor = '#ef4444'
  } else if (t.includes('wimbledon') || t.includes('queens') || t.includes('halle') ||
             t.includes('grass') || t.includes('nottingham')) {
    surface = 'Gazon'; surfaceColor = '#22c55e'
  }

  return { tournament, phase, surface, surfaceColor }
}
function translatePhase(phase: string): string {
  const map: Record<string, string> = {
    'The Final':        'Finale',
    'Finals':           'Finale',
    'Semifinals':       'Demi-finales',
    'Quarterfinals':    'Quarts de finale',
    '2nd Round':        '2ème tour',
    '1st Round':        '1er tour',
    'Round of 16':      'Huitièmes de finale',
    'Round of 32':      'Seizièmes de finale',
    'Round Robin':      'Phase de groupes',
    'Qualifying':       'Qualifications',
    'First Round':      '1er tour',
    'Second Round':     '2ème tour',
    'Third Round':      '3ème tour',
    'Fourth Round':     '4ème tour',
  }
  return map[phase] ?? phase
}

function parseResult(strResult: string | null): {
  p1sets: string[]; p2sets: string[]; winner: string
} {
  if (!strResult) return { p1sets: [], p2sets: [], winner: '' }
  const lines = strResult.split('\n').filter(Boolean)
  const winner = lines[0]?.split(' beat ')[0]?.trim() ?? ''
  const p1sets = lines[1]?.split(':')[1]?.trim().split(/\s+/).filter(Boolean) ?? []
  const p2sets = lines[2]?.split(':')[1]?.trim().split(/\s+/).filter(Boolean) ?? []
  return { p1sets, p2sets, winner }
}

interface TournamentGroup {
  key: string
  tournament: string
  surface: string
  surfaceColor: string
  city: string
  country: string
  events: TennisEvent[]
}

function groupByTournament(events: TennisEvent[]): TournamentGroup[] {
  const map = new Map<string, TournamentGroup>()
  for (const ev of events) {
    const { tournament, surface, surfaceColor } = parseMeta(ev.strEvent, ev.strDescriptionEN)
    const key = tournament || 'Autre'
    if (!map.has(key)) {
      map.set(key, {
        key, tournament, surface, surfaceColor,
        city: ev.strCity ?? '', country: ev.strCountry ?? '',
        events: [],
      })
    }
    map.get(key)!.events.push(ev)
  }
  return [...map.values()]
}

// ─── Match Row ────────────────────────────────────────────────────────────────

function MatchRow({ ev, showPhase }: { ev: TennisEvent; showPhase: boolean }) {
  const { p1, p2 } = parsePlayers(ev.strEvent)
  const { p1sets, p2sets, winner } = parseResult(ev.strResult)
  const { phase } = parseMeta(ev.strEvent, ev.strDescriptionEN)
  const isFinished = ev.strStatus === 'Match Finished'
  const isLive = ['In Progress', '1H', '2H', 'HT', 'LIVE'].includes(ev.strStatus)
  const p1won = isFinished && winner === p1
  const p2won = isFinished && winner === p2

  return (
    <>
      {showPhase && phase && (
  <div className="px-4 pt-3 pb-1">
    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
      {translatePhase(phase)}
    </span>
  </div>
)}
      <Link
        href={`/match/${ev.idEvent}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
      >
        {/* Statut */}
        <div className="w-14 shrink-0 text-center">
          {isLive ? (
            <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              LIVE
            </span>
          ) : isFinished ? (
            <span className="text-xs text-gray-600 font-medium">FT</span>
          ) : (
            <span className="text-xs text-blue-400 font-semibold">
              {ev.strTime?.slice(0, 5) || '—'}
            </span>
          )}
        </div>

        {/* Joueurs */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            {p1won && <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />}
            <p className={`text-sm truncate leading-none ${
              p1won ? 'font-bold text-white' :
              p2won ? 'text-gray-500' : 'text-gray-200'
            }`}>
              {p1}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {p2won && <span className="w-1 h-1 rounded-full bg-green-400 shrink-0" />}
            <p className={`text-sm truncate leading-none ${
              p2won ? 'font-bold text-white' :
              p1won ? 'text-gray-500' : 'text-gray-200'
            }`}>
              {p2}
            </p>
          </div>
        </div>

        {/* Sets */}
        {p1sets.length > 0 && (
          <div className="flex gap-2 shrink-0">
            {p1sets.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 w-5">
                <span className={`text-sm tabular-nums leading-none ${
                  p1won ? 'font-bold text-white' : 'text-gray-500'
                }`}>{s}</span>
                <span className={`text-sm tabular-nums leading-none ${
                  p2won ? 'font-bold text-white' : 'text-gray-500'
                }`}>{p2sets[i] ?? ''}</span>
              </div>
            ))}
          </div>
        )}

        <span className="text-gray-700 text-xs shrink-0">›</span>
      </Link>
    </>
  )
}

// ─── Tournament Block ─────────────────────────────────────────────────────────

function TournamentBlock({ group }: { group: TournamentGroup }) {
  let lastPhase = ''

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10"
      style={{ background: 'linear-gradient(135deg, #1e2433 0%, #151922 100%)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-white/10"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {/* Indicateur surface */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: group.surfaceColor }} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">
            {group.tournament || group.key}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {group.surface}
            {group.city && ` · ${group.city}`}
            {group.country && `, ${group.country}`}
          </p>
        </div>
      </div>

      {/* Matchs */}
      {group.events.map((ev) => {
        const { phase } = parseMeta(ev.strEvent, ev.strDescriptionEN)
        const showPhase = phase !== lastPhase
        lastPhase = phase
        return (
          <MatchRow key={ev.idEvent} ev={ev} showPhase={showPhase} />
        )
      })}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TennisClient() {
  const [atpPast, setAtpPast]   = useState<TennisEvent[]>([])
  const [wtaPast, setWtaPast]   = useState<TennisEvent[]>([])
  const [atpNext, setAtpNext]   = useState<TennisEvent[]>([])
  const [wtaNext, setWtaNext]   = useState<TennisEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'results' | 'upcoming'>('results')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [r1, r2, r3, r4] = await Promise.all([
          fetch(`${BASE}/eventspastleague.php?id=4464`),
          fetch(`${BASE}/eventspastleague.php?id=4517`),
          fetch(`${BASE}/eventsnextleague.php?id=4464`),
          fetch(`${BASE}/eventsnextleague.php?id=4517`),
        ])
        const [d1, d2, d3, d4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()])
        setAtpPast(d1.events ?? [])
        setWtaPast(d2.events ?? [])
        setAtpNext(d3.events ?? [])
        setWtaNext(d4.events ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const atpEvents = tab === 'results' ? atpPast : atpNext
  const wtaEvents = tab === 'results' ? wtaPast : wtaNext
  const atpGroups = groupByTournament(atpEvents)
  const wtaGroups = groupByTournament(wtaEvents)
  const hasLive = [...atpEvents, ...wtaEvents].some(e =>
    ['In Progress', 'LIVE', '1H', '2H'].includes(e.strStatus)
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center text-2xl">
          🎾
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Tennis</h1>
          <p className="text-xs text-gray-500">Circuits ATP & WTA</p>
        </div>
        {hasLive && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            EN DIRECT
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-2xl border border-white/10">
        {(['results', 'upcoming'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'results' ? '📋 Résultats' : '📅 À venir'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">

          {/* ATP */}
          {atpGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/25">
                  <span className="text-xs font-black text-blue-400 tracking-wider">ATP</span>
                </div>
                <span className="text-xs text-gray-600 font-medium">Circuit Masculin</span>
              </div>
              {atpGroups.map(g => <TournamentBlock key={g.key} group={g} />)}
            </div>
          )}

          {/* WTA */}
          {wtaGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/25">
                  <span className="text-xs font-black text-pink-400 tracking-wider">WTA</span>
                </div>
                <span className="text-xs text-gray-600 font-medium">Circuit Féminin</span>
              </div>
              {wtaGroups.map(g => <TournamentBlock key={g.key} group={g} />)}
            </div>
          )}

          {atpGroups.length === 0 && wtaGroups.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎾</div>
              <p className="text-gray-400 font-medium">Aucun match disponible</p>
              <p className="text-gray-600 text-sm mt-1">
                {tab === 'upcoming' ? 'Pas de matchs programmés' : 'Aucun résultat récent'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}