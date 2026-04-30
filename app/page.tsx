'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchSkeleton from './components/MatchSkeleton'
import { getMatchesByDate, HMatch, normalizeStatus } from '../lib/highlightly'
import { useT } from '@/lib/i18n'
import Link from 'next/link'
import Image from 'next/image'
import MatchFavoriteButton from './components/MatchFavoriteButton'

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"]

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDateWithOffset(offset: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

// ─── Badge statut ──────────────────────────────────────────
function StatusBadge({ match }: { match: HMatch }) {
  const status = normalizeStatus(match.state.description)
  const clock  = match.state.clock

  if (status === "NS") {
    const time = new Date(match.date).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
    })
    return <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{time}</span>
  }

  if (status === "Match Finished") {
    return <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>FT</span>
  }

  if (status === "HT") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "3px 8px", borderRadius: "999px",
        background: "#fffbeb", border: "1px solid #fde68a",
        fontSize: "11px", fontWeight: 700, color: "#92400e",
      }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
        HT
      </span>
    )
  }

  const isExtra = status === "ET"
  const color   = isExtra ? "#f59e0b" : "#ef4444"
  const bg      = isExtra ? "#fffbeb" : "#fef2f2"
  const border  = isExtra ? "#fde68a" : "#fecaca"
  const txt     = isExtra ? "#92400e" : "#b91c1c"

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
      <span style={{ color: txt }}>
        {status === "P" ? "TAB" : status === "1H" ? "1MT" : status === "2H" ? "2MT" : "Prol."}
      </span>
      {clock !== null && (
        <span style={{ color, marginLeft: "1px" }}>{clock}'</span>
      )}
    </span>
  )
}

// ─── Ligne de match ────────────────────────────────────────
function MatchRow({ match }: { match: HMatch }) {
  const status   = normalizeStatus(match.state.description)
  const isLive   = LIVE_STATUSES.includes(status)
  const score    = match.state.score.current
  const hasScore = score !== null && status !== "NS"

  const [homeScore, awayScore] = hasScore
    ? score.split(" - ").map(Number)
    : [null, null]

  const homeWin = hasScore && homeScore! > awayScore!
  const awayWin = hasScore && awayScore! > homeScore!

  return (
    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f8fafc" }}>
      <Link
        href={`/match/${match.id}`}
        style={{
          flex: 1, display: "grid",
          gridTemplateColumns: "72px 1fr auto",
          alignItems: "center", padding: "10px 12px",
          gap: "12px", textDecoration: "none", color: "inherit",
        }}
      >
        {/* Statut */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <StatusBadge match={match} />
        </div>

        {/* Équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {match.homeTeam.logo
              ? <Image src={match.homeTeam.logo} alt="" width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#e2e8f0", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: homeWin ? 700 : 400,
              color: homeWin ? "#0f172a" : "#475569",
            }}>{match.homeTeam.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {match.awayTeam.logo
              ? <Image src={match.awayTeam.logo} alt="" width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#e2e8f0", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: awayWin ? 700 : 400,
              color: awayWin ? "#0f172a" : "#475569",
            }}>{match.awayTeam.name}</span>
          </div>
        </div>

        {/* Score */}
        {hasScore && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
            <span style={{ fontSize: "13px", fontWeight: homeWin ? 700 : 400, color: isLive ? "#16a34a" : homeWin ? "#0f172a" : "#475569" }}>
              {homeScore}
            </span>
            <span style={{ fontSize: "13px", fontWeight: awayWin ? 700 : 400, color: isLive ? "#16a34a" : awayWin ? "#0f172a" : "#475569" }}>
              {awayScore}
            </span>
          </div>
        )}
      </Link>

      {/* Bouton favori match */}
      <div style={{ paddingRight: "10px", flexShrink: 0 }}>
        <MatchFavoriteButton
          match={{
            id: String(match.id),
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeLogo: match.homeTeam.logo ?? undefined,
            awayLogo: match.awayTeam.logo ?? undefined,
            league: match.league.name,
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

// ─── Section ligue ─────────────────────────────────────────
function LeagueSection({ leagueName, matches }: { leagueName: string; matches: HMatch[] }) {
  const logo = matches[0]?.league?.logo

  return (
    <div style={{
      background: "#fff", borderRadius: "12px",
      border: "1px solid #f1f5f9", overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      {/* Header ligue */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 14px", borderBottom: "1px solid #f1f5f9",
        background: "#fafafa",
      }}>
        {logo
          ? <Image src={logo} alt="" width={22} height={22} style={{ objectFit: "contain" }} unoptimized />
          : <div style={{ width: 22, height: 22, borderRadius: "4px", background: "#e2e8f0" }} />
        }
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a", letterSpacing: "0.02em" }}>
          {leagueName}
        </span>
        <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "auto" }}>
          {matches[0]?.country?.name}
        </span>
      </div>

      {/* Matchs */}
      <div>
        {matches.map((m) => <MatchRow key={m.id} match={m} />)}
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────
export default function HomePage() {
  const { t } = useT()
  const [offset, setOffset]               = useState(0)
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, HMatch[]>>({})
  const [loading, setLoading]             = useState(true)
  const [lastRefresh, setLastRefresh]     = useState<Date | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) { setLoading(true); setMatchesByLeague({}) }
    const dateStr = formatDate(getDateWithOffset(offset))
    const grouped = await getMatchesByDate(dateStr)
    setMatchesByLeague(grouped)
    setLastRefresh(new Date())
    if (showLoading) setLoading(false)
  }, [offset])

  useEffect(() => { load(true) }, [load])

  // Refresh auto 30s si matchs live
  useEffect(() => {
    const allMatches = Object.values(matchesByLeague).flat()
    const hasLive = allMatches.some(m =>
      LIVE_STATUSES.includes(normalizeStatus(m.state.description))
    )
    if (!hasLive || offset !== 0) return
    const interval = setInterval(() => load(false), 30000)
    return () => clearInterval(interval)
  }, [matchesByLeague, offset, load])

  const leagues    = Object.keys(matchesByLeague)
  const allMatches = Object.values(matchesByLeague).flat()
  const hasLive    = allMatches.some(m =>
    LIVE_STATUSES.includes(normalizeStatus(m.state.description))
  )

  const DATE_LABELS = [t("yesterday"), t("today"), t("tomorrow")]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">

      {/* Navigation dates */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-sm p-3">
        {[-1, 0, 1].map((o, i) => {
          const d = getDateWithOffset(o)
          const isActive = o === offset
          return (
            <button key={o} onClick={() => setOffset(o)}
              className={`flex-1 mx-1 py-2 px-3 rounded-lg text-center transition-all ${
                isActive ? 'bg-blue-600 text-white font-semibold shadow' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className="text-xs font-medium">{DATE_LABELS[i]}</div>
              <div className="text-xs opacity-75 capitalize">
                {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </button>
          )
        })}
      </div>

      {/* Bandeau LIVE */}
      {hasLive && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '8px 14px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444',
              animation: 'livePulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
              {t("live_matches")}
            </span>
          </div>
          {lastRefresh && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {t("updated_at")} {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* Contenu */}
      {loading ? (
        <MatchSkeleton />
      ) : leagues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">📅</div>
          <p>{t("no_matches")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leagues.map((league) => (
            <LeagueSection key={league} leagueName={league} matches={matchesByLeague[league]} />
          ))}
        </div>
      )}
    </main>
  )
}