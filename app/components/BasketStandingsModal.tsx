"use client";

import { useState, useEffect } from "react";

interface BRow {
  position: number
  team: { id: number; name: string; logo: string }
  gamesPlayed: number; wins: number; loses: number
  scoredPoints: number; receivedPoints: number; pct: string
}
interface BGroup { name: string; standings: BRow[] }

const COLS = "22px 1fr 30px 28px 28px 58px 52px"

function proxyLogo(url: string) { return `/api/logo?url=${encodeURIComponent(url)}` }

export default function BasketStandingsModal({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const [open, setOpen]       = useState(false)
  const [groups, setGroups]   = useState<BGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [activeGroup, setActive] = useState(0)

  useEffect(() => {
    if (!open || groups.length > 0) return
    setLoading(true)
    fetch(`/api/basketball-standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => { setGroups(d.groups ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, leagueId, groups.length])

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        display:'flex',alignItems:'center',gap:6,padding:'7px 14px',
        border:'1px solid #e2e8f0',borderRadius:8,background:'#fff',
        cursor:'pointer',fontSize:13,fontWeight:600,color:'#475569',whiteSpace:'nowrap',
      }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563eb';e.currentTarget.style.color='#2563eb'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.color='#475569'}}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        Classement
      </button>

      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:100}}/>}

      {open && (
        <div style={{position:'fixed',top:0,right:0,width:'min(640px,100vw)',height:'100vh',background:'#fff',zIndex:101,display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.12)'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid #f1f5f9',position:'sticky',top:0,background:'#fff',zIndex:1}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Classement</div>
              <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{leagueName} · 2025-2026</div>
            </div>
            <button onClick={()=>setOpen(false)} style={{width:32,height:32,borderRadius:8,border:'1px solid #f1f5f9',background:'#f8fafc',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#64748b'}}>✕</button>
          </div>

          {loading ? (
            <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}>Chargement...</div>
          ) : !groups.length ? (
            <div style={{padding:48,textAlign:'center',color:'#94a3b8'}}>Classement non disponible.</div>
          ) : (
            <>
              {/* Sélecteur de conférence/groupe */}
              {groups.length > 1 && (
                <div style={{display:'flex',gap:4,padding:'10px 16px',overflowX:'auto',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
                  {groups.map((g,i) => (
                    <button key={i} onClick={()=>setActive(i)} style={{
                      padding:'5px 12px',borderRadius:6,border:'1px solid',cursor:'pointer',whiteSpace:'nowrap',
                      borderColor:activeGroup===i?'#2563eb':'#e2e8f0',
                      background:activeGroup===i?'#eff6ff':'#fff',
                      color:activeGroup===i?'#2563eb':'#64748b',
                      fontSize:11,fontWeight:activeGroup===i?700:500,
                    }}>{g.name}</button>
                  ))}
                </div>
              )}
              {/* En-tête colonnes — style FlashScore NBA */}
              <div style={{display:'grid',gridTemplateColumns:COLS,padding:'8px 16px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9',fontSize:10,fontWeight:700,color:'#94a3b8',letterSpacing:'.05em',textTransform:'uppercase'}}>
                <span>#</span>
                <span>Équipe</span>
                <span style={{textAlign:'center'}}>MJ</span>
                <span style={{textAlign:'center',color:'#22c55e'}}>V</span>
                <span style={{textAlign:'center',color:'#dc2626'}}>D</span>
                <span style={{textAlign:'center'}}>PT</span>
                <span style={{textAlign:'center',color:'#2563eb'}}>PCT</span>
              </div>
              {/* Lignes */}
              {(groups[activeGroup]?.standings ?? []).map((row, idx) => {
                const logo = proxyLogo(row.team.logo)
                return (
                  <div key={row.team.id ?? idx} style={{display:'grid',gridTemplateColumns:COLS,padding:'7px 16px',alignItems:'center',borderBottom:'1px solid #f8fafc',background:'#fff'}}>
                    <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>{row.position}</span>
                    <div style={{display:'flex',alignItems:'center',gap:7,overflow:'hidden'}}>
                      <img src={logo} alt={row.team.name} width={16} height={16} style={{objectFit:'contain',flexShrink:0}}/>
                      <span style={{fontSize:11,fontWeight:500,color:'#1e293b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.team.name}</span>
                    </div>
                    <span style={{textAlign:'center',fontSize:11,color:'#475569'}}>{row.gamesPlayed}</span>
                    <span style={{textAlign:'center',fontSize:11,color:'#22c55e',fontWeight:600}}>{row.wins}</span>
                    <span style={{textAlign:'center',fontSize:11,color:'#dc2626',fontWeight:600}}>{row.loses}</span>
                    <span style={{textAlign:'center',fontSize:10,color:'#64748b'}}>{row.scoredPoints}:{row.receivedPoints}</span>
                    <span style={{textAlign:'center',fontSize:12,fontWeight:700,color:'#0f172a'}}>{row.pct}</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </>
  )
}
