"use client";

import { useState, useEffect } from "react";

type Standing = {
  position: number
  team: { id: number; name: string; logo: string }
  total: { wins: number; draws: number; loses: number; games: number; scoredGoals: number; receivedGoals: number }
  points: number
  description?: string
};

export default function StandingsPanel({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const [open, setOpen] = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || standings.length > 0) return
    setLoading(true)
    fetch(`/api/standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => {
        const rows = d.groups?.[0]?.standings ?? []
        setStandings(rows)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open, leagueId, standings.length]);

  return (
    <>
      {/* Bouton */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "7px 14px",
          border: "1px solid #e2e8f0", borderRadius: "8px",
          background: "#fff", cursor: "pointer",
          fontSize: "13px", fontWeight: 600, color: "#475569",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#2563eb", e.currentTarget.style.color = "#2563eb")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0", e.currentTarget.style.color = "#475569")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Classement
      </button>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.3)", zIndex: 100,
        }} />
      )}

      {/* Panneau */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "480px", height: "100vh",
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        zIndex: 101,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Classement</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              {leagueName} · 2025-2026
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            width: "32px", height: "32px", borderRadius: "8px",
            border: "1px solid #f1f5f9", background: "#f8fafc",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "16px", color: "#64748b",
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Chargement...</div>
        ) : standings.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Classement non disponible.</div>
        ) : (
          <div style={{ flex: 1 }}>
            {/* En-tête colonnes */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 28px 28px 28px 36px 40px",
              padding: "8px 16px",
              fontSize: "10px", fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.05em", textTransform: "uppercase",
              background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
            }}>
              <span>#</span>
              <span>Équipe</span>
              <span style={{ textAlign: "center" }}>MJ</span>
              <span style={{ textAlign: "center" }}>G</span>
              <span style={{ textAlign: "center" }}>P</span>
              <span style={{ textAlign: "center" }}>+/-</span>
              <span style={{ textAlign: "center" }}>Pts</span>
            </div>

            {standings.map((row) => {
              const diff = (row.total.scoredGoals ?? 0) - (row.total.receivedGoals ?? 0)
              return (
                <div key={row.team.id} style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 28px 28px 28px 36px 40px",
                  padding: "8px 16px",
                  alignItems: "center",
                  borderBottom: "1px solid #f8fafc",
                  background: "#fff",
                }}>
                  {/* Rang */}
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                    {row.position}
                  </span>

                  {/* Équipe */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                    {row.team.logo ? (
                      <img
                        src={`/api/logo?url=${encodeURIComponent(row.team.logo)}`}
                        alt={row.team.name}
                        width={18} height={18}
                        style={{ objectFit: "contain", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: "18px", height: "18px", background: "#f1f5f9", borderRadius: "50%", flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: "12px", fontWeight: 500, color: "#1e293b",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {row.team.name}
                    </span>
                  </div>

                  <span style={{ textAlign: "center", fontSize: "12px", color: "#475569" }}>{row.total.games}</span>
                  <span style={{ textAlign: "center", fontSize: "12px", color: "#475569" }}>{row.total.wins}</span>
                  <span style={{ textAlign: "center", fontSize: "12px", color: "#475569" }}>{row.total.loses}</span>

                  <span style={{
                    textAlign: "center", fontSize: "12px", fontWeight: 600,
                    color: diff > 0 ? "#166534" : diff < 0 ? "#991b1b" : "#64748b",
                  }}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>

                  <span style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    {row.points}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  );
}
