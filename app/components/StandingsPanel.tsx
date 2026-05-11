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

// Zones pour les championnats (depuis description TheSportsDB)
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

// Zones pour les compétitions UEFA en phase de ligue (position 1-36)
const UEFA_LEAGUE_PHASE_IDS = new Set(["2486", "3337", "722432"]);

function getUEFAZone(leagueId: string, rank: number): { color: string; label: string } | null {
  if (!UEFA_LEAGUE_PHASE_IDS.has(leagueId)) return null;
  if (rank <= 8)  return { color: "#16a34a", label: "Qualifié — 8es de finale" };
  if (rank <= 24) return { color: "#2563eb", label: "Barrages — 8es de finale" };
  return { color: "#94a3b8", label: "Éliminé" };
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

const LIVE_DESCS = new Set(["First half", "Second half", "Half time", "Extra time", "Penalties"])

interface LiveInfo { score: string; opponent: string; isHome: boolean; clock: number | null }

// ─── Calcul du classement virtuel (live) ──────────────────
function norm(s: string) { return s.toLowerCase().replace(/[^\w]/g, "") }

interface VirtualRow extends Standing {
  vPts: number; vGD: number; vGF: number; vGA: number
  vRank: number; origRank: number; rankChange: number
  liveInfo?: LiveInfo
}

function computeVirtualStandings(
  standings: Standing[],
  liveMap: Map<number, LiveInfo>,
  liveNameMap: Map<string, LiveInfo>
): VirtualRow[] {
  const adjusted: VirtualRow[] = standings.map((row, idx) => {
    const teamId   = row.team?.id
    const teamName = norm(row.strTeam ?? row.team?.name ?? "")

    // Essai par ID Highlightly, puis par nom (fallback)
    const live = (teamId ? liveMap.get(teamId) : undefined) ?? liveNameMap.get(teamName)

    const pts = parseInt(row.intPoints ?? String(row.points ?? 0))
    const gd  = parseInt(row.intGoalDifference ?? "0")
    const gf  = parseInt(row.intGoalsFor ?? String((row.total?.scoredGoals ?? 0)))
    const ga  = parseInt(row.intGoalsAgainst ?? String((row.total?.receivedGoals ?? 0)))

    if (!live || !live.score) {
      return { ...row, vPts: pts, vGD: gd, vGF: gf, vGA: ga, vRank: 0, origRank: idx + 1, rankChange: 0 }
    }

    const [h, a] = live.score.split(" - ").map(Number)
    const myScore    = live.isHome ? h : a
    const theirScore = live.isHome ? a : h
    const addPts = myScore > theirScore ? 3 : myScore === theirScore ? 1 : 0

    return {
      ...row,
      liveInfo: live,
      vPts: pts + addPts,
      vGD:  gd  + myScore - theirScore,
      vGF:  gf  + myScore,
      vGA:  ga  + theirScore,
      vRank: 0, origRank: idx + 1, rankChange: 0,
    }
  })

  // Re-trier par pts virtuels → GD → GF
  adjusted.sort((a, b) => {
    if (b.vPts !== a.vPts) return b.vPts - a.vPts
    if (b.vGD  !== a.vGD)  return b.vGD  - a.vGD
    return b.vGF - a.vGF
  })

  adjusted.forEach((row, idx) => {
    row.vRank      = idx + 1
    row.rankChange = row.origRank - row.vRank  // >0 = monte, <0 = descend
  })

  return adjusted
}

export default function StandingsPanel({
  leagueId,
  leagueName,
  endpointUrl = "/api/standings",
}: {
  leagueId: string;
  leagueName: string;
  endpointUrl?: string;
}) {
  const [open, setOpen]           = useState(false);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading]     = useState(false);
  const [liveMap, setLiveMap]     = useState<Map<number, LiveInfo>>(new Map());
  const [liveNameMap, setLiveNameMap] = useState<Map<string, LiveInfo>>(new Map());
  const [showLive, setShowLive]   = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const [activePanel, setActivePanel] = useState<"standings"|"scorers"|"assists">("standings");
  const [scorers,  setScorers]    = useState<any[]>([]);
  const [assists,  setAssists]    = useState<any[]>([]);
  const [scorersLoading, setScorersLoading] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 540);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!open || (activePanel === "standings" && scorers.length > 0)) return;
    if (activePanel === "scorers" && scorers.length === 0) {
      setScorersLoading(true);
      Promise.all([
        fetch(`/api/top-scorers?leagueId=${leagueId}&type=scorers`).then(r => r.json()),
        fetch(`/api/top-scorers?leagueId=${leagueId}&type=assists`).then(r => r.json()),
      ]).then(([s, a]) => { setScorers(s); setAssists(a); }).catch(() => {}).finally(() => setScorersLoading(false));
    }
    if (activePanel === "assists" && assists.length === 0) {
      setScorersLoading(true);
      fetch(`/api/top-scorers?leagueId=${leagueId}&type=assists`).then(r => r.json())
        .then(a => setAssists(a)).catch(() => {}).finally(() => setScorersLoading(false));
    }
  }, [open, activePanel, leagueId, scorers.length, assists.length]);

  useEffect(() => {
    if (!open || standings.length > 0) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    Promise.all([
      fetch(`${endpointUrl}?leagueId=${leagueId}`).then(r => r.json()),
      fetch(`/api/matches?date=${today}`).then(r => r.json()),
    ]).then(([standData, matchData]) => {
      setStandings(standData.groups?.[0]?.standings ?? []);

      const leagueMatches: any[] = matchData[leagueId] ?? [];
      const map     = new Map<number, LiveInfo>();
      const nameMap = new Map<string, LiveInfo>();

      leagueMatches.forEach((m: any) => {
        if (!LIVE_DESCS.has(m.state?.description ?? "")) return;
        const score = m.state?.score?.current ?? "";
        const clock = m.state?.clock ?? null;
        map.set(m.homeTeam.id, { score, opponent: m.awayTeam.name, isHome: true, clock });
        map.set(m.awayTeam.id, { score, opponent: m.homeTeam.name, isHome: false, clock });
        nameMap.set(norm(m.homeTeam.name), { score, opponent: m.awayTeam.name, isHome: true, clock });
        nameMap.set(norm(m.awayTeam.name), { score, opponent: m.homeTeam.name, isHome: false, clock });
      });
      setLiveMap(map);
      setLiveNameMap(nameMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, leagueId, standings.length]);

  return (
    <>
      {/* Bouton */}
      <button
        onClick={() => setOpen(true)}
        title="Classement"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "7px 10px",
          border: "1px solid #e2e8f0", borderRadius: "8px",
          background: "#fff", cursor: "pointer", color: "#475569",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.color = "#2563eb"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
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
        boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.12)" : "none",
        zIndex: 101,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
          borderBottom: "1px solid #f1f5f9",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  {activePanel === "standings" ? "Classement" : activePanel === "scorers" ? "Buteurs" : "Passeurs"}
                </span>
                {liveMap.size > 0 && activePanel === "standings" && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 999,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    fontSize: 10, fontWeight: 700, color: "#ef4444",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.4s ease-in-out infinite" }} />
                    LIVE
                  </span>
                )}
              </div>
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
          {/* Onglets */}
          <div style={{ display: "flex", padding: "0 20px 0", gap: 4 }}>
            {([
              { key: "standings", label: "🏆 Classement" },
              { key: "scorers",   label: "⚽ Buteurs" },
              { key: "assists",   label: "🎯 Passeurs" },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActivePanel(tab.key)} style={{
                padding: "7px 12px", border: "none", background: "transparent", cursor: "pointer",
                fontSize: 12, fontWeight: activePanel === tab.key ? 700 : 500,
                color: activePanel === tab.key ? "#2563eb" : "#64748b",
                borderBottom: activePanel === tab.key ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {/* ── Onglet Buteurs / Passeurs ── */}
        {(activePanel === "scorers" || activePanel === "assists") && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {scorersLoading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Chargement...</div>
            ) : (activePanel === "scorers" ? scorers : assists).length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div>Données non disponibles pour cette compétition</div>
              </div>
            ) : (
              <>
                {/* En-tête */}
                <div style={{
                  display: "grid", gridTemplateColumns: "28px 1fr 80px 40px 40px",
                  padding: "8px 16px", fontSize: 10, fontWeight: 700, color: "#94a3b8",
                  letterSpacing: ".05em", textTransform: "uppercase",
                  background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
                }}>
                  <span>#</span><span>Joueur</span><span>Équipe</span>
                  <span style={{ textAlign: "center" }}>{activePanel === "scorers" ? "Buts" : "Passes"}</span>
                  <span style={{ textAlign: "center" }}>MJ</span>
                </div>
                {(activePanel === "scorers" ? scorers : assists).map((s: any, idx: number) => (
                  <div key={idx} style={{
                    display: "grid", gridTemplateColumns: "28px 1fr 80px 40px 40px",
                    padding: "8px 16px", alignItems: "center",
                    borderBottom: "1px solid #f8fafc",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{s.rank ?? idx + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
                      {s.photo && <img src={s.photo} alt="" width={22} height={22} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                      {s.teamLogo && <img src={s.teamLogo} alt="" width={14} height={14} style={{ objectFit: "contain", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />}
                      <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.team}</span>
                    </div>
                    <span style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                      {activePanel === "scorers" ? s.goals : s.assists}
                    </span>
                    <span style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>{s.played || "—"}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Onglet Classement ── */}
        {activePanel === "standings" && (loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Chargement...</div>
        ) : standings.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8" }}>Classement non disponible.</div>
        ) : (
          <div style={{ flex: 1 }}>
            {/* Toggle Live / Régulier — visible uniquement si des matchs sont en cours */}
            {liveMap.size > 0 && (
              <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
                {[
                  { key: false, label: "Régulier" },
                  { key: true,  label: "🔴 Live" },
                ].map(tab => (
                  <button key={String(tab.key)} onClick={() => setShowLive(tab.key)} style={{
                    padding: "4px 12px", borderRadius: 6, border: "1px solid", cursor: "pointer",
                    borderColor: showLive === tab.key ? "#ef4444" : "#e2e8f0",
                    background:  showLive === tab.key ? "rgba(239,68,68,0.08)" : "#fff",
                    color:       showLive === tab.key ? "#ef4444" : "#64748b",
                    fontSize: 11, fontWeight: showLive === tab.key ? 700 : 500,
                  }}>{tab.label}</button>
                ))}
              </div>
            )}

            {/* En-tête colonnes */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "24px 1fr 28px 34px 72px"
                : COLS,
              padding: "8px 16px",
              fontSize: "10px", fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.05em", textTransform: "uppercase",
              background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
            }}>
              <span>#</span>
              <span>Équipe</span>
              <span style={{ textAlign: "center" }}>MJ</span>
              {!isMobile && <span style={{ textAlign: "center" }}>V</span>}
              {!isMobile && <span style={{ textAlign: "center" }}>N</span>}
              {!isMobile && <span style={{ textAlign: "center" }}>D</span>}
              {!isMobile && <span style={{ textAlign: "center" }}>Buts</span>}
              {!isMobile && <span style={{ textAlign: "center" }}>+/-</span>}
              <span style={{ textAlign: "center" }}>Pts</span>
              <span style={{ textAlign: "center" }}>Forme</span>
            </div>

            {(showLive
              ? computeVirtualStandings(standings, liveMap, liveNameMap)
              : (standings as VirtualRow[])
            ).map((row, idx) => {
              const live = showLive ? row.liveInfo : (row.team?.id ? liveMap.get(row.team.id) : undefined);

              // ── Normalisation : TheSportsDB OU Highlightly ──────────────────
              const rank    = showLive ? row.vRank : parseInt(row.intRank ?? String(row.position ?? idx + 1));
              const name    = row.strTeam  ?? row.team?.name  ?? "";
              const badge   = row.strBadge
                ? row.strBadge.replace("/tiny", "")
                : row.team?.logo
                  ? `/api/logo?url=${encodeURIComponent(row.team.logo)}`
                  : null;
              const played  = row.intPlayed ?? String(row.total?.games ?? "");
              const won     = row.intWin    ?? String(row.total?.wins  ?? "");
              const draws   = row.intDraw   ?? String(row.total?.draws ?? "");
              const lost    = row.intLoss   ?? String(row.total?.loses ?? "");
              const gf      = showLive ? row.vGF : (row.intGoalsFor      ?? row.total?.scoredGoals   ?? "?");
              const ga      = showLive ? row.vGA : (row.intGoalsAgainst  ?? row.total?.receivedGoals ?? "?");
              const gdRaw   = showLive ? row.vGD : (row.intGoalDifference
                ? parseInt(row.intGoalDifference)
                : (row.total ? row.total.scoredGoals - row.total.receivedGoals : 0));
              const pts     = showLive ? row.vPts : (row.intPoints ?? String(row.points ?? ""));
              const form    = (row.strForm ?? "").split("").slice(0, 5);
              const key     = row.idTeam ?? String(idx);

              // ── Zone couleur : TheSportsDB (description) ou UEFA position ──
              const zoneFromDesc  = getZoneColor(row.strDescription ?? "");
              const zoneFromUEFA  = getUEFAZone(leagueId, rank);
              const zoneColor     = zoneFromDesc ?? zoneFromUEFA?.color ?? null;

              // ── Séparateur de zone (mode régulier uniquement) ───────────────
              const prevRowOrig  = !showLive && idx > 0 ? standings[idx - 1] : null;
              const prevZoneDesc = prevRowOrig ? getZoneColor(prevRowOrig.strDescription ?? "") : null;
              const prevRankNum  = prevRowOrig ? parseInt((prevRowOrig as any).intRank ?? String((prevRowOrig as any).position ?? idx)) : null;
              const prevZoneUEFA = prevRowOrig ? getUEFAZone(leagueId, prevRankNum ?? 0) : null;
              const prevZone = prevZoneDesc ?? prevZoneUEFA?.color ?? null;
              const showSeparator = !showLive && idx > 0 && zoneColor !== prevZone;
              const separatorLabel = zoneFromUEFA?.label ?? row.strDescription;

              // ── Flèche de changement de rang (mode live) ────────────────────
              const rankChange = showLive ? row.rankChange : 0;

              return (
                <div key={key}>
                  {showSeparator && separatorLabel && (
                    <div style={{
                      padding: "3px 16px", fontSize: "10px", fontWeight: 700,
                      color: zoneColor!, background: zoneColor + "18",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      borderTop: `2px solid ${zoneColor}40`,
                    }}>
                      {separatorLabel}
                    </div>
                  )}

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "24px 1fr 28px 34px 72px" : COLS,
                    padding: "7px 16px", alignItems: "center",
                    borderBottom: "1px solid #f8fafc",
                    background: live ? "rgba(239,68,68,0.04)" : "#fff",
                    borderLeft: live ? "3px solid #ef4444" : "3px solid transparent",
                  }}>
                    {/* Rang avec barre couleur zone + flèche live */}
                    <div style={{ display: "flex", alignItems: "center", gap: "2px", position: "relative" }}>
                      <div style={{ width: "3px", height: "18px", borderRadius: "2px", background: zoneColor || "transparent", flexShrink: 0 }} />
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{rank}</span>
                      {showLive && rankChange !== 0 && (
                        <span style={{
                          fontSize: 8, fontWeight: 800, lineHeight: 1,
                          color: rankChange > 0 ? "#16a34a" : "#dc2626",
                        }}>
                          {rankChange > 0 ? "▲" : "▼"}
                        </span>
                      )}
                    </div>

                    {/* Équipe */}
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", overflow: "hidden" }}>
                      {badge ? (
                        <img src={badge} alt={name} width={16} height={16} style={{ objectFit: "contain", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 16, height: 16, background: "#f1f5f9", borderRadius: "50%", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: "11px", fontWeight: live ? 700 : 500, color: live ? "#ef4444" : "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </span>
                      {/* Score live inline — affiché depuis la perspective de l'équipe */}
                      {live?.score && (
                        <span style={{
                          flexShrink: 0, fontSize: 9, fontWeight: 800, color: "#fff",
                          background: "#ef4444", padding: "1px 5px", borderRadius: 4,
                          whiteSpace: "nowrap", letterSpacing: ".03em",
                        }}>
                          {live.isHome
                            ? live.score
                            : live.score.split(" - ").reverse().join(" - ")}
                        </span>
                      )}
                    </div>

                    <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{played}</span>
                    {!isMobile && <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{won}</span>}
                    {!isMobile && <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{draws}</span>}
                    {!isMobile && <span style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>{lost}</span>}
                    {!isMobile && <span style={{ textAlign: "center", fontSize: "10px", color: "#64748b" }}>{gf}:{ga}</span>}
                    {!isMobile && <span style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: gdRaw > 0 ? "#166534" : gdRaw < 0 ? "#991b1b" : "#64748b" }}>
                      {gdRaw > 0 ? `+${gdRaw}` : gdRaw}
                    </span>}
                    <span style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: showLive && live ? "#ef4444" : "#0f172a" }}>{pts}</span>
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
        ))}
      </div>
    </>
  );
}