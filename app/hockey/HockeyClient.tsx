'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DatePicker from '@/app/components/DatePicker'
import StandingsPanel from '@/app/components/StandingsPanel'
import { useT } from '@/lib/i18n'
import { translateCountry } from '@/lib/labels'

const PROXY_HOST = "sports.highlightly.net"

interface HockeyMatch {
  id: number
  date: string
  country: { name: string; logo: string | null }
  state: {
    clock: number | null
    description: string
    score: {
      current: string | null
      firstPeriod: string | null
      secondPeriod: string | null
      thirdPeriod: string | null
      overTime: string | null
      penalties: string | null
    }
  }
  homeTeam: { id: number; name: string; logo: string | null }
  awayTeam: { id: number; name: string; logo: string | null }
  league:   { id: number; name: string; logo: string | null }
}

interface LeagueGroup {
  id: string
  name: string
  logo: string | null
  country: string
  matches: HockeyMatch[]
}

// ─── Priorité des ligues ──────────────────────────────────
const LEAGUE_PRIORITY: Record<string, number> = {
  'NHL': 1, 'AHL': 2, 'KHL': 3, 'PWHL Women': 4,
  'SHL': 5, 'Liiga': 6, 'DEL': 7, 'NLA': 8,
  'OHL': 9, 'WHL': 10, 'QMJHL': 11, 'ECHL': 12,
  'MHL': 13, 'VHL': 14,
}

// ─── Traduction des statuts ───────────────────────────────
const LIVE_DESCRIPTIONS = [
  'First period', 'Second period', 'Third period',
  'Over time', 'Penalties', 'In Progress', 'Live',
  'Break', 'Pause',
]

function getStatus(desc: string, lang: string): { label: string; isLive: boolean; isFinished: boolean } {
  const d = desc ?? ''
  if (d === 'Not started')          return { label: '', isLive: false, isFinished: false }
  if (d === 'Finished')             return { label: 'FT',    isLive: false, isFinished: true }
  if (d === 'Finished after over time')
                                    return { label: lang === 'fr' ? 'Ap. prol.' : 'FT-OT', isLive: false, isFinished: true }
  if (d === 'Finished after penalties')
                                    return { label: lang === 'fr' ? 'Ap. TAB' : 'FT-SO',  isLive: false, isFinished: true }
  if (d === 'First period')         return { label: 'P1', isLive: true, isFinished: false }
  if (d === 'Second period')        return { label: 'P2', isLive: true, isFinished: false }
  if (d === 'Third period')         return { label: 'P3', isLive: true, isFinished: false }
  if (d === 'Over time')            return { label: 'OT', isLive: true, isFinished: false }
  if (d === 'Penalties')            return { label: 'TAB', isLive: true, isFinished: false }
  if (LIVE_DESCRIPTIONS.includes(d))return { label: lang === 'fr' ? 'EN DIRECT' : 'LIVE', isLive: true, isFinished: false }
  if (d === 'Postponed')            return { label: lang === 'fr' ? 'Reporté' : 'Postponed', isLive: false, isFinished: false }
  return { label: d, isLive: false, isFinished: false }
}

function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Colonne période ──────────────────────────────────────
function PeriodCol({ label, homeVal, awayVal, highlight }: {
  label: string; homeVal: string; awayVal: string; highlight?: boolean
}) {
  const h = homeVal ? parseInt(homeVal) : null
  const a = awayVal ? parseInt(awayVal) : null
  return (
    <div className="hk-period" style={{
      width: 28, flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      background: highlight ? 'rgba(59,130,246,0.06)' : 'transparent',
    }}>
      <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
        <span style={{ fontSize: 8, color: highlight ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: '.04em' }}>{label}</span>
      </div>
      <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: (h !== null && a !== null && h > a) ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {homeVal || ''}
        </span>
      </div>
      <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: (h !== null && a !== null && a > h) ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {awayVal || ''}
        </span>
      </div>
    </div>
  )
}

// ─── Ligne de match ───────────────────────────────────────
function MatchRow({ match, lang }: { match: HockeyMatch; lang: string }) {
  const sc = match.state.score
  const desc = match.state.description
  const { label, isLive, isFinished } = getStatus(desc, lang)
  const hasScore  = sc.current != null
  const [hs, as_] = hasScore ? sc.current!.split(' - ').map(Number) : [null, null]
  const homeWin   = hasScore && hs! > as_!
  const awayWin   = hasScore && as_! > hs!
  const homeLogo  = proxyLogo(match.homeTeam.logo)
  const awayLogo  = proxyLogo(match.awayTeam.logo)

  // Décomposition des périodes
  function parsePeriod(val: string | null): [string, string] {
    if (!val) return ['', '']
    const [h, a] = val.split(' - ')
    return [h ?? '', a ?? '']
  }
  const [p1h, p1a] = parsePeriod(sc.firstPeriod)
  const [p2h, p2a] = parsePeriod(sc.secondPeriod)
  const [p3h, p3a] = parsePeriod(sc.thirdPeriod)
  const [oth, ota] = parsePeriod(sc.overTime)
  const [pnh, pna] = parsePeriod(sc.penalties)

  const showOT  = !!(oth || ota)
  const showPen = !!(pnh || pna)

  return (
    <Link href={`/match/${match.id}`} className="hk-row" style={{
      display: 'flex', alignItems: 'stretch', textDecoration: 'none',
      borderBottom: '1px solid var(--border)',
      background: isLive ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
      borderLeft: isLive ? '3px solid #ef4444' : '3px solid transparent',
      minHeight: 56,
    }}>
      {/* Statut */}
      <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
        {isLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'hkPulse 1.4s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{label}</span>
          </div>
        ) : desc === 'Not started' ? (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {new Date(match.date).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
        )}
      </div>

      {/* Équipes */}
      <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 4px', borderBottom: '1px solid var(--border)' }}>
          {homeLogo
            ? <Image src={homeLogo} alt="" width={18} height={18} style={{ objectFit: 'contain', flexShrink: 0 }} unoptimized />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-muted)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? 'var(--text-primary)' : awayWin ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.homeTeam.name}
          </span>
          {homeWin && hasScore && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 8px' }}>
          {awayLogo
            ? <Image src={awayLogo} alt="" width={18} height={18} style={{ objectFit: 'contain', flexShrink: 0 }} unoptimized />
            : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-muted)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? 'var(--text-primary)' : homeWin ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.awayTeam.name}
          </span>
          {awayWin && hasScore && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
        </div>
      </div>

      {/* Périodes P1/P2/P3 + OT/TAB */}
      {hasScore && <>
        <PeriodCol label="P1" homeVal={p1h} awayVal={p1a} />
        <PeriodCol label="P2" homeVal={p2h} awayVal={p2a} />
        <PeriodCol label="P3" homeVal={p3h} awayVal={p3a} />
        {showOT  && <PeriodCol label="OT"  homeVal={oth}  awayVal={ota}  highlight />}
        {showPen && <PeriodCol label="TAB" homeVal={pnh}  awayVal={pna}  highlight />}
      </>}

      {/* Score total */}
      {hasScore && (
        <div style={{ width: 40, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'rgba(59,130,246,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.04em' }}>TOT</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: homeWin ? 700 : 500, color: homeWin ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{hs}</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: awayWin ? 700 : 500, color: awayWin ? 'var(--text-primary)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{as_}</span>
          </div>
        </div>
      )}

      <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14, flexShrink: 0 }}>›</div>
    </Link>
  )
}

// ─── Bloc ligue ───────────────────────────────────────────
function LeagueBlock({ group, lang }: { group: LeagueGroup; lang: string }) {
  const logo = proxyLogo(group.logo)
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
        {logo
          ? <div style={{ background: '#fff', borderRadius: 4, padding: 2, display: 'flex', flexShrink: 0 }}>
              <Image src={logo} alt="" width={18} height={18} style={{ objectFit: 'contain' }} unoptimized />
            </div>
          : <span style={{ fontSize: 16, flexShrink: 0 }}>🏒</span>
        }
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </span>
        {group.country && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
            {translateCountry(group.country, lang)}
          </span>
        )}
        <StandingsPanel
          leagueId={group.id}
          leagueName={group.name}
          endpointUrl="/api/hockey-standings"
        />
      </div>
      {group.matches.map(m => <MatchRow key={m.id} match={m} lang={lang} />)}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────
const HOCKEY_FINISHED = new Set(["Finished", "Finished after over time", "Finished after penalties"])

export default function HockeyClient() {
  const { lang } = useT()
  const searchParams  = useSearchParams()
  const leagueFilter  = searchParams.get('league')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groups,  setGroups]  = useState<LeagueGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all')

  const load = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = formatDate(date)
      const res = await fetch(`/api/hockey?date=${dateStr}`)
      const grouped: Record<string, any[]> = await res.json()

      const leagueGroups: LeagueGroup[] = Object.entries(grouped).map(([id, matches]) => {
        const first = matches[0]
        return {
          id,
          name:    first.league?.name ?? 'Unknown',
          logo:    first.league?.logo ?? null,
          country: first.country?.name ?? '',
          matches,
        }
      })

      // Trier : NHL > AHL > KHL > reste alphabétique
      leagueGroups.sort((a, b) => {
        const pa = LEAGUE_PRIORITY[a.name] ?? 99
        const pb = LEAGUE_PRIORITY[b.name] ?? 99
        if (pa !== pb) return pa - pb
        return a.name.localeCompare(b.name)
      })

      setGroups(leagueGroups)
    } catch (e) {
      console.error(e)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(selectedDate) }, [selectedDate, load])

  // Filtrer par ligue + par onglet
  const displayGroups = useMemo(() => {
    let base = leagueFilter ? groups.filter(g => g.name === leagueFilter) : groups
    if (activeTab === 'all') return base
    return base.map(g => ({
      ...g,
      matches: g.matches.filter(m => {
        const d = m.state.description
        if (activeTab === 'live')     return LIVE_DESCRIPTIONS.includes(d)
        if (activeTab === 'finished') return HOCKEY_FINISHED.has(d)
        if (activeTab === 'upcoming') return d === 'Not started'
        return true
      })
    })).filter(g => g.matches.length > 0)
  }, [groups, leagueFilter, activeTab])

  const totalMatches = displayGroups.reduce((a, g) => a + g.matches.length, 0)
  const hasLive = displayGroups.some(g =>
    g.matches.some(m => LIVE_DESCRIPTIONS.includes(m.state.description))
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes hkPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .hk-row:hover { background: var(--bg-muted) !important; }
        .hk-period { display: flex; flex-direction: column; }
        @media (max-width: 640px) { .hk-period { display: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, background: 'var(--bg-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🏒
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {lang === 'fr' ? 'Hockey sur glace' : 'Ice Hockey'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {totalMatches} match{totalMatches > 1 ? 's' : ''} · NHL, AHL, KHL…
          </p>
        </div>
        {hasLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'hkPulse 1.4s infinite' }} />
            {lang === 'fr' ? 'EN DIRECT' : 'LIVE'}
          </span>
        )}
      </div>

      {/* DatePicker */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <DatePicker selected={selectedDate} onChange={(d) => { setSelectedDate(d); setActiveTab('all') }} lang={lang as 'fr' | 'en'} />
      </div>

      {/* Onglets */}
      {!loading && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {([
            { key: 'all',      fr: 'Tous',      en: 'All' },
            { key: 'live',     fr: 'En Direct',  en: 'Live' },
            { key: 'finished', fr: 'Terminés',   en: 'Finished' },
            { key: 'upcoming', fr: 'À venir',    en: 'Upcoming' },
          ] as const).map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                padding: '8px 12px', border: 'none', cursor: 'pointer', background: 'transparent',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ef4444' : 'var(--text-muted)',
                borderBottom: `2px solid ${isActive ? '#ef4444' : 'transparent'}`,
                marginBottom: -1, transition: 'color .15s, border-color .15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {tab.key === 'live' && isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'hkPulse 1.4s infinite' }} />}
                {lang === 'fr' ? tab.fr : tab.en}
              </button>
            )
          })}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 120, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', animation: 'shimmer 1.6s infinite' }} />
          ))}
        </div>
      ) : totalMatches === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏒</p>
          <p style={{ fontSize: 14 }}>
            {lang === 'fr' ? 'Aucun match de hockey ce jour' : 'No ice hockey matches today'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayGroups.map(g => <LeagueBlock key={g.id} group={g} lang={lang} />)}
        </div>
      )}
    </div>
  )
}
