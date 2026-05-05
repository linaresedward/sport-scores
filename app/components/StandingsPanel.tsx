"use client";

import { useState, useEffect } from "react";

type Standing = {
  position: number
  team: { id: number; name: string; logo: string }
  total: { wins: number; draws: number; loses: number; games: number; scoredGoals: number; receivedGoals: number }
  points: number
  strForm?: string
  strTeam?: string
  intRank?: string
  intPlayed?: string
  intWin?: string
  intDraw?: string
  intLoss?: string
  intPoints?: string
  intGoalDifference?: string
  intGoalsFor?: string
  intGoalsAgainst?: string
  strBadge?: string
  strDescription?: string
  idTeam?: string
};

function getZoneColor(description: string): string | null {
  const d = (description ?? "").toLowerCase();
  if (d.includes("champions league") && !d.includes("qualification")) return "#1E40AF";
  if (d.includes("champions league qualification")) return "#2563EB";
  if (d.includes("europa league") && !d.includes("qualification")) return "#EA580C";
  if (d.includes("europa league qualification")) return "#F97316";
  if (d.includes("conference") && !d.includes("qualification")) return "#166534";
  if (d.includes("conference") && d.includes("qualification")) return "#16A34A";
  if (d.includes("relegation playoff")) return "#C2410C";
  if (d.includes("relegation")) return "#991B1B";
  return null;
}

function FormDot({ result }: { result: string }) {
  const color = result === "W" ? "#16a34a" : result === "L" ? "#dc2626" : "#f59e0b";
  const label = result === "W" ? "V" : result === "L" ? "D" : "N";
  return (
    <div style={{
      width: "16px", height: "16px", borderRadius: "50%",
      background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "8px", fontWeight: 700, color: "#fff", flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

// Colonnes : # | Équipe | MJ | V | N | D | Buts | +/- | Pts | Forme
const COLS = "24px 1fr 28px 26px 26px 26px 42px 34px 32px 88px";

export default function StandingsPanel({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const [open, setOpen]           = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!open || standings.length > 0) return;
    setLoading(true);
    fetch(`/api/standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => {
        setStandings(d.groups?.[0]?.standings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
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

      {/* Panneau — largeur augmentée à 600px */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "min(600px, 100vw)",
        height: "100vh",
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
              display: "grid", gridTemplateColumns: COLS,
              padding: "8px 16px",
              fontSize: "10px", fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.05em", textTransform: "uppercase",
              background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
            }}>
              <span>#</span>
              <span>Équipe</span>
              <span style={{ textAlign: "center" }}>MJ</span>
              <span style={{ textAlign: "center" }}>V</span>
              <span style={{ textAlign: "center" }}>N</span>
              <span style={{ textAlign: "center" }}>D</span>
              <span style={{ textAlign: "center" }}>Buts</span>
              <span style={{ textAlign: "center" }}>+/-</span>
              <span style={{ textAlign: "center" }}>Pts</span>
              <span style={{ textAlign: "center" }}>Forme</span>
            </div>

            {standings.map((row, idx) => {
              const rank      = parseInt(row.intRank ?? "0");
              const zoneColor = getZoneColor(row.strDescription ?? "");
              const prevColor = idx > 0 ? getZoneColor(standings[idx - 1].strDescription ?? "") : null;
              const zoneChanged = zoneColor !== prevColor && idx > 0 && zoneColor;
              const diff      = parseInt(row.intGoalDifference ?? "0");
              const gf        = row.intGoalsFor ?? row.total?.scoredGoals ?? "?";
              const ga        = row.intGoalsAgainst ?? row.total?.receivedGoals ?? "?";
              const draws     = row.intDraw ?? row.total?.draws ?? "?";
              const form      = (row.strForm ?? "").split("").slice(0, 5);
              const key       = row.idTeam ?? String(idx);

              return (
                <div key={key}>
                  {zoneChanged && (
                    <div style={{
                      padding: "3px 16px",
                      fontSize: "10px", fontWeight: 700,
                      color: zoneColor!, background: zoneColor + "15",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      {row.strDescription}
                    </div>
                  )}

                  <div style={{
                    display: "grid", gridTemplateColumns: COLS,
                    padding: "7px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid #f8fafc",
                    background: "#fff",
                  }}>
                    {/* Rang */}
                    <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <div style={{
                        width: "3px", height: "18px", borderRadius: "2px",
                        background: zoneColor || "transparent", flexShrink: 0,
                      }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                        {rank}
                      </span>
                    </div>

                    {/* Équipe */}
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
                      {row.strBadge ? (
                        <img
                          src={row.strBadge.replace("/tiny", "")}
                          alt={row.strTeam}
                          width={16} height={16}
                          style={{ objectFit: "contain", flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 16, height: 16, background: "#f1f5f9", borderRadius: "50%", flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontSize: "11px", fontWeight: 500, color: "#1e293b",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {row.strTeam}
                      </span>
                    </div>

                    <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{row.intPlayed}</span>
                    <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{row.intWin}</span>
                    <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{String(draws)}</span>
                    <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{row.intLoss}</span>

                    {/* Buts */}
                    <span style={{ textAlign: "center", fontSize: "10px", color: "#64748b" }}>
                      {gf}:{ga}
                    </span>

                    {/* +/- */}
                    <span style={{
                      textAlign: "center", fontSize: "11px", fontWeight: 600,
                      color: diff > 0 ? "#166534" : diff < 0 ? "#991b1b" : "#64748b",
                    }}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>

                    {/* Pts */}
                    <span style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                      {row.intPoints}
                    </span>

                    {/* Forme */}
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center" }}>
                      {form.length > 0
                        ? form.map((r, i) => <FormDot key={i} result={r} />)
                        : <span style={{ fontSize: "10px", color: "#cbd5e1" }}>—</span>
                      }
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Légende */}
            <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8",
                letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Légende
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { color: "#16a34a", label: "V — Victoire" },
                  { color: "#f59e0b", label: "N — Nul" },
                  { color: "#dc2626", label: "D — Défaite" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}