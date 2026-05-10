"use client";

import { useState, useEffect } from "react";

interface HockeyRow {
  position:      number;
  team:          { id: number; name: string; logo: string };
  gamesPlayed:   number;
  wins:          number;
  winsOvertime:  number;
  losesOvertime: number;
  loses:         number;
  scoredGoals:   number;
  receivedGoals: number;
  points:        number;
}
interface HockeyGroup { name: string; standings: HockeyRow[] }

// Colonnes style FlashScore NHL : V = reg wins, VP = OT wins, DP = OT losses, D = reg losses
const COLS = "22px 1fr 30px 28px 28px 28px 28px 52px 34px"

function proxyLogo(url: string) {
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function FormDot({ result }: { result: string }) {
  const color = result === "W" ? "#16a34a" : result === "L" ? "#dc2626" : "#f59e0b"
  const lbl   = result === "W" ? "V" : result === "L" ? "D" : "N"
  return (
    <div style={{ width: 14, height: 14, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {lbl}
    </div>
  )
}

export default function HockeyStandingsModal({
  leagueId, leagueName,
}: { leagueId: string; leagueName: string }) {
  const [open, setOpen]       = useState(false)
  const [groups, setGroups]   = useState<HockeyGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)

  useEffect(() => {
    if (!open || groups.length > 0) return
    setLoading(true)
    fetch(`/api/hockey-standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => { setGroups(d.groups ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, leagueId, groups.length])

  return (
    <>
      {/* Bouton */}
      <button onClick={() => setOpen(true)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
        border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff",
        cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569",
        whiteSpace: "nowrap",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Classement
      </button>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />}

      {/* Panneau */}
      {open && (
        <div style={{
          position: "fixed", top: 0, right: 0, width: "min(680px,100vw)", height: "100vh",
          background: "#fff", zIndex: 101, display: "flex", flexDirection: "column",
          overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Classement</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{leagueName} · 2025-2026</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #f1f5f9", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#64748b" }}>✕</button>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Chargement...</div>
          ) : groups.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Classement non disponible.</div>
          ) : (
            <>
              {/* Sélecteur de groupe */}
              {groups.length > 1 && (
                <div style={{ display: "flex", gap: 4, padding: "10px 16px", overflowX: "auto", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                  {groups.map((g, i) => (
                    <button key={i} onClick={() => setActiveGroup(i)} style={{
                      padding: "5px 12px", borderRadius: 6, border: "1px solid",
                      borderColor: activeGroup === i ? "#2563eb" : "#e2e8f0",
                      background: activeGroup === i ? "#eff6ff" : "#fff",
                      color: activeGroup === i ? "#2563eb" : "#64748b",
                      fontSize: 11, fontWeight: activeGroup === i ? 700 : 500,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Tableau du groupe actif */}
              {(() => {
                const g = groups[activeGroup]
                if (!g) return null
                return (
                  <div style={{ flex: 1 }}>
                    {/* En-tête colonnes */}
                    <div style={{
                      display: "grid", gridTemplateColumns: COLS,
                      padding: "8px 16px", background: "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: 10, fontWeight: 700, color: "#94a3b8",
                      letterSpacing: ".05em", textTransform: "uppercase",
                    }}>
                      <span>#</span>
                      <span>Équipe</span>
                      <span style={{ textAlign: "center" }}>MJ</span>
                      <span style={{ textAlign: "center" }}>V</span>
                      <span style={{ textAlign: "center", color: "#22c55e" }}>VP</span>
                      <span style={{ textAlign: "center", color: "#f59e0b" }}>DP</span>
                      <span style={{ textAlign: "center" }}>D</span>
                      <span style={{ textAlign: "center" }}>B</span>
                      <span style={{ textAlign: "center", color: "#2563eb" }}>PTS</span>
                    </div>

                    {g.standings.map((row, idx) => {
                      const regWins  = row.wins - row.winsOvertime
                      const regLoses = row.loses - row.losesOvertime
                      const logo     = proxyLogo(row.team.logo)
                      return (
                        <div key={row.team.id} style={{
                          display: "grid", gridTemplateColumns: COLS,
                          padding: "7px 16px", alignItems: "center",
                          borderBottom: "1px solid #f8fafc", background: "#fff",
                        }}>
                          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{row.position}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                            <img src={logo} alt={row.team.name} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {row.team.name}
                            </span>
                          </div>
                          <span style={{ textAlign: "center", fontSize: 11, color: "#475569" }}>{row.gamesPlayed}</span>
                          <span style={{ textAlign: "center", fontSize: 11, color: "#475569" }}>{regWins}</span>
                          <span style={{ textAlign: "center", fontSize: 11, color: "#22c55e", fontWeight: 600 }}>{row.winsOvertime}</span>
                          <span style={{ textAlign: "center", fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>{row.losesOvertime}</span>
                          <span style={{ textAlign: "center", fontSize: 11, color: "#475569" }}>{regLoses}</span>
                          <span style={{ textAlign: "center", fontSize: 10, color: "#64748b" }}>{row.scoredGoals}:{row.receivedGoals}</span>
                          <span style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.points}</span>
                        </div>
                      )
                    })}

                    {/* Légende */}
                    <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {[
                        { color: "#22c55e", label: "VP — Victoire en prolongation" },
                        { color: "#f59e0b", label: "DP — Défaite en prolongation" },
                      ].map(item => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                          <span style={{ fontSize: 11, color: "#64748b" }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}
    </>
  )
}
