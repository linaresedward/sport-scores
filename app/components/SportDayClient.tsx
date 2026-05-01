'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DatePicker from './DatePicker'
import { useT } from '@/lib/i18n'

const BASE = `https://www.thesportsdb.com/api/v1/json/139695`

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
  strVenue: string | null
}

const LIVE_STATUSES = ['In Progress', 'HT', '1H', '2H', 'ET', 'P', 'LIVE', 'Extra Time']

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function SportDayClient({
  sport, sportLabel, emoji,
}: {
  sport: string; sportLabel: string; emoji: string
}) {
  const { lang } = useT()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [grouped, setGrouped]           = useState<Record<string, SportEvent[]>>({})
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const date = formatDate(selectedDate)
        const res  = await fetch(`${BASE}/eventsday.php?d=${date}&s=${sport}`)
        const data = await res.json()
        const events: SportEvent[] = data.events ?? []
        const map: Record<string, SportEvent[]> = {}
        for (const ev of events) {
          const key = ev.strLeague || 'Autre'
          if (!map[key]) map[key] = []
          map[key].push(ev)
        }
        setGrouped(map)
      } catch (e) {
        console.error(e)
        setGrouped({})
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [selectedDate, sport])

  const totalMatches = Object.values(grouped).flat().length
  const hasLive      = Object.values(grouped).flat().some(e => LIVE_STATUSES.includes(e.strStatus))

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px" }}>
      <style>{`
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .sport-match-row { transition: background .12s; }
        .sport-match-row:hover { background: var(--bg-muted) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, fontSize: 22,
          background: "var(--bg-muted)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            {sportLabel}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {totalMatches} match{totalMatches > 1 ? 's' : ''}
          </p>
        </div>
        {hasLive && (
          <span style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 700, color: "#ef4444",
            background: "rgba(239,68,68,0.1)", padding: "4px 12px",
            borderRadius: 999, border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.4s infinite" }}/>
            {lang === 'fr' ? 'EN DIRECT' : 'LIVE'}
          </span>
        )}
      </div>

      {/* DatePicker */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          lang={lang as "fr" | "en"}
        />
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              height: 64, background: "var(--bg-surface)", borderRadius: 10,
              border: "1px solid var(--border)", animation: "shimmer 1.6s infinite",
            }}/>
          ))}
        </div>
      ) : totalMatches === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</p>
          <p style={{ fontSize: 14 }}>
            {lang === 'fr' ? `Aucun match ${sportLabel.toLowerCase()} ce jour` : `No ${sportLabel} matches today`}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Object.entries(grouped).map(([league, events]) => (
            <div key={league} style={{
              background: "var(--bg-surface)", borderRadius: 12,
              border: "1px solid var(--border)", overflow: "hidden",
            }}>
              {/* Header ligue */}
              <div style={{
                padding: "8px 14px", borderBottom: "1px solid var(--border)",
                background: "var(--bg-muted)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>
                  {league}
                </p>
              </div>

              {/* Matchs */}
              {events.map((ev, i) => {
                const isLive     = LIVE_STATUSES.includes(ev.strStatus)
                const isFinished = ev.strStatus === 'Match Finished'
                const hasScore   = ev.intHomeScore !== null && ev.intAwayScore !== null

                return (
                  <Link key={ev.idEvent} href={`/match/${ev.idEvent}`}
                    className="sport-match-row"
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", textDecoration: "none",
                      borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none",
                      background: "var(--bg-surface)",
                    }}
                  >
                    {/* Statut */}
                    <div style={{ width: 52, flexShrink: 0, textAlign: "center" }}>
                      {isLive ? (
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#ef4444" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.4s infinite" }}/>
                          LIVE
                        </span>
                      ) : isFinished ? (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>FT</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
                          {ev.strTime?.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    {/* Équipes */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {ev.strHomeTeamBadge
                          ? <img src={ev.strHomeTeamBadge} style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }}/>
                          : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }}/>
                        }
                        <span style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.strHomeTeam}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {ev.strAwayTeamBadge
                          ? <img src={ev.strAwayTeamBadge} style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }}/>
                          : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }}/>
                        }
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ev.strAwayTeam}
                        </span>
                      </div>
                    </div>

                    {/* Scores */}
                    {hasScore && (
                      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? "#22c55e" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                          {ev.intHomeScore}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isLive ? "#22c55e" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                          {ev.intAwayScore}
                        </span>
                      </div>
                    )}

                    <span style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0 }}>›</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
