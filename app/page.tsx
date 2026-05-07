'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import MatchSkeleton from './components/MatchSkeleton'
import { getMatchesByDate, HMatch, normalizeStatus } from '../lib/highlightly'
import { translateStatus, translateCountry as _translateCountry } from '../lib/labels'
import { useT } from '@/lib/i18n'
import Link from 'next/link'
import Image from 'next/image'
import MatchFavoriteButton from './components/MatchFavoriteButton'
import DatePicker from './components/DatePicker'
import StandingsPanel from './components/StandingsPanel'

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"]

// ─── Indicateur visuel de but ────────────────────────────
interface GoalFlash { team: 'home' | 'away'; phase: 'pending' | 'confirmed' | 'cancelled' }

function GoalIndicator({ phase }: { phase: GoalFlash['phase'] }) {
  if (phase === 'pending') return (
    <span style={{ color: '#ef4444', fontSize: 8, animation: 'livePulse 0.7s ease-in-out infinite', flexShrink: 0 }}>⬤</span>
  )
  if (phase === 'confirmed') return (
    <span style={{ fontSize: 9, fontWeight: 800, color: '#16a34a', background: '#dcfce7', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>BUT !</span>
  )
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: '#fee2e2', borderRadius: 4, padding: '1px 4px', flexShrink: 0, whiteSpace: 'nowrap' }}>ANNULÉ</span>
  )
}

// ─── Ordre sidebar (Internationale → Favorites → Autres) ───
const INTERNATIONAL_IDS = ["2486","3337","722432","1635","4188","5890","8443"]
const FAVORITE_IDS      = ["33973","67162","119924","52695","115669","75672","80778","173537"]
const ALL_FIXED_IDS     = new Set([...INTERNATIONAL_IDS, ...FAVORITE_IDS])



function translateCountry(name: string, lang: string): string {
  return _translateCountry(name, lang)
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

// ─── Tri des ligues dans l'ordre sidebar ───────────────────
// Ordre final : Internationale (ordre sidebar) → Favorites (ordre sidebar) → Autres (pays A→Z, ligue A→Z)
function sortLeagues(grouped: Record<string, HMatch[]>): string[] {
  const international: string[] = []   // tableau sparse positionné par index sidebar
  const favorites: string[]     = []   // tableau sparse positionné par index sidebar
  const others: string[]        = []

  for (const key of Object.keys(grouped)) {
    // La clé est l'ID de ligue en string (ex: "17423")
    const intIdx = INTERNATIONAL_IDS.indexOf(key)
    const favIdx = FAVORITE_IDS.indexOf(key)
    if (intIdx !== -1)      international[intIdx] = key
    else if (favIdx !== -1) favorites[favIdx]     = key
    else                    others.push(key)
  }

  others.sort((a, b) => {
    const cA = grouped[a]?.[0]?.country?.name ?? ""
    const cB = grouped[b]?.[0]?.country?.name ?? ""
    const cmp = cA.localeCompare(cB)
    if (cmp !== 0) return cmp
    return (grouped[a]?.[0]?.league?.name ?? "").localeCompare(grouped[b]?.[0]?.league?.name ?? "")
  })

  return [...international.filter(Boolean), ...favorites.filter(Boolean), ...others]
}

// ─── Petit bouton classement inline ───────────────────────
function StandingsBtnInline({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  if (!leagueId) return null
  return <StandingsPanel leagueId={leagueId} leagueName={leagueName} />
}

// Statuts qui terminent définitivement un match (pas de dot live)
const FINISHED_STATUSES = new Set(["Match Finished", "FT-ET", "FT-P"])
// Statuts non joués (reporté, annulé…)
const INACTIVE_STATUSES = new Set(["Postponed", "Cancelled", "Suspended", "Abandoned", "Interrupted", "Awarded", "Not covered"])

// ─── Badge statut ─────────────────────────────────────────
function StatusBadge({ match, lang }: { match: HMatch; lang: string }) {
  const status = normalizeStatus(match.state.description)
  const clock  = match.state.clock

  // Match non commencé → heure
  if (status === "NS") {
    const time = new Date(match.date).toLocaleTimeString(
      lang === 'fr' ? 'fr-FR' : 'en-GB',
      { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }
    )
    return <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{time}</span>
  }

  // Match terminé (FT / Ap. prol. / Ap. pén.)
  if (FINISHED_STATUSES.has(status)) {
    return <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
      {translateStatus(status, lang)}
    </span>
  }

  // Match inactif (Reporté, Annulé…) → badge gris, sans dot
  if (INACTIVE_STATUSES.has(status)) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "3px 8px", borderRadius: "999px",
        background: "#f1f5f9", border: "1px solid #e2e8f0",
        fontSize: "11px", fontWeight: 600, color: "#64748b",
      }}>
        {translateStatus(status, lang)}
      </span>
    )
  }

  // Mi-temps
  if (status === "HT") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "3px 8px", borderRadius: "999px",
        background: "#fffbeb", border: "1px solid #fde68a",
        fontSize: "11px", fontWeight: 700, color: "#92400e",
      }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%",
          background: "#f59e0b", display: "inline-block" }} />
        {translateStatus("HT", lang)}
      </span>
    )
  }

  // Match en cours (live)
  const isExtra = status === "ET"
  const color   = isExtra ? "#f59e0b" : "#ef4444"
  const bg      = isExtra ? "#fffbeb" : "#fef2f2"
  const border  = isExtra ? "#fde68a" : "#fecaca"
  const txt     = isExtra ? "#92400e" : "#b91c1c"
  const label   = translateStatus(status, lang)

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 8px", borderRadius: "999px",
      background: bg, border: `1px solid ${border}`,
      fontSize: "11px", fontWeight: 700,
    }}>
      <span style={{
        width: "5px", height: "5px", borderRadius: "50%",
        background: color, display: "inline-block",
        animation: "livePulse 1.2s ease-in-out infinite",
      }} />
      <span style={{ color: txt }}>{label}</span>
      {clock !== null && (
        <span style={{ color, marginLeft: "1px" }}>
          {clock === 90 && status === "2H" ? "90+" :
           clock === 45 && status === "1H" ? "45+" : clock}'
        </span>
      )}
    </span>
  )
}

// ─── Ligne de match ───────────────────────────────────────
function MatchRow({ match, lang, goalFlash }: { match: HMatch; lang: string; goalFlash?: GoalFlash }) {
  const status   = normalizeStatus(match.state.description)
  const isLive   = LIVE_STATUSES.includes(status)
  const score    = match.state.score.current
  const hasScore = score !== null && status !== "NS"

  let [homeScore, awayScore] = hasScore
    ? (score!.split(" - ").map(Number) as [number, number])
    : [null, null] as [null, null]

  // Pénaltys : le vainqueur reçoit +1 dans l'affichage
  if (status === "FT-P" && match.state.score.penalties && homeScore !== null) {
    const [hp, ap] = match.state.score.penalties.split(" - ").map(Number)
    if (hp > ap) homeScore = homeScore + 1
    else if (ap > hp) awayScore = (awayScore ?? 0) + 1
  }

  const homeWin = homeScore !== null && awayScore !== null && homeScore > awayScore
  const awayWin = homeScore !== null && awayScore !== null && awayScore > homeScore

  const homeLogo = proxyLogo(match.homeTeam.logo)
  const awayLogo = proxyLogo(match.awayTeam.logo)

  // ✅ Score live en rouge (#ef4444), pas en vert
  const liveColor = "#ef4444"

  return (
    <div className="match-row-link" style={{
      display: "flex", alignItems: "center",
      borderBottom: "1px solid var(--border)",
    }}>
      <Link
        href={`/match/${match.id}`}
        style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "60px 1fr auto",
minWidth: 0,
overflow: "hidden",
          alignItems: "center", padding: "10px 12px",
          gap: "12px", textDecoration: "none", color: "inherit",
        }}
      >
        {/* Statut */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <StatusBadge match={match} lang={lang} />
        </div>

        {/* Équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {homeLogo
              ? <Image src={homeLogo} alt="" width={16} height={16}
                  style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%",
                  background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: homeWin ? 700 : 400,
              color: homeWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{match.homeTeam.name}</span>
            {goalFlash?.team === 'home' && <GoalIndicator phase={goalFlash.phase} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {awayLogo
              ? <Image src={awayLogo} alt="" width={16} height={16}
                  style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%",
                  background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: awayWin ? 700 : 400,
              color: awayWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{match.awayTeam.name}</span>
            {goalFlash?.team === 'away' && <GoalIndicator phase={goalFlash.phase} />}
          </div>
        </div>

        {/* Scores — ✅ rouge si live, sinon couleur normale */}
        {hasScore && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
            <span style={{
              fontSize: "13px", fontWeight: homeWin ? 700 : 400,
              color: isLive ? liveColor : homeWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{homeScore}</span>
            <span style={{
              fontSize: "13px", fontWeight: awayWin ? 700 : 400,
              color: isLive ? liveColor : awayWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{awayScore}</span>
          </div>
        )}
      </Link>

      <div style={{ paddingRight: "10px", flexShrink: 0 }}>
        <MatchFavoriteButton
          match={{
            id: String(match.id),
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeLogo: homeLogo ?? undefined,
            awayLogo: awayLogo ?? undefined,
            league: match.league.name,
            leagueId: String(match.league.id),
            leagueLogo: match.league.logo ?? undefined,
            date: match.date.split("T")[0],
            time: new Date(match.date).toLocaleTimeString("fr-FR", {
              hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
            }),
          }}
          size={15}
        />
      </div>
    </div>
  )
}

// ─── Section ligue ────────────────────────────────────────
function LeagueSection({ leagueName, matches, lang, goalFlashes }: {
  leagueName: string; matches: HMatch[]; lang: string; goalFlashes: Record<string, GoalFlash>
}) {
  const logo        = proxyLogo(matches[0]?.league?.logo)
  const displayName = matches[0]?.league?.name ?? leagueName
  const countryName = translateCountry(matches[0]?.country?.name ?? "", lang)
  const leagueId    = String(matches[0]?.league?.id ?? "")

  // ✅ Matchs triés par heure croissante
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <>
      <style>{`
        :root {
          --league-header-bg: #f1f5f9;
          --league-card-bg:   #ffffff;
          --league-country:   var(--text-muted);
        }
        html.dark {
          --league-header-bg: #1e2235;
          --league-card-bg:   #1a1d27;
          /* ✅ Pays en blanc en mode sombre */
          --league-country:   #ffffff;
        }
        .league-logo-wrap {
          width: 26px; height: 26px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
          /* ✅ Fond blanc pour que les logos sombres soient visibles */
          background: #ffffff;
        }
        .standings-btn-sm {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--bg-surface);
          cursor: pointer; font-size: 11px; font-weight: 600;
          color: var(--text-secondary);
          transition: border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .standings-btn-sm:hover { border-color: var(--accent); color: var(--accent); }
      `}</style>

      <div style={{
        background: "var(--league-card-bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        {/* Header ligue */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--league-header-bg)",
        }}>
          {/* ✅ Logo sur fond blanc toujours (visible en dark et light) */}
          <div className="league-logo-wrap">
            {logo
              ? <Image src={logo} alt="" width={20} height={20}
                  style={{ objectFit: "contain", padding: "2px" }} unoptimized />
              : <div style={{ width: 20, height: 20, borderRadius: "3px",
                  background: "var(--border)" }} />
            }
          </div>

          <span style={{
            fontSize: "12px", fontWeight: 700,
            color: "var(--text-primary)", letterSpacing: "0.02em", flex: 1,
          }}>
            {displayName}
          </span>

          {/* ✅ Pays en blanc en dark mode via CSS variable */}
          {countryName && (
            <span style={{ fontSize: "11px", color: "var(--league-country)" }}>
              {countryName}
            </span>
          )}

          {/* ✅ Bouton classement compact — uniquement ligues avec mapping TheSportsDB */}
          <StandingsBtnInline leagueId={leagueId} leagueName={displayName} />
        </div>

        {/* Matchs */}
        <div>
          {sortedMatches.map((m, idx) => <MatchRow key={`${m.id}-${idx}`} match={m} lang={lang} goalFlash={goalFlashes[String(m.id)]} />)}
        </div>
      </div>
    </>
  )
}

// ─── Page principale ──────────────────────────────────────
export default function HomePage() {
  const { t, lang } = useT()

  const [selectedDate, setSelectedDate]       = useState<Date>(new Date())
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, HMatch[]>>({})
  const [loading, setLoading]                 = useState(true)
  const [lastRefresh, setLastRefresh]         = useState<Date | null>(null)
  const [goalFlashes, setGoalFlashes]         = useState<Record<string, GoalFlash>>({})
  const prevScoresRef                         = useRef<Record<string, string | null>>({})

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) { setLoading(true); setMatchesByLeague({}); setGoalFlashes({}) }
    const dateStr = formatDate(selectedDate)
    const grouped = await getMatchesByDate(dateStr)

    // ── Détection de changement de score (auto-refresh uniquement) ──
    const allMatches = Object.values(grouped).flat()
    for (const match of allMatches) {
      const id       = String(match.id)
      const newScore = match.state.score.current
      const prevScore = prevScoresRef.current[id]
      const status   = normalizeStatus(match.state.description)

      if (!showLoading && prevScore !== undefined && LIVE_STATUSES.includes(status)
          && prevScore !== null && newScore !== null && prevScore !== newScore) {
        const [ph, pa] = prevScore.split(' - ').map(Number)
        const [nh, na] = newScore.split(' - ').map(Number)
        let team: 'home' | 'away' | null = null
        let cancelled = false
        if      (nh > ph) team = 'home'
        else if (na > pa) team = 'away'
        else if (nh < ph) { team = 'home'; cancelled = true }
        else if (na < pa) { team = 'away'; cancelled = true }

        if (team) {
          const t = team
          setGoalFlashes(prev => ({ ...prev, [id]: { team: t, phase: cancelled ? 'cancelled' : 'pending' } }))
          if (!cancelled) {
            // 4s → confirmed, puis effacement après 8s
            setTimeout(() => {
              setGoalFlashes(prev => prev[id] ? { ...prev, [id]: { ...prev[id], phase: 'confirmed' } } : prev)
              setTimeout(() => setGoalFlashes(prev => { const n = { ...prev }; delete n[id]; return n }), 8000)
            }, 4000)
          } else {
            setTimeout(() => setGoalFlashes(prev => { const n = { ...prev }; delete n[id]; return n }), 6000)
          }
        }
      }
      prevScoresRef.current[id] = newScore
    }

    setMatchesByLeague(grouped)
    setLastRefresh(new Date())
    if (showLoading) setLoading(false)
  }, [selectedDate])

  useEffect(() => { load(true) }, [load])

  useEffect(() => {
    const todayStr   = formatDate(new Date())
    const isToday    = formatDate(selectedDate) === todayStr
    const allMatches = Object.values(matchesByLeague).flat()
    const hasLive    = allMatches.some(m =>
      LIVE_STATUSES.includes(normalizeStatus(m.state.description))
    )
    if (!hasLive || !isToday) return
    const interval = setInterval(() => load(false), 30000)
    return () => clearInterval(interval)
  }, [matchesByLeague, selectedDate, load])

  const sortedLeagues = sortLeagues(matchesByLeague)
  const allMatches    = Object.values(matchesByLeague).flat()
  const hasLive       = allMatches.some(m =>
    LIVE_STATUSES.includes(normalizeStatus(m.state.description))
  )
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-GB'

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
        .match-row-link:hover { background: var(--bg-muted); }
      `}</style>

      {/* DatePicker */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          lang={lang as "fr" | "en"}
        />
      </div>

      {/* Bandeau LIVE */}
      {hasLive && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px', padding: '8px 14px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444',
              animation: 'livePulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
              {t("live_matches")}
            </span>
          </div>
          {lastRefresh && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {t("updated_at")} {lastRefresh.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <MatchSkeleton />
      ) : sortedLeagues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 14 }}>{t("no_matches")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sortedLeagues.map((league) => (
            <LeagueSection
              key={league}
              leagueName={league}
              matches={matchesByLeague[league]}
              lang={lang}
              goalFlashes={goalFlashes}
            />
          ))}
        </div>
      )}
    </main>
  )
}
