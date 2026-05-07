'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DatePicker from './DatePicker'
import { useT } from '@/lib/i18n'

const BASE = 'https://www.thesportsdb.com/api/v1/json/139695'

interface SportEvent {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  strTime: string
  dateEvent: string
  strLeague: string
  strLeagueBadge: string | null
  strVenue: string | null
  strCountry: string | null
  strResult: string | null
}

const LIVE_STATUSES = ['In Progress', 'HT', 'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'LIVE']

const COUNTRY_FLAG: Record<string, string> = {
  France: '🇫🇷', Germany: '🇩🇪', Spain: '🇪🇸', Italy: '🇮🇹',
  Poland: '🇵🇱', Turkey: '🇹🇷', Israel: '🇮🇱', Australia: '🇦🇺',
  Argentina: '🇦🇷', China: '🇨🇳', 'United States': '🇺🇸', USA: '🇺🇸',
  Canada: '🇨🇦', England: '🇬🇧', Belgium: '🇧🇪', Netherlands: '🇳🇱',
  Croatia: '🇭🇷', Austria: '🇦🇹', 'New Zealand': '🇳🇿', Finland: '🇫🇮',
  Czechia: '🇨🇿', Slovakia: '🇸🇰', Estonia: '🇪🇪', Bulgaria: '🇧🇬',
  Cyprus: '🇨🇾', 'The Netherlands': '🇳🇱',
}

const LEAGUE_OVERRIDE: Record<string, { country: string; flag: string }> = {
  'NBA': { country: 'USA', flag: '🇺🇸' },
  'EuroLeague Basketball': { country: 'Europe', flag: '🇪🇺' },
  'BNXT League': { country: 'Bel/NL', flag: '🇧🇪' },
  'NBL1 West': { country: 'Australia', flag: '🇦🇺' },
  'NBL1 North': { country: 'Australia', flag: '🇦🇺' },
  'Super League Basketball': { country: 'England', flag: '🇬🇧' },
  'Super League Basketball Women': { country: 'England', flag: '🇬🇧' },
}

// Ligues prioritaires affichées en premier
const LEAGUE_PRIORITY: Record<string, number> = {
  'NBA': 1,
  'EuroLeague Basketball': 2,
  'French LNB': 3,
  'German BBL': 4,
  'Turkish Basketbol Super Ligi': 5,
  'Spanish ACB': 6,
  'Italian Lega Basket': 7,
  'BNXT League': 8,
  'Chinese CBA': 9,
  'Argentine LNB': 10,
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function parseQuarters(strResult: string | null, teamName: string): string[] {
  if (!strResult) return []
  const lines = strResult.split('\n').filter(function(l) { return l.trim().length > 0 })
  for (const line of lines) {
    if (line.toLowerCase().includes(teamName.toLowerCase().split(' ')[0].toLowerCase())) {
      const parts = line.split('<br>')
      const qStr = parts[1] ? parts[1].trim() : ''
      return qStr ? qStr.split(/\s+/).filter(function(s) { return s.length > 0 }) : []
    }
  }
  return []
}

function getStatusLabel(status: string, lang: string): { label: string; isLive: boolean } {
  const isLive = LIVE_STATUSES.includes(status)
  if (status === 'NS')  return { label: '', isLive: false }
  if (status === 'FT')  return { label: lang === 'fr' ? 'Terminé' : 'FT', isLive: false }
  if (status === 'AOT') return { label: 'OT', isLive: false }
  if (status === 'Q1')  return { label: 'Q1', isLive: true }
  if (status === 'Q2')  return { label: 'Q2', isLive: true }
  if (status === 'Q3')  return { label: 'Q3', isLive: true }
  if (status === 'Q4')  return { label: 'Q4', isLive: true }
  if (isLive)           return { label: lang === 'fr' ? 'EN DIRECT' : 'LIVE', isLive: true }
  return { label: status, isLive: false }
}

interface LeagueGroup {
  key: string
  name: string
  badge: string | null
  country: string
  flag: string
  events: SportEvent[]
}

function groupByLeague(events: SportEvent[]): LeagueGroup[] {
  const map = new Map<string, LeagueGroup>()
  for (const ev of events) {
    const key = ev.strLeague
    if (!map.has(key)) {
      const override = LEAGUE_OVERRIDE[ev.strLeague]
      const country = override ? override.country : (ev.strCountry ? ev.strCountry : '')
      const flag = override
        ? override.flag
        : (COUNTRY_FLAG[ev.strCountry ? ev.strCountry : ''] ? COUNTRY_FLAG[ev.strCountry ? ev.strCountry : ''] : '🏀')
      map.set(key, { key, name: ev.strLeague, badge: ev.strLeagueBadge, country, flag, events: [] })
    }
    const group = map.get(key)
    if (group) group.events.push(ev)
  }
  // Trier par priorité — ligues prioritaires en premier, le reste par ordre alphabétique
  return [...map.values()].sort(function(a, b) {
    const pa = LEAGUE_PRIORITY[a.name] ? LEAGUE_PRIORITY[a.name] : 99
    const pb = LEAGUE_PRIORITY[b.name] ? LEAGUE_PRIORITY[b.name] : 99
    if (pa !== pb) return pa - pb
    return a.name.localeCompare(b.name)
  })
}

function MatchRow({ ev, lang }: { ev: SportEvent; lang: string }) {
  const hasScore  = ev.intHomeScore !== null && ev.intAwayScore !== null
  const homeScore = hasScore ? parseInt(ev.intHomeScore!) : null
  const awayScore = hasScore ? parseInt(ev.intAwayScore!) : null
  const homeWin   = hasScore && homeScore! > awayScore!
  const awayWin   = hasScore && awayScore! > homeScore!
  const statusInfo = getStatusLabel(ev.strStatus, lang)

  const homeQ = parseQuarters(ev.strResult, ev.strHomeTeam)
  const awayQ = parseQuarters(ev.strResult, ev.strAwayTeam)
  const nQ    = Math.max(homeQ.length, awayQ.length)
  const showQuarters = nQ > 0 && hasScore

  const isLiveMatch = statusInfo.isLive

  return (
    <Link href={'/match/' + ev.idEvent} className="bk-row" style={{
      display: 'flex', alignItems: 'stretch', textDecoration: 'none',
      borderBottom: '1px solid var(--border)',
      background: isLiveMatch ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
      borderLeft: isLiveMatch ? '3px solid #ef4444' : '3px solid transparent',
      minHeight: 56,
    }}>
      {/* Statut / heure */}
      <div style={{ width: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
        {statusInfo.isLive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'bkPulse 1.4s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{statusInfo.label}</span>
          </div>
        ) : ev.strStatus === 'NS' ? (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {ev.strTime ? ev.strTime.slice(0, 5) : '—'}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Équipes */}
      <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 4px', borderBottom: '1px solid var(--border)' }}>
          {ev.strHomeTeamBadge
            ? <img src={ev.strHomeTeamBadge} style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-muted)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? 'var(--text-primary)' : awayWin ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.strHomeTeam}
          </span>
          {homeWin && hasScore && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 8px' }}>
          {ev.strAwayTeamBadge
            ? <img src={ev.strAwayTeamBadge} style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-muted)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? 'var(--text-primary)' : homeWin ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.strAwayTeam}
          </span>
          {awayWin && hasScore && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
      </div>

      {/* Quarts Q1-Q4 — cachés sur mobile */}
      {showQuarters && Array.from({ length: nQ }).map(function(_, i) {
        const hQ    = homeQ[i] ? homeQ[i] : ''
        const aQ    = awayQ[i] ? awayQ[i] : ''
        const label = i < 4 ? 'Q' + (i + 1) : 'OT'
        return (
          <div key={i} className="bk-quarter" style={{ width: 32, flexShrink: 0, borderLeft: '1px solid var(--border)' }}>
            <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '.04em' }}>{label}</span>
            </div>
            <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{hQ}</span>
            </div>
            <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{aQ}</span>
            </div>
          </div>
        )
      })}

      {/* Score total — toujours visible */}
      {hasScore && (
        <div className="bk-score-col" style={{ width: 40, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'rgba(59,130,246,0.06)', flexDirection: 'column' }}>
          <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.04em' }}>TOT</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: homeWin ? 700 : 500, color: homeWin ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{homeScore}</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: awayWin ? 700 : 500, color: awayWin ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{awayScore}</span>
          </div>
        </div>
      )}

      <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }}>›</div>
    </Link>
  )
}

function LeagueBlock({ group, lang }: { group: LeagueGroup; lang: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
        <span style={{ fontSize: 16 }}>{group.flag}</span>
        {group.badge ? (
          <div style={{ background: '#fff', borderRadius: 4, padding: 2, display: 'flex', flexShrink: 0 }}>
            <img src={group.badge} style={{ width: 18, height: 18, objectFit: 'contain' }} />
          </div>
        ) : null}
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{group.country}</span>
      </div>
      {group.events.map(function(ev) { return <MatchRow key={ev.idEvent} ev={ev} lang={lang} /> })}
    </div>
  )
}

export default function SportDayClient({
  sport, sportLabel, emoji,
}: {
  sport: string; sportLabel: string; emoji: string
}) {
  const { lang } = useT()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groups, setGroups]             = useState<LeagueGroup[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(function() {
    async function fetch_() {
      setLoading(true)
      try {
        const date = formatDate(selectedDate)
        const res  = await fetch(BASE + '/eventsday.php?d=' + date + '&s=' + sport)
        const data = await res.json()
        const events: SportEvent[] = data.events ? data.events : []
        setGroups(groupByLeague(events))
      } catch (e) {
        console.error(e)
        setGroups([])
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [selectedDate, sport])

  const totalMatches = groups.reduce(function(a, g) { return a + g.events.length }, 0)
  const hasLive = groups.some(function(g) {
    return g.events.some(function(e) { return LIVE_STATUSES.includes(e.strStatus) })
  })

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes bkPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .bk-row:hover { background: var(--bg-muted) !important; }
        .bk-quarter { display: flex; flex-direction: column; }
        .bk-score-col { display: flex; }
        @media (max-width: 640px) { .bk-quarter { display: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, background: 'var(--bg-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{sportLabel}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {totalMatches} match{totalMatches > 1 ? 's' : ''}
          </p>
        </div>
        {hasLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'bkPulse 1.4s infinite' }} />
            {lang === 'fr' ? 'EN DIRECT' : 'LIVE'}
          </span>
        )}
      </div>

      {/* DatePicker */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <DatePicker selected={selectedDate} onChange={setSelectedDate} lang={lang as 'fr' | 'en'} />
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map(function(i) {
            return <div key={i} style={{ height: 64, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', animation: 'shimmer 1.6s infinite' }} />
          })}
        </div>
      ) : totalMatches === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</p>
          <p style={{ fontSize: 14 }}>
            {lang === 'fr' ? 'Aucun match ' + sportLabel.toLowerCase() + ' ce jour' : 'No ' + sportLabel + ' matches today'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(function(g) { return <LeagueBlock key={g.key} group={g} lang={lang} /> })}
        </div>
      )}
    </div>
  )
}
