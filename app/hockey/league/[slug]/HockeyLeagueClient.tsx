"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { normalizeStatus } from "@/lib/highlightly";
import { translateCountry } from "@/lib/labels";
import { useT } from "@/lib/i18n";

const LIVE_DESCS = new Set(["First period","Second period","Third period","Over time","Penalties","In Progress","Live"])
const LIVE_STATUSES_STR = ["First period","Second period","Third period","Over time","Penalties"]

function proxyLogo(url?: string | null): string | null {
  if (!url) return null
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function getStatusLabel(desc: string, lang: string): { label: string; isLive: boolean; isFinished: boolean } {
  if (desc === "Not started")             return { label: "", isLive: false, isFinished: false }
  if (desc === "Finished")               return { label: "FT", isLive: false, isFinished: true }
  if (desc === "Finished after over time") return { label: lang === "fr" ? "Ap. prol." : "FT-OT", isLive: false, isFinished: true }
  if (desc === "Finished after penalties") return { label: lang === "fr" ? "Ap. TAB" : "FT-SO", isLive: false, isFinished: true }
  if (desc === "First period")           return { label: "P1", isLive: true, isFinished: false }
  if (desc === "Second period")          return { label: "P2", isLive: true, isFinished: false }
  if (desc === "Third period")           return { label: "P3", isLive: true, isFinished: false }
  if (desc === "Over time")              return { label: "OT", isLive: true, isFinished: false }
  if (desc === "Penalties")             return { label: "TAB", isLive: true, isFinished: false }
  if (LIVE_DESCS.has(desc))             return { label: lang === "fr" ? "EN DIRECT" : "LIVE", isLive: true, isFinished: false }
  if (desc === "Postponed")             return { label: lang === "fr" ? "Reporté" : "Postponed", isLive: false, isFinished: false }
  return { label: desc, isLive: false, isFinished: false }
}

function fmt(date: Date, lang: string) {
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "2-digit", month: "short" })
}

interface HMatch { id: number; date: string; state: any; homeTeam: any; awayTeam: any; league: any; country: any }

function MatchRow({ match, lang }: { match: HMatch; lang: string }) {
  const sc = match.state.score
  const { label, isLive, isFinished } = getStatusLabel(match.state.description, lang)
  const hasScore  = sc.current != null && isFinished
  const [hs, as_] = hasScore ? sc.current!.split(" - ").map(Number) : [null, null]
  const homeWin   = hasScore && hs! > as_!
  const awayWin   = hasScore && as_! > hs!

  function parsePeriod(val: string | null): [string, string] {
    if (!val) return ["", ""]
    const [h, a] = val.split(" - ")
    return [h ?? "", a ?? ""]
  }
  const [p1h, p1a] = parsePeriod(sc.firstPeriod)
  const [p2h, p2a] = parsePeriod(sc.secondPeriod)
  const [p3h, p3a] = parsePeriod(sc.thirdPeriod)
  const showPeriods = hasScore && (p1h || p2h || p3h)

  return (
    <Link href={`/match/${match.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: showPeriods ? "56px 1fr 28px 28px 28px 44px" : "56px 1fr auto",
        alignItems: "center", padding: "8px 16px", gap: 10,
        borderBottom: "1px solid var(--border)",
        background: isLive ? "rgba(239,68,68,0.04)" : "var(--bg-surface)",
        cursor: "pointer",
      }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-muted)")}
        onMouseLeave={e => (e.currentTarget.style.background = isLive ? "rgba(239,68,68,0.04)" : "var(--bg-surface)")}>
        {/* Statut */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {isLive ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444" }}>{label}</span>
            </div>
          ) : !label ? (
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
              {new Date(match.date).toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
          )}
        </div>
        {/* Équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          {[match.homeTeam, match.awayTeam].map((team, i) => {
            const win = i === 0 ? homeWin : awayWin
            const logo = proxyLogo(team.logo)
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {logo ? <Image src={logo} alt="" width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
                       : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: win ? 700 : 400, color: win ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {team.name}
                </span>
              </div>
            )
          })}
        </div>
        {/* Périodes P1/P2/P3 */}
        {showPeriods && <>
          {[["P1", p1h, p1a], ["P2", p2h, p2a], ["P3", p3h, p3a]].map(([lbl, h, a]) => (
            <div key={lbl as string} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 700 }}>{lbl}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{h}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{a}</span>
            </div>
          ))}
        </>}
        {/* Score total */}
        {hasScore && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: isLive ? "#ef4444" : homeWin ? "var(--text-primary)" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{hs}</span>
            <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: isLive ? "#ef4444" : awayWin ? "var(--text-primary)" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{as_}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function HockeyLeagueClient({ leagueName }: { leagueName: string }) {
  const { t, lang } = useT()
  const [matches,    setMatches]    = useState<Record<string, HMatch[]>>({})
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; logo: string | null; country: string } | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<"upcoming" | "results">("upcoming")

  useEffect(() => {
    fetch(`/api/hockey-league?leagueName=${encodeURIComponent(leagueName)}`)
      .then(r => r.json())
      .then(data => {
        if (data.leagueInfo) setLeagueInfo(data.leagueInfo)
        setMatches(data.matches ?? {})
        const today = new Date().toISOString().split("T")[0]
        const hasFuture = Object.keys(data.matches ?? {}).some(d => d >= today)
        setTab(hasFuture ? "upcoming" : "results")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [leagueName])

  const today = new Date().toISOString().split("T")[0]
  const past     = Object.entries(matches).filter(([d]) => d <  today).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10)
  const upcoming = Object.entries(matches).filter(([d]) => d >= today).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 10)
  const displayed = tab === "upcoming" ? upcoming : past

  const logo = leagueInfo?.logo ? proxyLogo(leagueInfo.logo) : null

  return (
    <div className="ligue-content" style={{ flex: 1, padding: "28px 36px", maxWidth: 860 }}>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {logo ? <Image src={logo} alt="" width={40} height={40} style={{ objectFit: "contain" }} unoptimized />
                 : <span style={{ fontSize: 22 }}>🏒</span>}
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
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
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
        displayed.map(([date, ms]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-muted)", padding: "8px 0", borderBottom: "2px solid var(--border)" }}>
              {fmt(new Date(date + "T12:00:00"), lang)}
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
              {ms.map((m: HMatch) => <MatchRow key={m.id} match={m} lang={lang} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
