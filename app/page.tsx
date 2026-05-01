'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchSkeleton from './components/MatchSkeleton'
import { getMatchesByDate, HMatch, normalizeStatus } from '../lib/highlightly'
import { useT } from '@/lib/i18n'
import Link from 'next/link'
import Image from 'next/image'
import MatchFavoriteButton from './components/MatchFavoriteButton'
import DatePicker from './components/DatePicker'

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"]

const COUNTRY_FR: Record<string, string> = {
  "England": "Angleterre", "France": "France", "Spain": "Espagne",
  "Germany": "Allemagne", "Italy": "Italie", "Portugal": "Portugal",
  "Netherlands": "Pays-Bas", "Belgium": "Belgique", "Scotland": "Écosse",
  "Turkey": "Turquie", "Brazil": "Brésil", "Argentina": "Argentine",
  "Mexico": "Mexique", "USA": "États-Unis", "Japan": "Japon",
  "Switzerland": "Suisse", "Austria": "Autriche", "Poland": "Pologne",
  "Denmark": "Danemark", "Sweden": "Suède", "Norway": "Norvège",
  "Romania": "Roumanie", "Hungary": "Hongrie", "Ireland": "Irlande",
  "Saudi Arabia": "Arabie Saoudite", "Egypt": "Égypte",
  "Morocco": "Maroc", "Russia": "Russie", "Ukraine": "Ukraine",
  "Serbia": "Serbie", "Croatia": "Croatie", "Greece": "Grèce",
  "International": "International", "Europe": "Europe",
  "South America": "Amérique du Sud", "Northern Ireland": "Irlande du Nord",
  "Iceland": "Islande", "Rwanda": "Rwanda", "Gambia": "Gambie",
  "Qatar": "Qatar", "Iraq": "Irak", "Colombia": "Colombie",
  "Ecuador": "Équateur", "Bolivia": "Bolivie", "Paraguay": "Paraguay",
  "El Salvador": "El Salvador", "Georgia": "Géorgie", "Bulgaria": "Bulgarie",
  "Bosnia": "Bosnie", "China": "Chine", "South Korea": "Corée du Sud",
  "Australia": "Australie", "United Arab Emirates": "Émirats arabes unis",
}

function translateCountry(name: string, lang: string): string {
  if (lang === 'fr') return COUNTRY_FR[name] ?? name
  return name
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Badge statut ──────────────────────────────────────────
function StatusBadge({ match, lang }: { match: HMatch; lang: string }) {
  const status = normalizeStatus(match.state.description)
  const clock  = match.state.clock

  if (status === "NS") {
    const time = new Date(match.date).toLocaleTimeString(
      lang === 'fr' ? 'fr-FR' : 'en-GB',
      { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }
    )
    return <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{time}</span>
  }

  if (status === "Match Finished") {
    return <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>FT</span>
  }

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
        HT
      </span>
    )
  }

  const isExtra = status === "ET"
  const color   = isExtra ? "#f59e0b" : "#ef4444"
  const bg      = isExtra ? "#fffbeb" : "#fef2f2"
  const border  = isExtra ? "#fde68a" : "#fecaca"
  const txt     = isExtra ? "#92400e" : "#b91c1c"

  const liveLabel: Record<string, Record<string, string>> = {
    fr: { "1H": "1MT", "2H": "2MT", "ET": "Prol.", "P": "TAB" },
    en: { "1H": "1H",  "2H": "2H",  "ET": "ET",    "P": "PEN" },
  }
  const label = liveLabel[lang]?.[status] ?? status

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
      {clock !== null && <span style={{ color, marginLeft: "1px" }}>{clock}'</span>}
    </span>
  )
}

// ─── Ligne de match ────────────────────────────────────────
function MatchRow({ match, lang }: { match: HMatch; lang: string }) {
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
    <div className="match-row-link" style={{
      display: "flex", alignItems: "center",
      borderBottom: "1px solid var(--border)",
    }}>
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
          <StatusBadge match={match} lang={lang} />
        </div>

        {/* Équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {match.homeTeam.logo
              ? <Image src={match.homeTeam.logo} alt="" width={16} height={16}
                  style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%",
                  background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: homeWin ? 700 : 400,
              color: homeWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{match.homeTeam.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            {match.awayTeam.logo
              ? <Image src={match.awayTeam.logo} alt="" width={16} height={16}
                  style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%",
                  background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: "13px",
              fontWeight: awayWin ? 700 : 400,
              color: awayWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{match.awayTeam.name}</span>
          </div>
        </div>

        {/* Scores */}
        {hasScore && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
            <span style={{
              fontSize: "13px", fontWeight: homeWin ? 700 : 400,
              color: isLive ? "#22c55e" : homeWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{homeScore}</span>
            <span style={{
              fontSize: "13px", fontWeight: awayWin ? 700 : 400,
              color: isLive ? "#22c55e" : awayWin ? "var(--text-primary)" : "var(--text-secondary)",
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
function LeagueSection({ leagueName, matches, lang }: {
  leagueName: string; matches: HMatch[]; lang: string
}) {
  const logo        = matches[0]?.league?.logo
  const displayName = matches[0]?.league?.name ?? leagueName
  const countryName = translateCountry(matches[0]?.country?.name ?? "", lang)

  return (
    <>
      <style>{`
        :root     { --league-header-bg: #f1f5f9; --league-card-bg: #ffffff; }
        html.dark { --league-header-bg: #1e2235; --league-card-bg: #1a1d27; }
        .league-logo-wrap {
          width: 26px; height: 26px; border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        :root     .league-logo-wrap { background: #ffffff; }
        html.dark .league-logo-wrap { background: #ffffff; }
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
          {countryName && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {countryName}
            </span>
          )}
        </div>

        {/* Matchs */}
        <div>
          {matches.map((m) => <MatchRow key={m.id} match={m} lang={lang} />)}
        </div>
      </div>
    </>
  )
}

// ─── Page principale ───────────────────────────────────────
export default function HomePage() {
  const { t, lang } = useT()

  const [selectedDate, setSelectedDate]           = useState<Date>(new Date())
  const [matchesByLeague, setMatchesByLeague]     = useState<Record<string, HMatch[]>>({})
  const [loading, setLoading]                     = useState(true)
  const [lastRefresh, setLastRefresh]             = useState<Date | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) { setLoading(true); setMatchesByLeague({}) }
    const dateStr = formatDate(selectedDate)
    const grouped = await getMatchesByDate(dateStr)
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

  const leagues    = Object.keys(matchesByLeague)
  const allMatches = Object.values(matchesByLeague).flat()
  const hasLive    = allMatches.some(m =>
    LIVE_STATUSES.includes(normalizeStatus(m.state.description))
  )
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-GB'

  return (
    <main style={{
      maxWidth: 720, margin: "0 auto",
      padding: "24px 16px 80px",
    }}>
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
      ) : leagues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 14 }}>{t("no_matches")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leagues.map((league) => (
            <LeagueSection
              key={league}
              leagueName={league}
              matches={matchesByLeague[league]}
              lang={lang}
            />
          ))}
        </div>
      )}
    </main>
  )
}