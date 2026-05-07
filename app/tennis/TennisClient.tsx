'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n'

const BASE = 'https://www.thesportsdb.com/api/v1/json/139695'

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

const FLAG: Record<string, string> = {
  Germany: '🇩🇪', Spain: '🇪🇸', France: '🇫🇷', Italy: '🇮🇹',
  'United States': '🇺🇸', USA: '🇺🇸', 'United Kingdom': '🇬🇧', UK: '🇬🇧',
  Australia: '🇦🇺', Switzerland: '🇨🇭', Serbia: '🇷🇸', Russia: '🇷🇺',
  Argentina: '🇦🇷', Japan: '🇯🇵', Canada: '🇨🇦', Portugal: '🇵🇹',
  Belgium: '🇧🇪', Netherlands: '🇳🇱', Poland: '🇵🇱', 'Czech Republic': '🇨🇿',
  Austria: '🇦🇹', Croatia: '🇭🇷', Monaco: '🇲🇨', China: '🇨🇳',
  Morocco: '🇲🇦', Mexico: '🇲🇽', Brazil: '🇧🇷', Colombia: '🇨🇴',
}

interface Meta {
  tournament: string
  city: string
  phase: string
  rank1: string | null
  rank2: string | null
}

function parseMeta(desc: string | null, strEvent: string): Meta {
  if (desc) {
    const lines = desc.split(/\r?\n/)
    const firstLine = lines[0] ? lines[0] : ''
    const parts = firstLine.split(' - ')
    const tournament = parts[0] ? parts[0].trim() : ''
    const city = parts[1] ? parts[1].trim() : ''
    const slicedParts = parts.slice(2)
    const joined = slicedParts.join(' - ').trim()
    let phase = ''
    if (joined) {
      phase = joined
    } else if (parts[1]) {
      phase = parts[1].trim()
    }
    const rankLine = lines[1] ? lines[1] : ''
    const rankMatch = rankLine.match(/\((\d+)\).*\((\d+)\)/)
    const rank1 = rankMatch && rankMatch[1] ? rankMatch[1] : null
    const rank2 = rankMatch && rankMatch[2] ? rankMatch[2] : null
    return { tournament, city, phase, rank1, rank2 }
  }
  const vi = strEvent.indexOf(' vs ')
  const words = vi > 0 ? strEvent.slice(0, vi).trim().split(' ') : []
  words.pop()
  return { tournament: words.join(' '), city: '', phase: '', rank1: null, rank2: null }
}

function parsePlayers(strEvent: string, desc: string | null): { p1: string; p2: string } {
  if (desc) {
    const lines = desc.split(/\r?\n/)
    const line2 = lines[1] ? lines[1] : ''
    const vi = line2.indexOf(' vs ')
    if (vi > 0) {
      const p1 = line2.slice(0, vi).replace(/\s*\(\d+\)\s*$/, '').trim()
      const p2 = line2.slice(vi + 4).replace(/\s*\(\d+\)\s*$/, '').trim()
      if (p1 && p2) return { p1, p2 }
    }
  }
  const vi = strEvent.indexOf(' vs ')
  if (vi < 0) return { p1: strEvent, p2: '' }
  const before = strEvent.slice(0, vi).trim().split(' ')
  return { p1: before[before.length - 1], p2: strEvent.slice(vi + 4).trim() }
}

interface ParsedResult {
  p1sets: string[]
  p2sets: string[]
  winner: string
  walkover: boolean
}

function parseResult(strResult: string | null): ParsedResult {
  if (!strResult) return { p1sets: [], p2sets: [], winner: '', walkover: false }
  const lines = strResult.split(/\r?\n/).filter(function(l) { return l.length > 0 })
  const firstLine = lines[0] ? lines[0] : ''
  const beatParts = firstLine.split(/\s+beat\s+/)
  const winner = beatParts[0] ? beatParts[0].trim() : ''
  const walkover = /walkover|w\/o|abandon/i.test(firstLine)
  const setLines = lines.slice(1).filter(function(l) { return l.indexOf(':') >= 0 })
  const p1raw = setLines[0] ? setLines[0].split(':')[1] : ''
  const p2raw = setLines[1] ? setLines[1].split(':')[1] : ''
  const p1sets = p1raw ? p1raw.trim().split(/\s+/).filter(function(s) { return s.length > 0 }) : []
  const p2sets = p2raw ? p2raw.trim().split(/\s+/).filter(function(s) { return s.length > 0 }) : []
  return { p1sets, p2sets, winner, walkover }
}

function getSurface(t: string, c: string): { label: string; color: string } {
  const s = (t + c).toLowerCase()
  if (/roland|madrid|barcelona|rome|monte|hamburg|lyon|munich|bmw|clay/.test(s)) {
    return { label: 'Terre battue', color: '#ef4444' }
  }
  if (/wimbledon|queens|halle|grass|eastbourne/.test(s)) {
    return { label: 'Gazon', color: '#22c55e' }
  }
  return { label: 'Dur', color: '#3b82f6' }
}

const PHASE_FR: Record<string, string> = {
  'The Final': 'FINALE', Finals: 'FINALE', Semifinals: 'DEMI-FINALES',
  Quarterfinals: 'QUARTS DE FINALE', '2nd Round': '2ÈME TOUR', '1st Round': '1ER TOUR',
  'Round of 16': 'HUITIÈMES', 'Round of 32': 'SEIZIÈMES', Qualifying: 'QUALIFICATIONS',
  'Round Robin': 'PHASE DE GROUPES', 'Third Round': '3ÈME TOUR',
}
const PHASE_EN: Record<string, string> = {
  'The Final': 'FINAL', Finals: 'FINAL', Semifinals: 'SEMIFINALS',
  Quarterfinals: 'QUARTERFINALS', '2nd Round': '2ND ROUND', '1st Round': '1ST ROUND',
  'Round of 16': 'ROUND OF 16', Qualifying: 'QUALIFYING',
}

function tPhase(p: string, lang: string): string {
  const map = lang === 'fr' ? PHASE_FR : PHASE_EN
  return map[p] ? map[p] : p.toUpperCase()
}

interface TGroup {
  key: string
  tournament: string
  city: string
  country: string
  surface: { label: string; color: string }
  flag: string
  events: TennisEvent[]
}

function groupEvents(events: TennisEvent[]): TGroup[] {
  const map = new Map<string, TGroup>()
  for (const ev of events) {
    const meta = parseMeta(ev.strDescriptionEN, ev.strEvent)
    const key = meta.tournament ? meta.tournament : 'Autre'
    if (!map.has(key)) {
      const country = ev.strCountry ? ev.strCountry : ''
      map.set(key, {
        key,
        tournament: meta.tournament,
        city: meta.city,
        country,
        surface: getSurface(meta.tournament, meta.city),
        flag: FLAG[country] ? FLAG[country] : '🎾',
        events: [],
      })
    }
    const group = map.get(key)
    if (group) group.events.push(ev)
  }
  return [...map.values()]
}

function MatchRow({ ev, lang }: { ev: TennisEvent; lang: string }) {
  const players = parsePlayers(ev.strEvent, ev.strDescriptionEN)
  const p1 = players.p1
  const p2 = players.p2
  const meta = parseMeta(ev.strDescriptionEN, ev.strEvent)
  const rank1 = meta.rank1
  const rank2 = meta.rank2
  const result = parseResult(ev.strResult)
  const p1sets = result.p1sets
  const p2sets = result.p2sets
  const winner = result.winner
  const walkover = result.walkover

  const isFinished = ev.strStatus === 'Match Finished'
  const isLive = ev.strStatus === 'In Progress' || ev.strStatus === 'LIVE'

  const p1sWon = p1sets.filter(function(s, i) {
    const opp = p2sets[i] ? p2sets[i] : '0'
    return parseInt(s) > parseInt(opp)
  }).length
  const p2sWon = p2sets.filter(function(s, i) {
    const opp = p1sets[i] ? p1sets[i] : '0'
    return parseInt(s) > parseInt(opp)
  }).length

  const p1NameStart = p1.split(' ')[0] ? p1.split(' ')[0].toLowerCase() : ''
  const winnerStart = winner.split(' ')[0] ? winner.split(' ')[0].toLowerCase() : ''
  const p1matchWinner = isFinished && winner !== '' && p1NameStart !== '' && winnerStart !== '' && p1NameStart === winnerStart

  const finalP1won = isFinished && (p1matchWinner || (winner === '' && p1sWon > p2sWon))
  const finalP2won = isFinished && !finalP1won && (winner !== '' || p2sWon > p1sWon)
  const nSets = Math.max(p1sets.length, p2sets.length)

  return (
    <Link
      href={'/match/' + ev.idEvent}
      className="t-row"
      style={{
        display: 'flex', alignItems: 'stretch', textDecoration: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', minHeight: 56,
      }}
    >
      <div style={{ width: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
        {isLive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'tPulse 1.4s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{lang === 'fr' ? 'EN DIRECT' : 'LIVE'}</span>
          </div>
        ) : isFinished ? (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' }}>
            {walkover ? (lang === 'fr' ? 'Aband.' : 'W/O') : (lang === 'fr' ? 'Terminé' : 'FT')}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {ev.strTime ? ev.strTime.slice(0, 5) : '—'}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border)', borderRight: nSets > 0 ? '1px solid var(--border)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 4px', borderBottom: '1px solid var(--border)' }}>
          {rank1 && <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>{rank1}</span>}
          <span style={{ fontSize: 13, fontWeight: finalP1won ? 700 : 400, color: finalP1won ? 'var(--text-primary)' : finalP2won ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p1}</span>
          {finalP1won && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 8px' }}>
          {rank2 && <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 22, textAlign: 'right', flexShrink: 0 }}>{rank2}</span>}
          <span style={{ fontSize: 13, fontWeight: finalP2won ? 700 : 400, color: finalP2won ? 'var(--text-primary)' : finalP1won ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p2}</span>
          {finalP2won && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
      </div>

      {nSets > 0 && Array.from({ length: nSets }).map(function(_, i) {
        const s1 = p1sets[i] ? p1sets[i] : ''
        const s2 = p2sets[i] ? p2sets[i] : ''
        const isLast = i === nSets - 1
        const s1w = s1 !== '' && s2 !== '' && parseInt(s1) > parseInt(s2)
        const s2w = s1 !== '' && s2 !== '' && parseInt(s2) > parseInt(s1)
        return (
          <div key={i} style={{ width: 28, flexShrink: 0, borderLeft: '1px solid var(--border)', background: isLast ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
            <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: s1w ? 700 : 400, color: s1w ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{s1}</span>
            </div>
            <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: s2w ? 700 : 400, color: s2w ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{s2}</span>
            </div>
          </div>
        )
      })}

      <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }}>›</div>
    </Link>
  )
}

function TournamentBlock({ group, lang, circuit }: { group: TGroup; lang: string; circuit: 'ATP' | 'WTA' }) {
  const byPhase = new Map<string, TennisEvent[]>()
  for (const ev of group.events) {
    const meta = parseMeta(ev.strDescriptionEN, ev.strEvent)
    const key = meta.phase ? meta.phase : '—'
    if (!byPhase.has(key)) byPhase.set(key, [])
    const arr = byPhase.get(key)
    if (arr) arr.push(ev)
  }

  const cityLabel = group.city ? group.city : group.tournament

  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
        {/* Circuit badge */}
        <div style={{
          padding: '2px 7px', borderRadius: 5, flexShrink: 0,
          background: circuit === 'ATP' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
          border: '1px solid ' + (circuit === 'ATP' ? 'rgba(59,130,246,0.4)' : 'rgba(236,72,153,0.4)'),
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: circuit === 'ATP' ? '#2563eb' : '#db2777', letterSpacing: '.06em' }}>{circuit}</span>
        </div>
        {/* Drapeau + nom tournoi + ville */}
        <span style={{ fontSize: 14 }}>{group.flag}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.tournament}
          </div>
          {cityLabel !== group.tournament && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cityLabel}{group.country ? ' · ' + group.country : ''}</div>
          )}
        </div>
        {/* Surface pill coloré */}
        <div style={{
          padding: '2px 8px', borderRadius: 4, flexShrink: 0,
          background: group.surface.color + '22',
          border: '1px solid ' + group.surface.color + '55',
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: group.surface.color, letterSpacing: '.04em' }}>
            {group.surface.label.toUpperCase()}
          </span>
        </div>
      </div>
      {[...byPhase.entries()].map(function(entry) {
        const phase = entry[0]
        const events = entry[1]
        return (
          <div key={phase}>
            <div style={{ padding: '6px 14px 3px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em' }}>{tPhase(phase, lang)}</span>
            </div>
            {events.map(function(ev) { return <MatchRow key={ev.idEvent} ev={ev} lang={lang} /> })}
          </div>
        )
      })}
    </div>
  )
}

export default function TennisClient() {
  const { lang } = useT()
  const [tab,     setTab]     = useState<'results' | 'upcoming'>('results')
  const [circuit, setCircuit] = useState<'all' | 'ATP' | 'WTA'>('all')
  const [atpPast, setAtpPast] = useState<TennisEvent[]>([])
  const [wtaPast, setWtaPast] = useState<TennisEvent[]>([])
  const [atpNext, setAtpNext] = useState<TennisEvent[]>([])
  const [wtaNext, setWtaNext] = useState<TennisEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    async function fetchAll() {
      setLoading(true)
      try {
        const responses = await Promise.all([
          fetch(BASE + '/eventspastleague.php?id=4464'),
          fetch(BASE + '/eventspastleague.php?id=4517'),
          fetch(BASE + '/eventsnextleague.php?id=4464'),
          fetch(BASE + '/eventsnextleague.php?id=4517'),
        ])
        const data = await Promise.all(responses.map(function(r) { return r.json() }))
        setAtpPast(data[0].events ? data[0].events : [])
        setWtaPast(data[1].events ? data[1].events : [])
        setAtpNext(data[2].events ? data[2].events : [])
        setWtaNext(data[3].events ? data[3].events : [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const atpEvents = tab === 'results' ? atpPast : atpNext
  const wtaEvents = tab === 'results' ? wtaPast : wtaNext
  const atpGroups = groupEvents(atpEvents)
  const wtaGroups = groupEvents(wtaEvents)
  const hasLive = [...atpEvents, ...wtaEvents].some(function(e) {
    return e.strStatus === 'In Progress' || e.strStatus === 'LIVE'
  })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes tPulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        .t-row:hover { background: var(--bg-muted) !important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, background: 'var(--bg-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎾</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Tennis</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{lang === 'fr' ? 'Circuits ATP & WTA' : 'ATP & WTA Tours'}</p>
        </div>
        {hasLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'tPulse 1.4s infinite' }} />
            {lang === 'fr' ? 'EN DIRECT' : 'LIVE'}
          </span>
        )}
      </div>

      {/* Onglets résultats / à venir */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-muted)', padding: 4, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 12 }}>
        {(['results', 'upcoming'] as const).map(function(t) {
          return (
            <button key={t} onClick={function() { setTab(t) }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', background: tab === t ? 'var(--accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--text-muted)' }}>
              {t === 'results' ? (lang === 'fr' ? '📋 Résultats' : '📋 Results') : (lang === 'fr' ? '📅 À venir' : '📅 Upcoming')}
            </button>
          )
        })}
      </div>
      {/* Filtre circuit ATP / WTA */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {(['all', 'ATP', 'WTA'] as const).map(function(c) {
          const active = circuit === c
          const color = c === 'WTA' ? '#db2777' : 'var(--accent)'
          return (
            <button key={c} onClick={function() { setCircuit(c) }} style={{
              padding: '5px 14px', borderRadius: 8, border: '1px solid ' + (active ? color : 'var(--border)'),
              background: active ? color : 'transparent', color: active ? '#fff' : 'var(--text-muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
            }}>
              {c === 'all' ? (lang === 'fr' ? 'Tous' : 'All') : c}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(function(i) {
            return <div key={i} style={{ height: 140, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', animation: 'shimmer 1.6s infinite' }} />
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(circuit === 'all' || circuit === 'ATP') && atpGroups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {circuit === 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: '.07em' }}>ATP</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lang === 'fr' ? 'Circuit Masculin' : "Men's Tour"}</span>
                </div>
              )}
              {atpGroups.map(function(g) { return <TournamentBlock key={g.key} group={g} lang={lang} circuit="ATP" /> })}
            </div>
          )}
          {(circuit === 'all' || circuit === 'WTA') && wtaGroups.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {circuit === 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.25)' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#ec4899', letterSpacing: '.07em' }}>WTA</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lang === 'fr' ? 'Circuit Féminin' : "Women's Tour"}</span>
                </div>
              )}
              {wtaGroups.map(function(g) { return <TournamentBlock key={g.key} group={g} lang={lang} circuit="WTA" /> })}
            </div>
          )}
          {atpGroups.length === 0 && wtaGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🎾</p>
              <p style={{ fontSize: 14 }}>{lang === 'fr' ? 'Aucun match disponible' : 'No matches available'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
