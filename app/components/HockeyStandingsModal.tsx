"use client";

import { useState, useEffect } from "react";
import { HorizontalBracket, BracketRound, BracketSeries } from "./PlayoffBracket";

// ─── Types ────────────────────────────────────────────────
interface HockeyRow {
  position: number
  team: { id: number; name: string; logo: string }
  gamesPlayed: number; wins: number; winsOvertime: number
  losesOvertime: number; loses: number
  scoredGoals: number; receivedGoals: number; points: number
}
interface HockeyGroup { name: string; standings: HockeyRow[] }

// TheSportsDB playoff event
interface PlayoffEvent {
  idEvent: string; strHomeTeam: string; strAwayTeam: string
  intHomeScore: string | null; intAwayScore: string | null
  strStatus: string; dateEvent: string; strTimestamp: string
  strHomeTeamBadge: string; strAwayTeamBadge: string
}
interface PlayoffSeries {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: PlayoffEvent[]
}

const STANDINGS_COLS = "22px 1fr 30px 28px 28px 28px 28px 52px 34px"

// Top 8 par conférence → playoffs (bleu)
function getZoneNHL(pos: number, groupName: string): { bg: string; border: string } | null {
  const isConf = groupName.includes("Conference")
  if (!isConf) return null
  if (pos <= 8) return { bg: "rgba(59,130,246,0.06)", border: "#3b82f6" }
  return null
}
const SPORTSDB_NHL  = "4380"
const SPORTSDB_KEY  = "139695"

function proxyLogo(url: string) { return `/api/logo?url=${encodeURIComponent(url)}` }

// ─── Classement (saison régulière) ────────────────────────
function RegularSeasonView({ leagueId }: { leagueId: string }) {
  const [groups, setGroups]     = useState<HockeyGroup[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeGroup, setActive] = useState(0)

  useEffect(() => {
    fetch(`/api/hockey-standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => { setGroups(d.groups ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [leagueId])

  if (loading) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Chargement...</div>
  if (!groups.length) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Classement non disponible.</div>

  const g = groups[activeGroup]
  return (
    <>
      {/* Sélecteur groupe */}
      {groups.length > 1 && (
        <div style={{display:"flex",gap:4,padding:"10px 16px",overflowX:"auto",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          {groups.map((gr, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding:"5px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",whiteSpace:"nowrap",
              borderColor:activeGroup===i?"#2563eb":"#e2e8f0",
              background:activeGroup===i?"#eff6ff":"#fff",
              color:activeGroup===i?"#2563eb":"#64748b",
              fontSize:11,fontWeight:activeGroup===i?700:500,
            }}>{gr.name}</button>
          ))}
        </div>
      )}
      {/* En-tête */}
      <div style={{display:"grid",gridTemplateColumns:STANDINGS_COLS,padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9",fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:".05em",textTransform:"uppercase"}}>
        <span>#</span><span>Équipe</span>
        <span style={{textAlign:"center"}}>MJ</span>
        <span style={{textAlign:"center"}}>V</span>
        <span style={{textAlign:"center",color:"#22c55e"}}>VP</span>
        <span style={{textAlign:"center",color:"#f59e0b"}}>DP</span>
        <span style={{textAlign:"center"}}>D</span>
        <span style={{textAlign:"center"}}>B</span>
        <span style={{textAlign:"center",color:"#2563eb"}}>PTS</span>
      </div>
      {g?.standings.map(row => {
        const regW = row.wins - row.winsOvertime
        const regL = row.loses - row.losesOvertime
        return (
          <div key={row.team.id} style={{display:"grid",gridTemplateColumns:STANDINGS_COLS,padding:"7px 16px",alignItems:"center",borderBottom:"1px solid #f8fafc",background:getZoneNHL(row.position, g?.name??"")?.bg??"#fff",borderLeft:`3px solid ${getZoneNHL(row.position, g?.name??"")?.border??"transparent"}`}}>
            <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{row.position}</span>
            <div style={{display:"flex",alignItems:"center",gap:7,overflow:"hidden"}}>
              <img src={proxyLogo(row.team.logo)} alt={row.team.name} width={16} height={16} style={{objectFit:"contain",flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:500,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.team.name}</span>
            </div>
            <span style={{textAlign:"center",fontSize:11,color:"#475569"}}>{row.gamesPlayed}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#475569"}}>{regW}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#22c55e",fontWeight:600}}>{row.winsOvertime}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#f59e0b",fontWeight:600}}>{row.losesOvertime}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#475569"}}>{regL}</span>
            <span style={{textAlign:"center",fontSize:10,color:"#64748b"}}>{row.scoredGoals}:{row.receivedGoals}</span>
            <span style={{textAlign:"center",fontSize:13,fontWeight:700,color:"#0f172a"}}>{row.points}</span>
          </div>
        )
      })}
      {/* Légende zones + colonnes */}
      <div style={{padding:"12px 16px",borderTop:"1px solid #f1f5f9",display:"flex",gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#3b82f6"}}/>
          <span style={{fontSize:10,color:"#64748b"}}>Qualifié playoffs (top 8/conférence)</span>
        </div>
      </div>
      <div style={{padding:"8px 16px",borderTop:"1px solid #f1f5f9",display:"flex",gap:16,flexWrap:"wrap"}}>
        {[{color:"#22c55e",label:"VP — Victoire en prolongation"},{color:"#f59e0b",label:"DP — Défaite en prolongation"}].map(item => (
          <div key={item.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:item.color}}/>
            <span style={{fontSize:11,color:"#64748b"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── Phase Finale NHL — bracket horizontal ─────────────────
// Dates NHL playoffs 2025-2026
const NHL_R1_START = "2026-04-18"
const NHL_R2_START = "2026-05-01"
const NHL_SF_START = "2026-05-16"
const NHL_FIN_START= "2026-05-30"

function getNHLRound(firstGame: string): string {
  if (firstGame >= NHL_FIN_START) return "Finale Stanley Cup"
  if (firstGame >= NHL_SF_START)  return "Demi-finales"
  if (firstGame >= NHL_R2_START)  return "Quarts de finale"
  if (firstGame >= NHL_R1_START)  return "1/8 de finale"
  return "Qualifications"
}

function PlayoffView({ leagueId }: { leagueId: string }) {
  const [rounds, setRounds]   = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sdbLeague = leagueId === "49291" ? SPORTSDB_NHL : null
    if (!sdbLeague) { setLoading(false); return }

    Promise.all([
      fetch(`https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventspastleague.php?id=${sdbLeague}`).then(r => r.json()),
      fetch(`https://www.thesportsdb.com/api/v1/json/${SPORTSDB_KEY}/eventsnextleague.php?id=${sdbLeague}`).then(r => r.json()),
    ]).then(([past, next]) => {
      const allEvents: PlayoffEvent[] = [...(past.events||[]), ...(next.events||[])]

      // Grouper par paire d'équipes
      const seriesMap = new Map<string, { s: BracketSeries; firstDate: string }>()
      allEvents.forEach(ev => {
        const [tA, tB] = [ev.strHomeTeam, ev.strAwayTeam].sort()
        const key = tA + "|" + tB
        if (!seriesMap.has(key)) {
          seriesMap.set(key, {
            s: { teamA: tA, teamB: tB, badgeA: "", badgeB: "", winsA: 0, winsB: 0, games: 0, done: false },
            firstDate: ev.dateEvent,
          })
        }
        const entry = seriesMap.get(key)!
        const s = entry.s
        s.games++
        if (ev.dateEvent < entry.firstDate) entry.firstDate = ev.dateEvent
        if (!s.badgeA) { s.badgeA = ev.strHomeTeam === tA ? ev.strHomeTeamBadge : ev.strAwayTeamBadge }
        if (!s.badgeB) { s.badgeB = ev.strHomeTeam === tB ? ev.strHomeTeamBadge : ev.strAwayTeamBadge }
        if (ev.intHomeScore !== null && ev.intAwayScore !== null) {
          const hWin = parseInt(ev.intHomeScore) > parseInt(ev.intAwayScore)
          if (hWin) { if (ev.strHomeTeam === tA) s.winsA++; else s.winsB++ }
          else       { if (ev.strAwayTeam === tA) s.winsA++; else s.winsB++ }
        }
        if (s.winsA >= 4 || s.winsB >= 4) s.done = true
      })

      // Filtrer séries playoffs réelles (>= 2 jeux depuis le 1er round)
      const roundsMap = new Map<string, BracketSeries[]>()
      const ROUND_ORDER = ["1/8 de finale","Quarts de finale","Demi-finales","Finale Stanley Cup"]
      ROUND_ORDER.forEach(r => roundsMap.set(r, []))

      seriesMap.forEach(({ s, firstDate }) => {
        if (s.games < 2 || firstDate < NHL_R1_START) return
        const round = getNHLRound(firstDate)
        roundsMap.get(round)?.push(s)
      })

      const result: BracketRound[] = ROUND_ORDER
        .map(name => ({ name, series: (roundsMap.get(name) ?? []).sort((a,b) => b.winsA + b.winsB - a.winsA - a.winsB) }))
        .filter(r => r.series.length > 0)

      setRounds(result)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [leagueId])

  if (loading) return <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>Chargement...</div>
  return <HorizontalBracket rounds={rounds} emptyMsg="Données des playoffs NHL non disponibles." />
}

// ─── Modal principal ───────────────────────────────────────
export default function HockeyStandingsModal({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const [open, setOpen]   = useState(false)
  const [phase, setPhase] = useState<"principal" | "playoffs">("principal")

  const phases = [
    { key: "principal" as const, label: "Principal" },
    { key: "playoffs"  as const, label: "Phase Finale" },
  ]

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
        border:"1px solid #e2e8f0",borderRadius:8,background:"#fff",
        cursor:"pointer",fontSize:13,fontWeight:600,color:"#475569",whiteSpace:"nowrap",
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.color="#2563eb"}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#475569"}}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Classement
      </button>

      {open && <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:100}}/>}

      {open && (
        <div style={{position:"fixed",top:0,right:0,width:"min(680px,100vw)",height:"100vh",background:"#fff",zIndex:101,display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:1}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Classement</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{leagueName} · 2025-2026</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{width:32,height:32,borderRadius:8,border:"1px solid #f1f5f9",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#64748b"}}>✕</button>
          </div>

          {/* Onglets de phase */}
          <div style={{display:"flex",borderBottom:"2px solid #f1f5f9",padding:"0 16px",flexShrink:0}}>
            {phases.map(p => (
              <button key={p.key} onClick={()=>setPhase(p.key)} style={{
                padding:"10px 14px",border:"none",cursor:"pointer",background:"transparent",
                fontSize:12,fontWeight:phase===p.key?700:500,
                color:phase===p.key?"#ef4444":"#64748b",
                borderBottom:`2px solid ${phase===p.key?"#ef4444":"transparent"}`,
                marginBottom:-2,transition:"color .15s,border-color .15s",
              }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Contenu selon la phase */}
          {phase === "principal" && <RegularSeasonView leagueId={leagueId} />}
          {phase === "playoffs"  && <PlayoffView leagueId={leagueId} />}
        </div>
      )}
    </>
  )
}
