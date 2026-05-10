"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

function proxyLogo(url?: string | null) {
  if (!url) return null
  return `/api/logo?url=${encodeURIComponent(url)}`
}

function getStatus(desc: string) {
  const map: Record<string,string> = {
    "Not started":"À venir","First quarter":"Q1","Second quarter":"Q2",
    "Third quarter":"Q3","Fourth quarter":"Q4","Half time":"Mi-temps",
    "Over time":"Prolongation","Finished":"Terminé","Finished after over time":"Ap. prol.",
    "Postponed":"Reporté","Cancelled":"Annulé",
  }
  return map[desc] ?? desc
}

function parseQ(val: string | null): [string, string] {
  if (!val) return ["",""]
  const [h,a] = val.split(" - ")
  return [h?.trim()??"",a?.trim()??""]
}

export default function BasketMatchPage() {
  const { id } = useParams<{ id: string }>()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/basketball-match?id=${id}`)
      .then(r => r.json())
      .then(d => { setMatch(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"80px 16px",textAlign:"center",color:"var(--text-muted)"}}>Chargement...</div>
  )
  if (!match) return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"80px 16px",textAlign:"center",color:"var(--text-muted)"}}>
      <div style={{fontSize:40,marginBottom:12}}>🏀</div>
      <p>Match non disponible.</p>
      <Link href="/basketball" style={{color:"var(--accent)",textDecoration:"none",fontWeight:600}}>← Retour au basketball</Link>
    </div>
  )

  const sc = match.state?.score ?? {}
  const [q1h,q1a] = parseQ(sc.q1); const [q2h,q2a] = parseQ(sc.q2)
  const [q3h,q3a] = parseQ(sc.q3); const [q4h,q4a] = parseQ(sc.q4)
  const [oth,ota] = parseQ(sc.overTime)
  const cur = sc.current ? sc.current.split(" - ") : [null,null]
  const hasScore = sc.current != null
  const hs = hasScore ? parseInt(cur[0]) : null
  const as_ = hasScore ? parseInt(cur[1]) : null
  const homeWin = hasScore && hs! > as_!
  const awayWin = hasScore && as_! > hs!
  const homeLogo = proxyLogo(match.homeTeam?.logo)
  const awayLogo = proxyLogo(match.awayTeam?.logo)
  const leagueLogo = proxyLogo(match.league?.logo)
  const status = getStatus(match.state?.description ?? "")
  const isLive = ["First quarter","Second quarter","Third quarter","Fourth quarter","Half time","Over time"].includes(match.state?.description)
  const matchDate = match.date ? new Date(match.date).toLocaleDateString("fr-FR", { weekday:"long", day:"2-digit", month:"long", year:"numeric", timeZone:"Europe/Paris" }) : ""
  const matchTime = match.date ? new Date(match.date).toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit", timeZone:"Europe/Paris" }) : ""

  const quarters = [{lbl:"Q1",h:q1h,a:q1a},{lbl:"Q2",h:q2h,a:q2a},{lbl:"Q3",h:q3h,a:q3a},{lbl:"Q4",h:q4h,a:q4a},...(oth?[{lbl:"OT",h:oth,a:ota}]:[])].filter(q=>q.h||q.a)

  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"24px 20px 80px"}}>
      <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}`}</style>

      {/* Breadcrumb */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:20,fontSize:12,color:"var(--text-muted)"}}>
        <Link href="/basketball" style={{color:"var(--text-muted)",textDecoration:"none"}}>Basketball</Link>
        <span>/</span>
        <span>{match.league?.name}</span>
        <span>/</span>
        <span>{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
      </div>

      {/* Header match */}
      <div style={{background:"var(--bg-surface)",borderRadius:16,border:"1px solid var(--border)",padding:"24px",marginBottom:16,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        {/* Ligue */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,justifyContent:"center"}}>
          {leagueLogo && <Image src={leagueLogo} alt="" width={20} height={20} style={{objectFit:"contain"}} unoptimized />}
          <span style={{fontSize:13,fontWeight:600,color:"var(--text-muted)"}}>{match.league?.name}</span>
        </div>

        {/* Statut */}
        <div style={{textAlign:"center",marginBottom:16}}>
          {isLive ? (
            <span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:999,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",fontSize:12,fontWeight:700,color:"#ef4444"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",animation:"livePulse 1.2s ease-in-out infinite"}}/>
              {status}
            </span>
          ) : (
            <span style={{fontSize:12,fontWeight:600,color:"var(--text-muted)"}}>{matchDate} à {matchTime}</span>
          )}
        </div>

        {/* Équipes + Score */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:16}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            {homeLogo ? <Image src={homeLogo} alt="" width={64} height={64} style={{objectFit:"contain"}} unoptimized /> : <div style={{width:64,height:64,borderRadius:"50%",background:"var(--bg-muted)"}}/>}
            <span style={{fontSize:16,fontWeight:homeWin?800:600,color:homeWin?"var(--text-primary)":"var(--text-secondary)",textAlign:"center"}}>{match.homeTeam?.name}</span>
          </div>
          <div style={{textAlign:"center",minWidth:120}}>
            {hasScore ? (
              <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
                <span style={{fontSize:48,fontWeight:800,color:homeWin?"#2563eb":"var(--text-primary)"}}>{hs}</span>
                <span style={{fontSize:24,color:"var(--text-muted)"}}>–</span>
                <span style={{fontSize:48,fontWeight:800,color:awayWin?"#2563eb":"var(--text-primary)"}}>{as_}</span>
              </div>
            ) : <span style={{fontSize:20,color:"var(--text-muted)",fontWeight:600}}>vs</span>}
            <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>{status}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            {awayLogo ? <Image src={awayLogo} alt="" width={64} height={64} style={{objectFit:"contain"}} unoptimized /> : <div style={{width:64,height:64,borderRadius:"50%",background:"var(--bg-muted)"}}/>}
            <span style={{fontSize:16,fontWeight:awayWin?800:600,color:awayWin?"var(--text-primary)":"var(--text-secondary)",textAlign:"center"}}>{match.awayTeam?.name}</span>
          </div>
        </div>
      </div>

      {/* Scores par quart-temps */}
      {quarters.length > 0 && (
        <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden",marginBottom:16}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border)",fontSize:12,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em"}}>
            Scores par quart-temps
          </div>
          <div style={{display:"grid",gridTemplateColumns:`1fr ${quarters.map(()=>"70px").join(" ")}`,gap:0}}>
            {["Équipe",...quarters.map(q=>q.lbl)].map((h,i)=>(
              <div key={i} style={{padding:"8px 12px",background:"var(--bg-muted)",textAlign:i===0?"left":"center",fontSize:10,fontWeight:700,color:i===quarters.length?"var(--accent)":"var(--text-muted)",letterSpacing:".05em"}}>{h}</div>
            ))}
            {[match.homeTeam?.name,...quarters.map(q=>q.h)].map((v,i)=>(
              <div key={i} style={{padding:"10px 12px",borderTop:"1px solid var(--border)",textAlign:i===0?"left":"center",fontSize:i===0?13:14,fontWeight:i===0?500:700,color:"var(--text-primary)"}}>{v}</div>
            ))}
            {[match.awayTeam?.name,...quarters.map(q=>q.a)].map((v,i)=>(
              <div key={i} style={{padding:"10px 12px",borderTop:"1px solid var(--border)",textAlign:i===0?"left":"center",fontSize:i===0?13:14,fontWeight:i===0?500:700,color:"var(--text-secondary)"}}>{v}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
