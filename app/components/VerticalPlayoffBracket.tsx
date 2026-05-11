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

// Rounds toujours affichés (avec slots vides si données absentes)
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

// Gap entre les deux paires au sein d'une conférence (Round 1 & 2)
const PAIR_GAP = 14

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

function RoundLabel({ text, color = "#475569" }: { text: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color, textTransform: "uppercase" }}>
        {text}
      </span>
    </div>
  )
}

// Affiche les séries d'une conférence pour un round donné
// Round 1 (4 séries) : 2 paires côte à côte | Round 2 (2 séries) : 2 slots | Round 3 (1 série) : centrée
function ConfHalf({ series, roundName }: { series: PlayoffSeries[]; roundName: string }) {
  const maxCount = ROUND_SIZE[roundName] ?? 1

  if (maxCount === 4) {
    return (
      <div style={{ flex: 1, display: "flex", gap: PAIR_GAP }}>
        {/* Paire 1 */}
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ flex: 1 }}>
              {series[i] ? <SeriesCard s={series[i]} /> : <EmptySlot />}
            </div>
          ))}
        </div>
        {/* Paire 2 */}
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {[2, 3].map(i => (
            <div key={i} style={{ flex: 1 }}>
              {series[i] ? <SeriesCard s={series[i]} /> : <EmptySlot />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (maxCount === 2) {
    return (
      <div style={{ flex: 1, display: "flex", gap: PAIR_GAP }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1 }}>
            {series[i] ? <SeriesCard s={series[i]} /> : <EmptySlot />}
          </div>
        ))}
      </div>
    )
  }

  // maxCount === 1 : Finale de Conférence, centrée dans la moitié
  return (
    <div style={{ flex: 1, display: "flex", padding: "0 22%" }}>
      <div style={{ flex: 1 }}>
        {series[0] ? <SeriesCard s={series[0]} /> : <EmptySlot />}
      </div>
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
  // Construire une map pour retrouver les données par nom de round
  const roundMap = new Map(rounds.map(r => [r.name, r]))

  // Toujours afficher les 3 rounds de conférence (avec slots vides si absent)
  const allConfRounds = CONF_ROUNDS.map(name => ({
    name,
    east: (roundMap.get(name)?.series ?? []).filter(s => s.conference === 'East'),
    west: (roundMap.get(name)?.series ?? []).filter(s => s.conference === 'West'),
  }))

  // Finale (NBA / Stanley Cup) - cross-conférence
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
      <div style={{ minWidth: 800, padding: "14px 12px 24px" }}>

        {/* ── Bandeaux de conférence ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 2 }}>
          <div style={{
            flex: 1, textAlign: "center", padding: "6px 8px", borderRadius: 7,
            border: "1px solid rgba(59,130,246,0.35)", background: "rgba(59,130,246,0.1)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: ".09em" }}>
              CONFÉRENCE EST
            </span>
          </div>
          <div style={{
            flex: 1, textAlign: "center", padding: "6px 8px", borderRadius: 7,
            border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.1)",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: ".09em" }}>
              CONFÉRENCE OUEST
            </span>
          </div>
        </div>

        {/* ── Rounds de conférence ── */}
        {allConfRounds.map(round => (
          <div key={round.name}>
            <RoundLabel text={ROUND_LABEL[round.name] ?? round.name} />
            <div style={{ display: "flex", gap: 10 }}>
              <ConfHalf series={round.east} roundName={round.name} />
              <ConfHalf series={round.west} roundName={round.name} />
            </div>
          </div>
        ))}

        {/* ── Finale NBA / Stanley Cup ── */}
        <RoundLabel text={`⭐ ${finalLabel}`} color="#f59e0b" />
        <div style={{ maxWidth: 280, margin: "0 auto" }}>
          {finalsRound?.series[0]
            ? <SeriesCard s={finalsRound.series[0]} />
            : <EmptySlot />
          }
        </div>

        {/* ── Légende ── */}
        <div style={{
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
