"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { translateCountry } from "@/lib/labels";
import { useT } from "@/lib/i18n";

function proxyLogo(url?: string | null): string | null {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function fmt(date: Date, lang: string) {
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "2-digit", month: "short" })
}

interface BEvent {
  idEvent: string; strHomeTeam: string; strAwayTeam: string
  strHomeTeamBadge: string; strAwayTeamBadge: string
  intHomeScore: string | null; intAwayScore: string | null
  strStatus: string; strTime: string; dateEvent: string
  strResult: string | null
}

const LIVE_STATUSES = new Set(["Q1","Q2","Q3","Q4","OT","HT","In Progress","LIVE"])

function parseQuarters(strResult: string | null, teamName: string): string[] {
  if (!strResult) return []
  const lines = strResult.split("\n").filter(l => l.trim().length > 0)
  for (const line of lines) {
    if (line.toLowerCase().includes(teamName.toLowerCase().split(" ")[0].toLowerCase())) {
      const parts = line.split("<br>")
      const qStr  = parts[1] ? parts[1].trim() : ""
      return qStr ? qStr.split(/\s+/).filter(s => s.length > 0) : []
    }
  }
  return []
}

function MatchRow({ ev, lang }: { ev: BEvent; lang: string }) {
  const hasScore = ev.intHomeScore !== null && ev.intAwayScore !== null
  const hs = hasScore ? parseInt(ev.intHomeScore!) : null
  const as_ = hasScore ? parseInt(ev.intAwayScore!) : null
  const homeWin = hasScore && hs! > as_!
  const awayWin = hasScore && as_! > hs!
  const isLive = LIVE_STATUSES.has(ev.strStatus)
  const isFinished = ev.strStatus === "FT" || ev.strStatus === "AOT"

  const homeQ = parseQuarters(ev.strResult, ev.strHomeTeam)
  const awayQ = parseQuarters(ev.strResult, ev.strAwayTeam)
  const nQ    = Math.max(homeQ.length, awayQ.length)

  return (
    <Link href={`/match/${ev.idEvent}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "flex", alignItems: "stretch", minHeight: 52,
        borderBottom: "1px solid var(--border)",
        background: isLive ? "rgba(239,68,68,0.04)" : "var(--bg-surface)",
        cursor: "pointer",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-muted)")}
        onMouseLeave={e => (e.currentTarget.style.background = isLive ? "rgba(239,68,68,0.04)" : "var(--bg-surface)")}>
        {/* Statut */}
        <div style={{ width: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}>
          {isLive ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: "bkPulse 1.4s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444" }}>{ev.strStatus}</span>
            </div>
          ) : isFinished ? (
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{lang === "fr" ? "Terminé" : "FT"}</span>
          ) : (
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
              {ev.strTime ? ev.strTime.slice(0, 5) : "—"}
            </span>
          )}
        </div>
        {/* Équipes */}
        <div style={{ flex: 1, borderLeft: "1px solid var(--border)", borderRight: nQ > 0 && hasScore ? "1px solid var(--border)" : "none" }}>
          {[ev.strHomeTeam, ev.strAwayTeam].map((name, i) => {
            const win = i === 0 ? homeWin : awayWin
            const badge = i === 0 ? ev.strHomeTeamBadge : ev.strAwayTeamBadge
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: i === 0 ? "8px 10px 4px" : "4px 10px 8px",
                borderBottom: i === 0 ? "1px solid var(--border)" : "none",
              }}>
                {badge ? <img src={badge} style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} alt="" />
                        : <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: win ? 700 : 400, color: win ? "var(--text-primary)" : "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name}
                </span>
                {win && hasScore && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
        {/* Quarts */}
        {hasScore && nQ > 0 && Array.from({ length: nQ }).map((_, i) => {
          const hQ = homeQ[i] ?? ""; const aQ = awayQ[i] ?? ""
          const label = i < 4 ? `Q${i+1}` : "OT"
          return (
            <div key={i} style={{ width: 32, flexShrink: 0, borderLeft: "1px solid var(--border)", background: i === nQ-1 ? "rgba(59,130,246,0.05)" : "transparent", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 700 }}>{label}</span>
              </div>
              <div style={{ height: 19, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{hQ}</span>
              </div>
              <div style={{ height: 19, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{aQ}</span>
              </div>
            </div>
          )
        })}
        {/* Score total */}
        {hasScore && (
          <div style={{ width: 42, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "rgba(59,130,246,0.06)", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 8, color: "var(--accent)", fontWeight: 700 }}>TOT</span>
            </div>
            <div style={{ height: 19, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, fontWeight: homeWin ? 700 : 500, color: homeWin ? "var(--text-primary)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{hs}</span>
            </div>
            <div style={{ height: 19, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: awayWin ? 700 : 500, color: awayWin ? "var(--text-primary)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{as_}</span>
            </div>
          </div>
        )}
        <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 14 }}>›</div>
      </div>
    </Link>
  )
}

export default function BasketLeagueClient({ leagueName }: { leagueName: string }) {
  const { t, lang } = useT()
  const [past,       setPast]       = useState<BEvent[]>([])
  const [upcoming,   setUpcoming]   = useState<BEvent[]>([])
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; logo: string | null; country: string } | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<"upcoming" | "results">("upcoming")

  useEffect(() => {
    fetch(`/api/basketball-league?leagueName=${encodeURIComponent(leagueName)}`)
      .then(r => r.json())
      .then(data => {
        setLeagueInfo(data.leagueInfo ?? null)
        setPast(data.past ?? [])
        setUpcoming(data.upcoming ?? [])
        setTab((data.upcoming ?? []).length > 0 ? "upcoming" : "results")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [leagueName])

  // Grouper par date
  function groupByDate(events: BEvent[]) {
    const map: Record<string, BEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.dateEvent]) map[ev.dateEvent] = []
      map[ev.dateEvent].push(ev)
    }
    return map
  }
  const pastGrouped     = groupByDate(past.slice(0, 50))
  const upcomingGrouped = groupByDate(upcoming.slice(0, 50))
  const displayed = Object.entries(tab === "upcoming" ? upcomingGrouped : pastGrouped)
    .sort((a, b) => tab === "results" ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0]))
    .slice(0, 10)

  const logoSrc = leagueInfo?.logo ? proxyLogo(leagueInfo.logo) : null

  return (
    <div className="ligue-content" style={{ flex: 1, padding: "28px 36px", maxWidth: 860 }}>
      <style>{`
        @keyframes bkPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {logoSrc ? <img src={logoSrc} width={40} height={40} style={{ objectFit: "contain" }} alt="" />
                   : <span style={{ fontSize: 22 }}>🏀</span>}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{leagueInfo?.name ?? leagueName}</h1>
          {leagueInfo?.country && (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
              {translateCountry(leagueInfo.country, lang)} · 2025-2026
            </p>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
        {([["upcoming", lang === "fr" ? "Prochains matchs" : "Upcoming"], ["results", lang === "fr" ? "Résultats" : "Results"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 20px", fontSize: 13, fontWeight: tab === key ? 700 : 500,
            color: tab === key ? "var(--accent)" : "var(--text-muted)",
            borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: -2,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Matchs */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>{t("loading")}…</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          {lang === "fr" ? "Aucun match disponible" : "No matches available"}
        </div>
      ) : (
        displayed.map(([date, evs]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", padding: "8px 0", borderBottom: "2px solid var(--border)" }}>
              {fmt(new Date(date + "T12:00:00"), lang)}
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
              {evs.map(ev => <MatchRow key={ev.idEvent} ev={ev} lang={lang} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
