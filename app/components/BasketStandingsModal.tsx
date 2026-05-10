"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────
interface BRow {
  position: number
  team: { id: number; name: string; logo: string }
  gamesPlayed: number; wins: number; loses: number
  scoredPoints: number; receivedPoints: number; pct: string
}
interface BGroup { name: string; standings: BRow[] }
interface BracketSeries {
  teamA: string; teamB: string
  badgeA: string; badgeB: string
  winsA: number; winsB: number
  games: number; done: boolean
}
interface BracketRound { name: string; series: BracketSeries[] }

const STANDINGS_COLS = "22px 1fr 30px 28px 28px 58px 52px"

function proxyLogo(url: string | null | undefined) {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

// ─── Zone couleur NBA ──────────────────────────────────────
// Top 6/conf → direct playoff (bleu), 7-10 → play-in (violet), 11-15 → éliminé
function getZoneNBA(pos: number): { bg: string; border: string } | null {
  if (pos <= 6)  return { bg: "rgba(59,130,246,0.08)",  border: "#3b82f6" }
  if (pos <= 10) return { bg: "rgba(139,92,246,0.08)",  border: "#8b5cf6" }
  return null
}

// ─── Classement (saison régulière) ────────────────────────
function RegularSeasonView({ leagueId }: { leagueId: string }) {
  const [groups, setGroups]   = useState<BGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActive] = useState(0)

  useEffect(() => {
    fetch(`/api/basketball-standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => { setGroups(d.groups ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [leagueId])

  if (loading) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Chargement...</div>
  if (!groups.length) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Non disponible.</div>

  // Groupes de conférence (Western/Eastern) vs divisions
  const confGroups = groups.filter(g => g.name.includes("Conference"))
  const divGroups  = groups.filter(g => !g.name.includes("Conference"))

  const displayGroups = [confGroups, divGroups]
  const [confTab, setConfTab] = useState(0) // 0=conférence, 1=division

  return (
    <>
      {/* Vue Conférence / Division */}
      <div style={{display:"flex",gap:4,padding:"8px 16px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
        {[{label:"Conférence"},{label:"Division"}].map((v,i) => (
          <button key={i} onClick={()=>setConfTab(i)} style={{
            padding:"4px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",
            borderColor:confTab===i?"#2563eb":"#e2e8f0",
            background:confTab===i?"#eff6ff":"#fff",
            color:confTab===i?"#2563eb":"#64748b",
            fontSize:11,fontWeight:confTab===i?700:500,
          }}>{v.label}</button>
        ))}
      </div>

      {/* Sélecteur de groupe */}
      {(confTab===0?confGroups:divGroups).length > 1 && (
        <div style={{display:"flex",gap:4,padding:"8px 16px",overflowX:"auto",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          {(confTab===0?confGroups:divGroups).map((g, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding:"4px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",whiteSpace:"nowrap",
              borderColor:activeGroup===i?"#2563eb":"#e2e8f0",
              background:activeGroup===i?"#eff6ff":"#fff",
              color:activeGroup===i?"#2563eb":"#64748b",
              fontSize:11,fontWeight:activeGroup===i?700:500,
            }}>{g.name.replace("Conference","Conf.").replace("Division","Div.")}</button>
          ))}
        </div>
      )}

      {/* Légende des zones */}
      {confTab === 0 && (
        <div style={{display:"flex",gap:12,padding:"6px 16px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#3b82f6"}}/>
            <span style={{fontSize:10,color:"#64748b"}}>Phase Finale directe (top 6)</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#8b5cf6"}}/>
            <span style={{fontSize:10,color:"#64748b"}}>Promotion-Phase Finale (7-10)</span>
          </div>
        </div>
      )}

      {/* En-tête colonnes */}
      <div style={{display:"grid",gridTemplateColumns:STANDINGS_COLS,padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #f1f5f9",fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:".05em",textTransform:"uppercase"}}>
        <span>#</span><span>Équipe</span>
        <span style={{textAlign:"center"}}>MJ</span>
        <span style={{textAlign:"center",color:"#22c55e"}}>V</span>
        <span style={{textAlign:"center",color:"#dc2626"}}>D</span>
        <span style={{textAlign:"center"}}>PT</span>
        <span style={{textAlign:"center",color:"#2563eb"}}>PCT</span>
      </div>

      {/* Lignes */}
      {((confTab===0?confGroups:divGroups)[activeGroup]?.standings ?? []).map((row, idx) => {
        const logo = proxyLogo(row.team.logo)
        const zone = confTab===0 ? getZoneNBA(row.position) : null
        return (
          <div key={row.team.id ?? idx} style={{
            display:"grid",gridTemplateColumns:STANDINGS_COLS,
            padding:"7px 16px",alignItems:"center",
            borderBottom:"1px solid #f8fafc",
            background: zone ? zone.bg : "#fff",
            borderLeft: zone ? `3px solid ${zone.border}` : "3px solid transparent",
          }}>
            <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{row.position}</span>
            <div style={{display:"flex",alignItems:"center",gap:7,overflow:"hidden"}}>
              {logo && <img src={logo} alt="" width={16} height={16} style={{objectFit:"contain",flexShrink:0}}/>}
              <span style={{fontSize:11,fontWeight:500,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.team.name}</span>
            </div>
            <span style={{textAlign:"center",fontSize:11,color:"#475569"}}>{row.gamesPlayed}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#22c55e",fontWeight:600}}>{row.wins}</span>
            <span style={{textAlign:"center",fontSize:11,color:"#dc2626",fontWeight:600}}>{row.loses}</span>
            <span style={{textAlign:"center",fontSize:10,color:"#64748b"}}>{row.scoredPoints}:{row.receivedPoints}</span>
            <span style={{textAlign:"center",fontSize:12,fontWeight:700,color:"#0f172a"}}>{row.pct}</span>
          </div>
        )
      })}
    </>
  )
}

// ─── Bracket vertical NBA ──────────────────────────────────
function SeriesCard({ s, compact }: { s: BracketSeries; compact?: boolean }) {
  const logoA = proxyLogo(s.badgeA)
  const logoB = proxyLogo(s.badgeB)
  const aWin = s.winsA > s.winsB
  const bWin = s.winsB > s.winsA
  return (
    <div style={{
      border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",
      background:"#fff",minWidth:compact?160:180,maxWidth:compact?180:220,
      boxShadow:"0 1px 3px rgba(0,0,0,0.06)",flexShrink:0,
    }}>
      {[{name:s.teamA,logo:logoA,wins:s.winsA,win:aWin},{name:s.teamB,logo:logoB,wins:s.winsB,win:bWin}].map((team,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderBottom:i===0?"1px solid #f1f5f9":"none",background:team.win?"rgba(59,130,246,0.05)":"transparent"}}>
          {team.logo && <img src={team.logo} width={14} height={14} style={{objectFit:"contain",flexShrink:0}} alt=""/>}
          <span style={{fontSize:10,fontWeight:team.win?700:400,color:team.win?"#0f172a":"#475569",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{team.name}</span>
          {(s.winsA+s.winsB)>0 && <span style={{fontSize:12,fontWeight:800,color:team.win?"#2563eb":"#94a3b8",flexShrink:0}}>{team.wins}</span>}
        </div>
      ))}
    </div>
  )
}

function BracketView({ type }: { type: "playoffs" | "playin" }) {
  const [rounds, setRounds] = useState<BracketRound[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nba-bracket")
      .then(r => r.json())
      .then(d => {
        const allRounds: BracketRound[] = d.rounds ?? []
        if (type === "playin") {
          setRounds(allRounds.filter(r => r.name === "Promotion"))
        } else {
          setRounds(allRounds.filter(r => r.name !== "Promotion"))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type])

  if (loading) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Chargement...</div>
  if (!rounds.length) return <div style={{padding:48,textAlign:"center",color:"#94a3b8"}}>Données non disponibles.</div>

  return (
    <div style={{padding:"16px",overflowX:"auto"}}>
      {rounds.map((round, ri) => (
        <div key={ri} style={{marginBottom:24}}>
          {/* En-tête du round */}
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"#94a3b8",marginBottom:10,paddingLeft:4,borderLeft:"3px solid #2563eb"}}>
            {round.name}
          </div>
          {/* Séries du round en ligne */}
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {round.series.map((s,si) => (
              <SeriesCard key={si} s={s} compact={round.series.length > 4} />
            ))}
          </div>
          {/* Flèche vers le round suivant */}
          {ri < rounds.length - 1 && (
            <div style={{textAlign:"center",margin:"12px 0 0",color:"#94a3b8",fontSize:20}}>↓</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Modal principal ───────────────────────────────────────
export default function BasketStandingsModal({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const [open, setOpen]   = useState(false)
  const [phase, setPhase] = useState<"principal"|"playoffs"|"playin">("principal")

  const isNBA = leagueId === "10996"
  const phases = isNBA
    ? [
        { key: "principal" as const, label: "Principal" },
        { key: "playoffs"  as const, label: "Phase Finale" },
        { key: "playin"    as const, label: "Promotion" },
      ]
    : [{ key: "principal" as const, label: "Principal" }]

  return (
    <>
      <button onClick={()=>setOpen(true)} style={{
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
        <div style={{position:"fixed",top:0,right:0,width:"min(700px,100vw)",height:"100vh",background:"#fff",zIndex:101,display:"flex",flexDirection:"column",overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.12)"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:1}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>Classement</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{leagueName} · 2025-2026</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{width:32,height:32,borderRadius:8,border:"1px solid #f1f5f9",background:"#f8fafc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#64748b"}}>✕</button>
          </div>

          {/* Navigation phases */}
          {phases.length > 1 && (
            <div style={{display:"flex",borderBottom:"2px solid #f1f5f9",padding:"0 16px",flexShrink:0}}>
              {phases.map(p => (
                <button key={p.key} onClick={()=>setPhase(p.key)} style={{
                  padding:"10px 14px",border:"none",cursor:"pointer",background:"transparent",
                  fontSize:12,fontWeight:phase===p.key?700:500,
                  color:phase===p.key?"#ef4444":"#64748b",
                  borderBottom:`2px solid ${phase===p.key?"#ef4444":"transparent"}`,
                  marginBottom:-2,transition:"color .15s",
                }}>{p.label}</button>
              ))}
            </div>
          )}

          {/* Contenu */}
          {phase === "principal" && <RegularSeasonView leagueId={leagueId} />}
          {phase === "playoffs"  && <BracketView type="playoffs" />}
          {phase === "playin"    && <BracketView type="playin" />}
        </div>
      )}
    </>
  )
}
