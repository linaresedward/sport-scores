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

// Series per conference per round (NBA & NHL structure: 4 → 2 → 1)
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

const LINE = "rgba(255,255,255,0.18)"

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
          display: "flex", alignItems: "center", gap: 6, padding: "7px 8px",
          borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
          background: team.win ? "rgba(37,99,235,0.22)" : "transparent",
        }}>
          {team.logo && (
            <img src={team.logo} width={16} height={16} alt=""
              style={{ objectFit: "contain", flexShrink: 0, filter: team.lose ? "grayscale(70%) opacity(0.45)" : "none" }} />
          )}
          <span style={{
            fontSize: 11, flex: 1, fontWeight: team.win ? 700 : 400,
            color: team.win ? "#fff" : team.lose ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.75)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{team.name}</span>
          {(s.winsA + s.winsB > 0) && (
            <span style={{
              fontSize: 14, fontWeight: 800, minWidth: 14, textAlign: "center", flexShrink: 0,
              color: team.win ? "#fff" : team.lose ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)",
            }}>{team.wins}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function EmptySlot({ height = 72 }: { height?: number }) {
  return (
    <div style={{
      borderRadius: 8, border: "1px dashed rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.02)", height,
    }} />
  )
}

// Connector: N series (per conf) → N/2 series (creates └─┘ shapes)
function Connector({ count }: { count: number }) {
  const pairs = Math.floor(count / 2)
  return (
    <div style={{ display: "flex", height: 18 }}>
      {Array.from({ length: pairs }).map((_, i) => (
        <div key={i} style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 1, borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }} />
          <div style={{ flex: 1, borderLeft: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }} />
        </div>
      ))}
    </div>
  )
}

// Finals connector: East half └ + West half ┘ → meet at center
function FinalsConnector() {
  return (
    <div style={{ display: "flex", height: 22 }}>
      <div style={{ flex: 1, borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }} />
      <div style={{ flex: 1, borderLeft: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }} />
    </div>
  )
}

function RoundLabel({ text, color = "#475569" }: { text: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 0 8px" }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".13em", color, textTransform: "uppercase" }}>
        {text}
      </span>
    </div>
  )
}

// Largeur minimale par carte selon le nombre de séries dans ce round
const CARD_MIN_W: Record<number, number> = { 4: 90, 2: 140, 1: 200 }

function ConfHalf({ series, maxCount }: { series: PlayoffSeries[]; maxCount: number }) {
  const cardMinW = CARD_MIN_W[maxCount] ?? 90
  return (
    <div style={{ flex: 1, display: "flex", gap: 4 }}>
      {Array.from({ length: maxCount }).map((_, i) => (
        <div key={i} style={{ flex: 1, minWidth: cardMinW }}>
          {series[i] ? <SeriesCard s={series[i]} /> : <EmptySlot />}
        </div>
      ))}
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
  const confRounds = rounds.filter(r => r.series.some(s => s.conference !== 'Finals'))
  const finalsRound = rounds.find(r => r.series.some(s => s.conference === 'Finals'))

  if (!confRounds.length && !finalsRound) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "#64748b", background: "#0f1117" }}>
        {emptyMsg ?? "Données non disponibles."}
      </div>
    )
  }

  return (
    // Conteneur scrollable horizontalement
    <div style={{ background: "#0f1117", overflowX: "auto" }}>
    {/* Wrapper interne à largeur fixe — force le scroll horizontal sur mobile */}
    <div style={{ minWidth: 760, padding: "12px 12px 24px" }}>

      {/* Conference headers */}
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <div style={{
          flex: 1, textAlign: "center", padding: "5px 4px", borderRadius: 6,
          border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#3b82f6", letterSpacing: ".09em" }}>
            CONFÉRENCE EST
          </span>
        </div>
        <div style={{ width: 9, flexShrink: 0 }} />
        <div style={{
          flex: 1, textAlign: "center", padding: "5px 4px", borderRadius: 6,
          border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", letterSpacing: ".09em" }}>
            CONFÉRENCE OUEST
          </span>
        </div>
      </div>

      {/* Conference rounds */}
      {confRounds.map((round, ri) => {
        const east = round.series.filter(s => s.conference === 'East')
        const west = round.series.filter(s => s.conference === 'West')
        const maxPerSide = ROUND_SIZE[round.name] ?? Math.max(east.length, west.length, 1)
        const hasNextConf = ri < confRounds.length - 1

        return (
          <div key={round.name}>
            <RoundLabel text={ROUND_LABEL[round.name] ?? round.name} />

            {/* Series row */}
            <div style={{ display: "flex", gap: 8 }}>
              <ConfHalf series={east} maxCount={maxPerSide} />
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0, alignSelf: "stretch" }} />
              <ConfHalf series={west} maxCount={maxPerSide} />
            </div>

            {/* Connector to next conf round */}
            {hasNextConf && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}><Connector count={maxPerSide} /></div>
                <div style={{ width: 9, flexShrink: 0 }} />
                <div style={{ flex: 1 }}><Connector count={maxPerSide} /></div>
              </div>
            )}

            {/* Connector from conf finals to NBA/Stanley Cup Finals */}
            {!hasNextConf && finalsRound && (
              <FinalsConnector />
            )}
          </div>
        )
      })}

      {/* Finals */}
      {finalsRound?.series[0] && (
        <>
          <RoundLabel text={`⭐ ${finalLabel}`} color="#f59e0b" />
          <div style={{ maxWidth: 280, margin: "0 auto" }}>
            <SeriesCard s={finalsRound.series[0]} />
          </div>
        </>
      )}

      {/* Legend */}
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
