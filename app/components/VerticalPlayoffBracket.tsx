"use client"

export interface PlayoffSeries {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: number; done: boolean
  conference: 'East' | 'West' | 'Finals'
}

export interface PlayoffRound {
  name: string
  series: PlayoffSeries[]
}

const CONF_ROUNDS = ["1/8 de finale", "Quarts de finale", "Demi-finales"] as const

const ROUND_SIZE: Record<string, number> = {
  "1/8 de finale": 4,
  "Quarts de finale": 2,
  "Demi-finales": 1,
}

const ROUND_LABEL: Record<string, string> = {
  "1/8 de finale":    "1/4 DE FINALE",
  "Quarts de finale": "1/2 DE FINALE",
  "Demi-finales":     "FINALE DE CONFÉRENCE",
}

// Gap interne entre paires — DOIT être < séparateur inter-conférence (2px visible + 20px)
const PAIR_GAP = 6

function proxyLogo(url: string | null | undefined) {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function SeriesCard({ s }: { s: PlayoffSeries }) {
  const logoA = proxyLogo(s.badgeA)
  const logoB = proxyLogo(s.badgeB)
  const aWins = s.done && s.winsA >= 4
  const bWins = s.done && s.winsB >= 4
  // Série en cours UNIQUEMENT si non terminée ET au moins un match joué
  const inProgress = !s.done && s.games > 0

  return (
    <div style={{
      border: `1px solid ${inProgress ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 8, background: "#141926", overflow: "hidden", width: "100%",
    }}>
      {inProgress && <div style={{ height: 2, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />}
      {([
        { name: s.teamA, logo: logoA, wins: s.winsA, win: aWins, lose: bWins },
        { name: s.teamB, logo: logoB, wins: s.winsB, win: bWins, lose: aWins },
      ] as const).map((team, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "7px 7px",
          borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
          background: team.win ? "rgba(37,99,235,0.22)" : "transparent",
        }}>
          {team.logo && (
            <img src={team.logo} width={14} height={14} alt=""
              style={{ objectFit: "contain", flexShrink: 0, filter: team.lose ? "grayscale(70%) opacity(0.45)" : "none" }} />
          )}
          <span style={{
            fontSize: 11, flex: 1, fontWeight: team.win ? 700 : 400,
            color: team.win ? "#fff" : team.lose ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.75)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{team.name}</span>
          {(s.winsA + s.winsB > 0) && (
            <span style={{
              fontSize: 13, fontWeight: 800, minWidth: 13, textAlign: "center", flexShrink: 0,
              color: team.win ? "#fff" : team.lose ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)",
            }}>{team.wins}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function EmptySlot() {
  return (
    <div style={{
      borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.02)", height: 72,
    }} />
  )
}

// Algorithme d'appariement : retrouve les 2 séries du round précédent dont les vainqueurs
// se retrouvent en duel dans le round suivant.
function buildPairs(
  prevRound: PlayoffSeries[],
  nextRound: PlayoffSeries[]
): Array<[PlayoffSeries | null, PlayoffSeries | null]> {
  const pairs: Array<[PlayoffSeries | null, PlayoffSeries | null]> = []
  const usedKeys = new Set<string>()

  for (const next of nextRound) {
    const prevA = prevRound.find(p => p.teamA === next.teamA || p.teamB === next.teamA)
    const prevB = prevRound.find(p => p.teamA === next.teamB || p.teamB === next.teamB)
    pairs.push([prevA ?? null, prevB ?? null])
    if (prevA) usedKeys.add(`${prevA.teamA}|${prevA.teamB}`)
    if (prevB) usedKeys.add(`${prevB.teamA}|${prevB.teamB}`)
  }

  const remaining = prevRound.filter(p => !usedKeys.has(`${p.teamA}|${p.teamB}`))
  for (let i = 0; i < remaining.length; i += 2) {
    pairs.push([remaining[i] ?? null, remaining[i + 1] ?? null])
  }

  return pairs
}

// Contenu d'une conférence pour un round (séries groupées par paires)
function ConfContent({ series, roundName, nextSeries }: {
  series: PlayoffSeries[]
  roundName: string
  nextSeries: PlayoffSeries[]
}) {
  const maxCount = ROUND_SIZE[roundName] ?? 1

  if (maxCount === 4) {
    const pairs = buildPairs(series, nextSeries)
    while (pairs.length < 2) pairs.push([null, null])
    return (
      <div style={{ display: "flex", gap: PAIR_GAP }}>
        {pairs.slice(0, 2).map(([a, b], pi) => (
          <div key={pi} style={{ flex: 1, display: "flex", gap: 4 }}>
            <div style={{ flex: 1 }}>{a ? <SeriesCard s={a} /> : <EmptySlot />}</div>
            <div style={{ flex: 1 }}>{b ? <SeriesCard s={b} /> : <EmptySlot />}</div>
          </div>
        ))}
      </div>
    )
  }

  if (maxCount === 2) {
    const pairs = buildPairs(series, nextSeries)
    const pair = pairs[0] ?? [null, null]
    return (
      <div style={{ display: "flex", gap: PAIR_GAP }}>
        <div style={{ flex: 1 }}>{pair[0] ? <SeriesCard s={pair[0]} /> : <EmptySlot />}</div>
        <div style={{ flex: 1 }}>{pair[1] ? <SeriesCard s={pair[1]} /> : <EmptySlot />}</div>
      </div>
    )
  }

  // 1 série : Finale de Conférence — centrée
  return (
    <div style={{ display: "flex", padding: "0 22%" }}>
      <div style={{ flex: 1 }}>{series[0] ? <SeriesCard s={series[0]} /> : <EmptySlot />}</div>
    </div>
  )
}

export default function VerticalPlayoffBracket({
  rounds,
  finalLabel = "FINALE",
  emptyMsg,
}: {
  rounds: PlayoffRound[]
  finalLabel?: string
  emptyMsg?: string
}) {
  const roundMap = new Map(rounds.map(r => [r.name, r]))
  const finalsRound = rounds.find(r => r.series.some(s => s.conference === 'Finals'))
  const hasAnyData = rounds.some(r => r.series.length > 0)

  if (!hasAnyData) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "#64748b", background: "#0f1117" }}>
        {emptyMsg ?? "Données non disponibles."}
      </div>
    )
  }

  return (
    <div style={{ background: "#0f1117", overflowX: "auto" }}>
      {/*
        Grille CSS à 3 colonnes : [EST (1fr)] [séparateur 2px] [OUEST (1fr)]
        TOUTES les lignes utilisent cette même grille → alignement garanti.
      */}
      <div style={{
        minWidth: 800,
        padding: "14px 12px 24px",
        display: "grid",
        gridTemplateColumns: "1fr 2px 1fr",
        columnGap: 0,
        rowGap: 0,
      }}>

        {/* ── Ligne 1 : Bandeaux de conférence ── */}
        <div style={{
          padding: "6px 8px", borderRadius: "7px 0 0 7px",
          border: "1px solid rgba(59,130,246,0.35)", borderRight: "none",
          background: "rgba(59,130,246,0.1)", textAlign: "center",
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: ".09em" }}>
            CONFÉRENCE EST
          </span>
        </div>
        {/* Séparateur vertical — s'étend sur toutes les lignes */}
        <div style={{
          gridRow: "1 / span 100",
          background: "rgba(255,255,255,0.1)",
          margin: "0 8px",
        }} />
        <div style={{
          padding: "6px 8px", borderRadius: "0 7px 7px 0",
          border: "1px solid rgba(239,68,68,0.35)", borderLeft: "none",
          background: "rgba(239,68,68,0.1)", textAlign: "center",
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: ".09em" }}>
            CONFÉRENCE OUEST
          </span>
        </div>

        {/* ── Rounds de conférence ── */}
        {CONF_ROUNDS.map((roundName, ri) => {
          const eastSeries = (roundMap.get(roundName)?.series ?? []).filter(s => s.conference === 'East')
          const westSeries = (roundMap.get(roundName)?.series ?? []).filter(s => s.conference === 'West')
          const nextRoundName = CONF_ROUNDS[ri + 1]
          const nextEast = nextRoundName ? (roundMap.get(nextRoundName)?.series ?? []).filter(s => s.conference === 'East') : []
          const nextWest = nextRoundName ? (roundMap.get(nextRoundName)?.series ?? []).filter(s => s.conference === 'West') : []

          return [
            // Étiquette du round — pleine largeur (span les 3 colonnes)
            <div key={`label-${roundName}`} style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "12px 0 8px",
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "#475569", textTransform: "uppercase" }}>
                {ROUND_LABEL[roundName] ?? roundName}
              </span>
            </div>,

            // EST content — colonne 1
            <div key={`east-${roundName}`} style={{ paddingRight: 8 }}>
              <ConfContent series={eastSeries} roundName={roundName} nextSeries={nextEast} />
            </div>,

            // WEST content — colonne 3 (colonne 2 = séparateur déjà positionné via gridRow)
            <div key={`west-${roundName}`} style={{ paddingLeft: 8 }}>
              <ConfContent series={westSeries} roundName={roundName} nextSeries={nextWest} />
            </div>,
          ]
        })}

        {/* ── Finale NBA / Stanley Cup — pleine largeur ── */}
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "12px 0 8px" }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "#f59e0b", textTransform: "uppercase" }}>
            ⭐ {finalLabel}
          </span>
        </div>
        <div style={{ gridColumn: "1 / -1", maxWidth: 280, margin: "0 auto", width: "100%" }}>
          {finalsRound?.series[0]
            ? <SeriesCard s={finalsRound.series[0]} />
            : <EmptySlot />
          }
        </div>

        {/* ── Légende — pleine largeur ── */}
        <div style={{
          gridColumn: "1 / -1",
          display: "flex", gap: 16, marginTop: 18, paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)", justifyContent: "center", flexWrap: "wrap",
        }}>
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
    </div>
  )
}
