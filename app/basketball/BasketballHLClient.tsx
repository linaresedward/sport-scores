'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import DatePicker from '@/app/components/DatePicker'
import BasketStandingsModal from '@/app/components/BasketStandingsModal'
import { useT } from '@/lib/i18n'
import { translateCountry } from '@/lib/labels'

// ─── Types ────────────────────────────────────────────────
interface BMatch {
  id: number; date: string
  country: { name: string }
  state: {
    clock: number | null; description: string
    score: { q1: string|null; q2: string|null; q3: string|null; q4: string|null; current: string|null; overTime: string|null }
  }
  homeTeam: { id: number; name: string; logo: string|null }
  awayTeam: { id: number; name: string; logo: string|null }
  league: { id: number; name: string; logo: string|null }
}

interface LeagueGroup { id: string; name: string; logo: string|null; country: string; matches: BMatch[] }

// ─── Priorité ─────────────────────────────────────────────
const LEAGUE_PRIORITY: Record<string, number> = {
  'NBA': 1, 'NBA Women': 2, 'LNB': 3, 'ACB': 4,
  'ABA League': 5, 'Lega A': 6, 'BBL': 7, 'Super Ligi': 8,
  'EuroLeague': 9, 'EuroCup': 10,
}

// ─── Statuts ──────────────────────────────────────────────
const LIVE_DESCS = new Set(['First quarter','Second quarter','Third quarter','Fourth quarter','Half time','Over time','In Progress'])
const FINISHED_DESCS = new Set(['Finished','Finished after over time'])

function getStatus(desc: string, lang: string): { label: string; isLive: boolean; isFinished: boolean } {
  if (desc === 'Not started') return { label: '', isLive: false, isFinished: false }
  if (desc === 'Finished')    return { label: 'FT', isLive: false, isFinished: true }
  if (desc === 'Finished after over time') return { label: lang==='fr'?'Ap. prol.':'FT-OT', isLive: false, isFinished: true }
  if (desc === 'First quarter')  return { label: 'Q1', isLive: true, isFinished: false }
  if (desc === 'Second quarter') return { label: 'Q2', isLive: true, isFinished: false }
  if (desc === 'Third quarter')  return { label: 'Q3', isLive: true, isFinished: false }
  if (desc === 'Fourth quarter') return { label: 'Q4', isLive: true, isFinished: false }
  if (desc === 'Half time')      return { label: 'MT', isLive: true, isFinished: false }
  if (desc === 'Over time')      return { label: 'OT', isLive: true, isFinished: false }
  if (desc === 'Postponed')      return { label: lang==='fr'?'Reporté':'Postponed', isLive: false, isFinished: false }
  if (LIVE_DESCS.has(desc))      return { label: lang==='fr'?'EN DIRECT':'LIVE', isLive: true, isFinished: false }
  return { label: desc, isLive: false, isFinished: false }
}

function parseQ(val: string|null): [string, string] {
  if (!val) return ['','']
  const parts = val.split(' - ')
  return [parts[0]?.trim()||'', parts[1]?.trim()||'']
}

function proxyLogo(url: string|null|undefined): string|null {
  if (!url) return null
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Colonne quart-temps ──────────────────────────────────
function QCol({ label, home, away, highlight }: { label: string; home: string; away: string; highlight?: boolean }) {
  return (
    <div className="bk-quarter" style={{ width: 32, flexShrink: 0, borderLeft: '1px solid var(--border)', background: highlight ? 'rgba(59,130,246,0.06)' : 'transparent', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
        <span style={{ fontSize: 8, color: highlight ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, letterSpacing: '.04em' }}>{label}</span>
      </div>
      <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{home}</span>
      </div>
      <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{away}</span>
      </div>
    </div>
  )
}

// ─── Ligne de match ───────────────────────────────────────
function MatchRow({ match, lang }: { match: BMatch; lang: string }) {
  const sc = match.state.score
  const { label, isLive, isFinished } = getStatus(match.state.description, lang)
  const hasScore = sc.current != null
  const [hs, as_] = hasScore ? sc.current!.split(' - ').map(Number) : [null, null]
  const homeWin = hasScore && hs! > as_!
  const awayWin = hasScore && as_! > hs!
  const homeLogo = proxyLogo(match.homeTeam.logo)
  const awayLogo = proxyLogo(match.awayTeam.logo)

  const [q1h, q1a] = parseQ(sc.q1); const [q2h, q2a] = parseQ(sc.q2)
  const [q3h, q3a] = parseQ(sc.q3); const [q4h, q4a] = parseQ(sc.q4)
  const [oth, ota] = parseQ(sc.overTime)
  const showQ = hasScore && (q1h || q2h || q3h || q4h)

  return (
    <div className="bk-row" style={{
      display: 'flex', alignItems: 'stretch', minHeight: 56,
      borderBottom: '1px solid var(--border)',
      background: isLive ? 'rgba(239,68,68,0.04)' : 'var(--bg-surface)',
      borderLeft: isLive ? '3px solid #ef4444' : '3px solid transparent',
      cursor: 'default',
    }}>
      {/* Statut */}
      <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>
        {isLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'bkPulse 1.4s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{label}</span>
          </div>
        ) : isFinished ? (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>{label}</span>
        ) : !label ? (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {new Date(match.date).toLocaleTimeString(lang==='fr'?'fr-FR':'en-GB', { hour:'2-digit', minute:'2-digit', timeZone:'Europe/Paris' })}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        )}
      </div>

      {/* Équipes */}
      <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        {[[match.homeTeam, homeWin, homeLogo], [match.awayTeam, awayWin, awayLogo]].map(([team, win, logo], i) => (
          <div key={i as number} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: i===0?'8px 10px 4px':'4px 10px 8px', borderBottom: i===0?'1px solid var(--border)':'none' }}>
            {logo as string
              ? <Image src={logo as string} alt="" width={18} height={18} style={{ objectFit: 'contain', flexShrink: 0 }} unoptimized />
              : <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-muted)', flexShrink: 0 }} />
            }
            <span style={{ fontSize: 13, fontWeight: win ? 700 : 400, color: win ? 'var(--text-primary)' : awayWin && i===0 ? 'var(--text-muted)' : homeWin && i===1 ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {(team as any).name}
            </span>
            {win && hasScore && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Q1-Q4 */}
      {showQ && <>
        <QCol label="Q1" home={q1h} away={q1a} />
        <QCol label="Q2" home={q2h} away={q2a} />
        <QCol label="Q3" home={q3h} away={q3a} />
        <QCol label="Q4" home={q4h} away={q4a} />
        {(oth||ota) && <QCol label="OT" home={oth} away={ota} highlight />}
      </>}

      {/* Score total */}
      {hasScore && (
        <div style={{ width: 42, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'rgba(59,130,246,0.06)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)', paddingTop: 2 }}>
            <span style={{ fontSize: 8, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.04em' }}>TOT</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: homeWin?700:500, color: homeWin?'var(--text-primary)':'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{hs}</span>
          </div>
          <div style={{ height: 21, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: awayWin?700:500, color: awayWin?'var(--text-primary)':'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{as_}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bloc ligue ───────────────────────────────────────────
function LeagueBlock({ group, lang }: { group: LeagueGroup; lang: string }) {
  const logo = proxyLogo(group.logo)
  const country = translateCountry(group.country, lang)
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
        {logo
          ? <div style={{ background: '#fff', borderRadius: 4, padding: 2, display: 'flex', flexShrink: 0 }}>
              <Image src={logo} alt="" width={18} height={18} style={{ objectFit: 'contain' }} unoptimized />
            </div>
          : <span style={{ fontSize: 16, flexShrink: 0 }}>🏀</span>
        }
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {group.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>{country}</span>
        <BasketStandingsModal leagueId={group.id} leagueName={group.name} />
      </div>
      {group.matches.map(m => <MatchRow key={m.id} match={m} lang={lang} />)}
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────
export default function BasketballHLClient() {
  const { lang } = useT()
  const searchParams = useSearchParams()
  const leagueFilter = searchParams.get('league')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [groups,  setGroups]  = useState<LeagueGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all'|'live'|'finished'|'upcoming'>('all')

  const load = useCallback(async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = formatDate(date)
      const res = await fetch(`/api/basketball-hl?date=${dateStr}`)
      const grouped: Record<string, any[]> = await res.json()
      const leagueGroups: LeagueGroup[] = Object.entries(grouped).map(([id, matches]) => {
        const first = matches[0]
        return { id, name: first.league?.name ?? 'Unknown', logo: first.league?.logo ?? null, country: first.country?.name ?? '', matches }
      })
      leagueGroups.sort((a, b) => {
        const pa = LEAGUE_PRIORITY[a.name] ?? 99
        const pb = LEAGUE_PRIORITY[b.name] ?? 99
        if (pa !== pb) return pa - pb
        return a.name.localeCompare(b.name)
      })
      setGroups(leagueGroups)
    } catch (e) { console.error(e); setGroups([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(selectedDate) }, [selectedDate, load])

  // Filtre onglets + ligue
  const displayGroups = useMemo(() => {
    let base = leagueFilter ? groups.filter(g => g.name === leagueFilter) : groups
    if (activeTab === 'all') return base
    return base.map(g => ({
      ...g,
      matches: g.matches.filter(m => {
        const d = m.state.description
        if (activeTab === 'live')     return LIVE_DESCS.has(d)
        if (activeTab === 'finished') return FINISHED_DESCS.has(d)
        if (activeTab === 'upcoming') return d === 'Not started'
        return true
      })
    })).filter(g => g.matches.length > 0)
  }, [groups, leagueFilter, activeTab])

  const totalMatches = displayGroups.reduce((a, g) => a + g.matches.length, 0)
  const hasLive = groups.some(g => g.matches.some(m => LIVE_DESCS.has(m.state.description)))

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 80px' }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes bkPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .bk-row:hover { background: var(--bg-muted) !important; }
        .bk-quarter { display: flex; flex-direction: column; }
        @media (max-width: 640px) { .bk-quarter { display: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, fontSize: 22, background: 'var(--bg-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏀</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Basketball</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {totalMatches} match{totalMatches > 1 ? 's' : ''} · NBA, LNB, ACB…
          </p>
        </div>
      </div>

      {/* DatePicker */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <DatePicker selected={selectedDate} onChange={(d) => { setSelectedDate(d); setActiveTab('all') }} lang={lang as 'fr'|'en'} />
      </div>

      {/* Onglets */}
      {!loading && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {[{key:'all',fr:'Tous',en:'All'},{key:'live',fr:'En Direct',en:'Live'},{key:'finished',fr:'Terminés',en:'Finished'},{key:'upcoming',fr:'À venir',en:'Upcoming'}].map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
                padding:'8px 12px',border:'none',cursor:'pointer',background:'transparent',
                fontSize:13,fontWeight:isActive?700:500,
                color:isActive?'#ef4444':'var(--text-muted)',
                borderBottom:`2px solid ${isActive?'#ef4444':'transparent'}`,
                marginBottom:-1,transition:'color .15s',
                display:'flex',alignItems:'center',gap:5,
              }}>
                {tab.key==='live'&&isActive&&<span style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',animation:'bkPulse 1.4s infinite'}}/>}
                {lang==='fr'?tab.fr:tab.en}
              </button>
            )
          })}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ height: 120, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', animation: 'shimmer 1.6s infinite' }} />)}
        </div>
      ) : totalMatches === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏀</p>
          <p style={{ fontSize: 14 }}>
            {activeTab==='live' ? (lang==='fr'?'Aucun match en direct en ce moment':'No live matches right now') :
             activeTab==='finished' ? (lang==='fr'?'Aucun match terminé pour cette date':'No finished matches') :
             activeTab==='upcoming' ? (lang==='fr'?'Aucun match à venir pour cette date':'No upcoming matches') :
             lang==='fr'?'Aucun match basketball ce jour':'No basketball matches today'}
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
