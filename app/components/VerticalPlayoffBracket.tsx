"use client"

import { useState, useEffect, useMemo } from "react"

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
const ALL_ROUND_KEYS = ["1/8 de finale", "Quarts de finale", "Demi-finales", "Finale"]

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

// ── Enrichissement `done` ─────────────────────────────────────
// Si une équipe d'une série apparaît dans un round ultérieur, sa série est terminée.
// Si le score est incomplet (ni l'un ni l'autre n'a 4 victoires), on fixe le gagnant à 4.
function enrichDone(rounds: PlayoffRound[]): PlayoffRound[] {
  const roundMap = new Map(rounds.map(r => [r.name, r]))

  return rounds.map(round => {
    const ri = ALL_ROUND_KEYS.indexOf(round.name)
    if (ri < 0 || ri >= ALL_ROUND_KEYS.length - 1) return round

    const laterTeams = new Set<string>()
    for (let li = ri + 1; li < ALL_ROUND_KEYS.length; li++) {
      const lr = roundMap.get(ALL_ROUND_KEYS[li])
      if (lr) lr.series.forEach(s => { laterTeams.add(s.teamA); laterTeams.add(s.teamB) })
    }

    return {
      ...round,
      series: round.series.map(s => {
        const aInNext = laterTeams.has(s.teamA)
        const bInNext = laterTeams.has(s.teamB)
        const isDone = s.done || s.winsA >= 4 || s.winsB >= 4 || aInNext || bInNext
        if (!isDone) return s
        let { winsA, winsB } = s
        if (winsA < 4 && winsB < 4) {
          if (aInNext) winsA = 4
          else if (bInNext) winsB = 4
        }
        return { ...s, done: true, winsA, winsB }
      }),
    }
  })
}

// ── Remplissage automatique des finales ───────────────────────
// Crée des séries synthétiques "gagnant vs À déterminer" pour les rounds
// dont l'API n'a pas encore de données.
function getSeriesWinner(s: PlayoffSeries): { name: string; badge: string } | null {
  if (!s.done) return null
  return s.winsA > s.winsB
    ? { name: s.teamA, badge: s.badgeA }
    : { name: s.teamB, badge: s.badgeB }
}

const TBD = "À déterminer"

function buildSyntheticSeries(enrichedRounds: PlayoffRound[]): PlayoffRound[] {
  const rounds = enrichedRounds.map(r => ({ ...r, series: [...r.series] }))
  const mutableMap = new Map(rounds.map(r => [r.name, r]))

  function getOrCreate(name: string): PlayoffRound {
    if (!mutableMap.has(name)) {
      const r: PlayoffRound = { name, series: [] }
      rounds.push(r)
      mutableMap.set(name, r)
    }
    return mutableMap.get(name)!
  }

  // 1. Quarts de finale → Demi-finales (Finale de Conférence)
  const sfRound = mutableMap.get("Quarts de finale")
  if (sfRound) {
    const cfRound = getOrCreate("Demi-finales")

    for (const conf of ['East', 'West'] as const) {
      const sfSeries = sfRound.series.filter(s => s.conference === conf)
      const winners = sfSeries.map(getSeriesWinner).filter(Boolean) as { name: string; badge: string }[]

      // Équipes déjà présentes dans les conf finals pour cette conférence
      const cfSeries = cfRound.series.filter(s => s.conference === conf)
      const cfTeams = new Set(cfSeries.flatMap(s => [s.teamA, s.teamB]))
      const newWinners = winners.filter(w => !cfTeams.has(w.name))

      if (newWinners.length === 0 || cfSeries.length > 0) continue

      if (newWinners.length >= 2) {
        cfRound.series.push({
          teamA: newWinners[0].name, teamB: newWinners[1].name,
          badgeA: newWinners[0].badge, badgeB: newWinners[1].badge,
          winsA: 0, winsB: 0, games: 0, done: false, conference: conf,
        })
      } else {
        cfRound.series.push({
          teamA: newWinners[0].name, teamB: TBD,
          badgeA: newWinners[0].badge, badgeB: "",
          winsA: 0, winsB: 0, games: 0, done: false, conference: conf,
        })
      }
    }
  }

  // 2. Demi-finales → Finale NBA
  const cfRound = mutableMap.get("Demi-finales")
  if (cfRound) {
    const finalsRound = getOrCreate("Finale")
    const existingFinals = finalsRound.series.filter(s => s.conference === 'Finals')
    if (existingFinals.length === 0) {
      const eastWinner = cfRound.series.filter(s => s.conference === 'East').map(getSeriesWinner).find(Boolean) ?? null
      const westWinner = cfRound.series.filter(s => s.conference === 'West').map(getSeriesWinner).find(Boolean) ?? null

      if (eastWinner || westWinner) {
        const a = eastWinner ?? { name: TBD, badge: "" }
        const b = westWinner ?? { name: TBD, badge: "" }
        finalsRound.series.push({
          teamA: a.name, teamB: b.name,
          badgeA: a.badge, badgeB: b.badge,
          winsA: 0, winsB: 0, games: 0, done: false, conference: 'Finals',
        })
      }
    }
  }

  return rounds
}

// ── Utilitaires logo ──────────────────────────────────────────
function proxyLogo(url: string | null | undefined) {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

// ── Carte de série ────────────────────────────────────────────
function SeriesCard({ s, dark }: { s: PlayoffSeries; dark: boolean }) {
  const logoA = proxyLogo(s.badgeA)
  const logoB = proxyLogo(s.badgeB)
  const aWins = s.done && s.winsA > s.winsB
  const bWins = s.done && s.winsB > s.winsA
  const inProgress = !s.done && s.games > 0

  const bg       = dark ? "#1a1d27" : "#ffffff"
  const border   = inProgress
    ? "rgba(239,68,68,0.55)"
    : dark ? "rgba(255,255,255,0.09)" : "#e2e8f0"
  const divider  = dark ? "rgba(255,255,255,0.07)" : "#f1f5f9"
  const winBg    = dark ? "rgba(37,99,235,0.22)"   : "rgba(37,99,235,0.08)"

  const textFor = (win: boolean, lose: boolean, tbd: boolean) => {
    if (tbd)  return dark ? "rgba(255,255,255,0.28)" : "#cbd5e1"
    if (win)  return dark ? "#fff" : "#0f172a"
    if (lose) return dark ? "rgba(255,255,255,0.28)" : "#94a3b8"
    return dark ? "rgba(255,255,255,0.82)" : "#334155"
  }

  const scoreFor = (win: boolean, lose: boolean) => {
    if (win)  return dark ? "#fff" : "#0f172a"
    if (lose) return dark ? "rgba(255,255,255,0.2)" : "#cbd5e1"
    return dark ? "rgba(255,255,255,0.55)" : "#64748b"
  }

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 8, background: bg, overflow: "hidden", width: "100%" }}>
      {inProgress && <div style={{ height: 2, background: "linear-gradient(90deg,#ef4444,#f97316)" }} />}
      {([
        { name: s.teamA, logo: logoA, wins: s.winsA, win: aWins, lose: bWins },
        { name: s.teamB, logo: logoB, wins: s.winsB, win: bWins, lose: aWins },
      ] as const).map((team, i) => {
        const isTbd = team.name === TBD
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 7px",
            borderBottom: i === 0 ? `1px solid ${divider}` : "none",
            background: team.win ? winBg : "transparent",
          }}>
            {team.logo && !isTbd && (
              <img src={team.logo} width={14} height={14} alt=""
                style={{ objectFit: "contain", flexShrink: 0, filter: team.lose ? "grayscale(70%) opacity(0.45)" : "none" }} />
            )}
            {!team.logo && !isTbd && <div style={{ width: 14, flexShrink: 0 }} />}
            <span style={{
              fontSize: 11, flex: 1, minWidth: 0,
              fontWeight: team.win ? 700 : 400,
              fontStyle: isTbd ? "italic" : "normal",
              color: textFor(team.win, team.lose, isTbd),
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{team.name}</span>
            {(s.winsA + s.winsB > 0) && !isTbd && (
              <span style={{
                fontSize: 13, fontWeight: 800, minWidth: 13, textAlign: "center", flexShrink: 0,
                color: scoreFor(team.win, team.lose),
              }}>{team.wins}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function EmptySlot({ dark, height = 72 }: { dark: boolean; height?: number }) {
  return (
    <div style={{
      borderRadius: 8,
      border: `1px dashed ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
      background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc",
      height,
    }} />
  )
}

// ── Appariement séries ────────────────────────────────────────
function buildPairs(prev: PlayoffSeries[], next: PlayoffSeries[]): Array<[PlayoffSeries | null, PlayoffSeries | null]> {
  const pairs: Array<[PlayoffSeries | null, PlayoffSeries | null]> = []
  const used = new Set<string>()
  for (const nx of next) {
    const a = prev.find(p => p.teamA === nx.teamA || p.teamB === nx.teamA)
    const b = prev.find(p => p.teamA === nx.teamB || p.teamB === nx.teamB)
    pairs.push([a ?? null, b ?? null])
    if (a) used.add(`${a.teamA}|${a.teamB}`)
    if (b) used.add(`${b.teamA}|${b.teamB}`)
  }
  const rem = prev.filter(p => !used.has(`${p.teamA}|${p.teamB}`))
  for (let i = 0; i < rem.length; i += 2) pairs.push([rem[i] ?? null, rem[i + 1] ?? null])
  return pairs
}

// ── Contenu d'un round pour une conférence ────────────────────
function RoundContent({ series, roundName, nextSeries, dark }: {
  series: PlayoffSeries[]
  roundName: string
  nextSeries: PlayoffSeries[]
  dark: boolean
}) {
  const maxCount = ROUND_SIZE[roundName] ?? 1

  if (maxCount === 4) {
    const pairs = buildPairs(series, nextSeries)
    while (pairs.length < 2) pairs.push([null, null])
    return (
      <div style={{ display: "flex", gap: 4, minWidth: 0 }}>
        {pairs.slice(0, 2).map(([a, b], pi) => (
          <div key={pi} style={{ flex: 1, minWidth: 0, display: "flex", gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>{a ? <SeriesCard s={a} dark={dark} /> : <EmptySlot dark={dark} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>{b ? <SeriesCard s={b} dark={dark} /> : <EmptySlot dark={dark} />}</div>
          </div>
        ))}
      </div>
    )
  }

  if (maxCount === 2) {
    // Afficher les 2 séries directement — pas de buildPairs pour éviter de perdre
    // des séries quand le round suivant contient un placeholder "À déterminer"
    const items: (PlayoffSeries | null)[] = series.length > 0 ? [...series] : [null, null]
    while (items.length < 2) items.push(null)
    return (
      <div style={{ display: "flex", gap: 4, minWidth: 0 }}>
        {items.slice(0, 2).map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0 }}>
            {s ? <SeriesCard s={s} dark={dark} /> : <EmptySlot dark={dark} />}
          </div>
        ))}
      </div>
    )
  }

  return series[0] ? <SeriesCard s={series[0]} dark={dark} /> : <EmptySlot dark={dark} />
}

// ── MOBILE ────────────────────────────────────────────────────
function MobileBracket({ roundMap, finalsRound, finalLabel, dark }: {
  roundMap: Map<string, PlayoffRound>
  finalsRound: PlayoffRound | undefined
  finalLabel: string
  dark: boolean
}) {
  const [conf, setConf] = useState<'East' | 'West'>('East')
  const bg = dark ? "#0f1117" : "var(--bg-muted)"

  return (
    <div style={{ background: bg, padding: "12px 12px 24px" }}>
      <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`, marginBottom: 14 }}>
        {(['East', 'West'] as const).map(c => {
          const active = conf === c
          const color = c === 'East' ? "#3b82f6" : "#ef4444"
          return (
            <button key={c} onClick={() => setConf(c)} style={{
              flex: 1, padding: "9px 8px", border: "none", cursor: "pointer",
              background: active ? color : "transparent",
              color: active ? "#fff" : dark ? "rgba(255,255,255,0.45)" : "#94a3b8",
              fontSize: 10, fontWeight: 800, letterSpacing: ".09em",
              transition: "background .15s, color .15s",
            }}>
              {c === 'East' ? "CONFÉRENCE EST" : "CONFÉRENCE OUEST"}
            </button>
          )
        })}
      </div>

      {CONF_ROUNDS.map((roundName, ri) => {
        const confSeries = (roundMap.get(roundName)?.series ?? []).filter(s => s.conference === conf)
        const nextRoundName = CONF_ROUNDS[ri + 1]
        const nextConf = nextRoundName ? (roundMap.get(nextRoundName)?.series ?? []).filter(s => s.conference === conf) : []
        return (
          <div key={roundName} style={{ marginBottom: 8 }}>
            <div style={{ textAlign: "center", padding: "8px 0 5px" }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".12em", color: dark ? "#475569" : "#94a3b8" }}>
                {ROUND_LABEL[roundName] ?? roundName}
              </span>
            </div>
            <RoundContent series={confSeries} roundName={roundName} nextSeries={nextConf} dark={dark} />
          </div>
        )
      })}

      <div style={{ textAlign: "center", padding: "12px 0 6px" }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "#f59e0b" }}>⭐ {finalLabel}</span>
      </div>
      {finalsRound?.series[0] ? <SeriesCard s={finalsRound.series[0]} dark={dark} /> : <EmptySlot dark={dark} />}

      <Legend dark={dark} />
    </div>
  )
}

// ── DESKTOP ───────────────────────────────────────────────────
function DesktopBracket({ roundMap, finalsRound, finalLabel, dark }: {
  roundMap: Map<string, PlayoffRound>
  finalsRound: PlayoffRound | undefined
  finalLabel: string
  dark: boolean
}) {
  const bg         = dark ? "#0f1117"  : "var(--bg-muted)"
  const sepColor   = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"
  const labelColor = dark ? "#475569"  : "#94a3b8"

  return (
    <div style={{ background: bg, padding: "14px 12px 24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 12 }}>

        {/* Bandeaux */}
        <div style={{ padding: "6px 10px", borderRadius: 7, textAlign: "center", border: "1px solid rgba(59,130,246,0.4)", background: dark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.07)", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: ".1em" }}>CONFÉRENCE EST</span>
        </div>
        <div style={{ padding: "6px 10px", borderRadius: 7, textAlign: "center", border: "1px solid rgba(239,68,68,0.4)", background: dark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.07)", marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: ".1em" }}>CONFÉRENCE OUEST</span>
        </div>

        <div style={{ gridColumn: "1 / -1", height: 1, background: sepColor, marginBottom: 8 }} />

        {/* Rounds */}
        {CONF_ROUNDS.map((roundName, ri) => {
          const eastSeries = (roundMap.get(roundName)?.series ?? []).filter(s => s.conference === 'East')
          const westSeries = (roundMap.get(roundName)?.series ?? []).filter(s => s.conference === 'West')
          const nextRoundName = CONF_ROUNDS[ri + 1]
          const nextEast = nextRoundName ? (roundMap.get(nextRoundName)?.series ?? []).filter(s => s.conference === 'East') : []
          const nextWest = nextRoundName ? (roundMap.get(nextRoundName)?.series ?? []).filter(s => s.conference === 'West') : []

          return [
            <div key={`lbl-${roundName}`} style={{ gridColumn: "1 / -1", textAlign: "center", padding: "10px 0 6px" }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: labelColor, textTransform: "uppercase" }}>
                {ROUND_LABEL[roundName] ?? roundName}
              </span>
            </div>,
            <div key={`e-${roundName}`} style={{ minWidth: 0, paddingRight: 4 }}>
              <RoundContent series={eastSeries} roundName={roundName} nextSeries={nextEast} dark={dark} />
            </div>,
            <div key={`w-${roundName}`} style={{ minWidth: 0, paddingLeft: 4 }}>
              <RoundContent series={westSeries} roundName={roundName} nextSeries={nextWest} dark={dark} />
            </div>,
          ]
        })}

        <div style={{ gridColumn: "1 / -1", height: 1, background: sepColor, margin: "10px 0 0" }} />

        {/* Finale NBA — au centre, à la jonction */}
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 4px", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", color: "#f59e0b", textTransform: "uppercase" }}>
            ⭐ {finalLabel}
          </span>
          <div style={{ display: "flex", width: "55%", alignItems: "center" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(245,158,11,0.3)" }} />
            <div style={{ flex: 1, height: 1, background: "rgba(245,158,11,0.3)" }} />
          </div>
          <div style={{ width: "40%", minWidth: 200, maxWidth: 300 }}>
            {finalsRound?.series[0] ? <SeriesCard s={finalsRound.series[0]} dark={dark} /> : <EmptySlot dark={dark} height={60} />}
          </div>
        </div>

      </div>
      <Legend dark={dark} />
    </div>
  )
}

function Legend({ dark }: { dark: boolean }) {
  const color = dark ? "#475569" : "#94a3b8"
  return (
    <div style={{ display: "flex", gap: 16, paddingTop: 12, marginTop: 12, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"}`, justifyContent: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(37,99,235,0.18)", border: "1px solid rgba(59,130,246,0.4)" }} />
        <span style={{ fontSize: 10, color }}>Qualifié (4 victoires)</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 22, height: 2, background: "linear-gradient(90deg,#ef4444,#f97316)", borderRadius: 1 }} />
        <span style={{ fontSize: 10, color }}>Série en cours</span>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function VerticalPlayoffBracket({
  rounds,
  finalLabel = "FINALE",
  emptyMsg,
}: {
  rounds: PlayoffRound[]
  finalLabel?: string
  emptyMsg?: string
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 620)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Synchronisation avec le thème de l'app (classe `dark` sur <html>)
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  const enrichedRounds  = useMemo(() => enrichDone(rounds), [rounds])
  const syntheticRounds = useMemo(() => buildSyntheticSeries(enrichedRounds), [enrichedRounds])
  const roundMap        = useMemo(() => new Map(syntheticRounds.map(r => [r.name, r])), [syntheticRounds])
  const finalsRound     = syntheticRounds.find(r => r.series.some(s => s.conference === 'Finals'))
  const hasAnyData      = syntheticRounds.some(r => r.series.length > 0)

  if (!hasAnyData) {
    return (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-muted)" }}>
        {emptyMsg ?? "Données non disponibles."}
      </div>
    )
  }

  const props = { roundMap, finalsRound, finalLabel, dark }
  return isMobile ? <MobileBracket {...props} /> : <DesktopBracket {...props} />
}
