"use client";

// ─── Composant bracket playoffs horizontal partagé ──────────
// Utilisé par NBA (BasketStandingsModal) et NHL (HockeyStandingsModal)

export interface BracketSeries {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: number; done: boolean
}

export interface BracketRound {
  name: string
  series: BracketSeries[]
}

function proxyLogo(url: string | null | undefined) {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function SeriesCard({ s }: { s: BracketSeries }) {
  const logoA = proxyLogo(s.badgeA)
  const logoB = proxyLogo(s.badgeB)
  const aWins = s.winsA >= 4 && s.done
  const bWins = s.winsB >= 4 && s.done
  const inProgress = !s.done && s.games > 0

  return (
    <div style={{
      border: `1px solid ${inProgress ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 8, overflow: "hidden", background: "#141926",
      boxShadow: inProgress ? "0 0 0 1px rgba(239,68,68,0.2)" : "none",
      width: "100%",
    }}>
      {inProgress && <div style={{ height: 2, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />}
      {[
        { name: s.teamA, logo: logoA, wins: s.winsA, win: aWins, lose: bWins },
        { name: s.teamB, logo: logoB, wins: s.winsB, win: bWins, lose: aWins },
      ].map((team, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px",
          borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
          background: team.win ? "rgba(37,99,235,0.2)" : "transparent",
        }}>
          {team.logo && (
            <img src={team.logo} width={20} height={20} style={{ objectFit: "contain", flexShrink: 0, filter: team.lose ? "grayscale(70%) opacity(0.5)" : "none" }} alt="" />
          )}
          <span style={{
            fontSize: 12, flex: 1, fontWeight: team.win ? 700 : 400,
            color: team.win ? "#ffffff" : team.lose ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {team.name}
          </span>
          {(s.winsA + s.winsB > 0) && (
            <span style={{
              fontSize: 16, fontWeight: 800, minWidth: 16, textAlign: "center", flexShrink: 0,
              color: team.win ? "#ffffff" : team.lose ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
            }}>
              {team.wins}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function HorizontalBracket({ rounds, emptyMsg }: {
  rounds: BracketRound[];
  emptyMsg?: string;
}) {
  if (!rounds.length) return (
    <div style={{ padding: "48px 16px", textAlign: "center", color: "#64748b", background: "#0f1117" }}>
      {emptyMsg ?? "Données non disponibles."}
    </div>
  )

  // Calculer la hauteur de slot : les rounds plus avancés ont moins de matchs
  // Chaque série dans le round 1 occupe 1 slot ; round 2 en occupe 2, etc.
  const maxSeriesInRound0 = Math.max(...rounds.map(r => r.series.length))
  const CARD_HEIGHT = 82  // hauteur d'une carte en px
  const GAP         = 12  // gap entre cartes

  return (
    <div style={{ background: "#0f1117", padding: 16, overflowX: "auto" }}>
      <div style={{
        display: "flex",
        gap: 0,
        minWidth: rounds.length * 210,
        alignItems: "flex-start",
      }}>
        {rounds.map((round, ri) => {
          // Chaque série dans ce round "prend" combien de slots du round 1 ?
          const slotsPerSeries = maxSeriesInRound0 / (round.series.length || 1)
          const slotH = slotsPerSeries * (CARD_HEIGHT + GAP) - GAP

          return (
            <div key={ri} style={{ flex: `0 0 ${100 / rounds.length}%`, minWidth: 190, paddingRight: 8 }}>
              {/* Titre du round */}
              <div style={{
                textAlign: "center", padding: "6px 4px 10px",
                fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
                color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12,
              }}>
                {round.name}
              </div>

              {/* Séries */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {round.series.map((s, si) => (
                  <div key={si} style={{
                    height: slotH + (si < round.series.length - 1 ? GAP : 0),
                    display: "flex", alignItems: "center", position: "relative",
                  }}>
                    <div style={{ width: "100%" }}>
                      <SeriesCard s={s} />
                    </div>
                    {/* Ligne de connexion vers le round suivant */}
                    {ri < rounds.length - 1 && (
                      <div style={{
                        position: "absolute", right: -8, top: "50%",
                        width: 8, height: 1,
                        background: s.done ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)",
                      }} />
                    )}
                  </div>
                ))}
                {/* Slots vides pour les rounds avancés si pas encore joués */}
                {Array.from({ length: Math.ceil(maxSeriesInRound0 / round.series.length) - round.series.length }).map((_, ei) => (
                  <div key={`empty-${ei}`} style={{
                    height: slotH + GAP, display: "flex", alignItems: "center",
                  }}>
                    <div style={{
                      width: "100%", height: CARD_HEIGHT, borderRadius: 8,
                      border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)",
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(37,99,235,0.25)", border: "1px solid rgba(59,130,246,0.4)" }} />
          <span style={{ fontSize: 10, color: "#475569" }}>Qualifié (4 victoires)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 2, background: "linear-gradient(90deg,#ef4444,#f97316)", borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: "#475569" }}>Série en cours</span>
        </div>
      </div>
    </div>
  )
}
