'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { HMatch, normalizeStatus } from '@/lib/highlightly'
import { useT } from '@/lib/i18n'
import FavoriteButton from '@/app/components/FavoriteButton'

// ─── Types ─────────────────────────────────────────────────
interface Stat { displayName: string; value: number }
interface TeamStat { team: { id: number; name: string; logo: string }; statistics: Stat[] }
interface TopPlayer {
  name: string; position: string
  statistics: { name: string; value: string | number }[]
}
interface MatchEvent {
  team: { id: number; name: string; logo: string }
  time: string; type: string
  player: string; assist: string | null; substituted: string | null
}
interface HMatchFull extends HMatch {
  venue?:     { city: string; name: string; country: string; capacity: string }
  referee?:   { name: string; nationality: string }
  forecast?:  { status: string | null; temperature: string }
  events?:    MatchEvent[]
  statistics?: TeamStat[]
  predictions?: {
    prematch: { probabilities: { home: string; draw: string; away: string }; description: string }[]
  }
  homeTeam: HMatch['homeTeam'] & { topPlayers?: TopPlayer[] }
  awayTeam: HMatch['awayTeam'] & { topPlayers?: TopPlayer[] }
}

// ─── Helpers ────────────────────────────────────────────────
const COUNTRY_FR: Record<string, string> = {
  "England":"Angleterre","France":"France","Spain":"Espagne","Germany":"Allemagne",
  "Italy":"Italie","Portugal":"Portugal","Netherlands":"Pays-Bas","Belgium":"Belgique",
  "Scotland":"Écosse","Turkey":"Turquie","Brazil":"Brésil","World":"Monde",
}
function translateCountry(name: string, lang: string) {
  return lang === 'fr' ? (COUNTRY_FR[name] ?? name) : name
}
function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit'
  })
}
function formatRound(round: string, t: (k:any)=>string) {
  return round.replace(/Regular Season/i, t('regular_season'))
}
function weatherIcon(s: string | null | undefined) {
  if (!s) return '🌤️'
  const l = s.toLowerCase()
  if (l.includes('sun')||l.includes('clear')) return '☀️'
  if (l.includes('cloud')) return '☁️'
  if (l.includes('rain'))  return '🌧️'
  return '🌤️'
}
function eventIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('goal'))           return '⚽'
  if (t.includes('yellow'))         return '🟨'
  if (t.includes('red'))            return '🟥'
  if (t.includes('substitution'))   return '🔄'
  if (t.includes('missed penalty')) return '❌'
  if (t.includes('penalty'))        return '🎯'
  return '•'
}

// ─── Classement inline (dans le tab) ───────────────────────
function StandingsInline({ leagueId }: { leagueId: string }) {
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch(`/api/standings?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(d => { setStandings(d.groups?.[0]?.standings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [leagueId])

  if (loading) return (
    <div style={{padding:24,textAlign:"center",color:"var(--text-muted)"}}>Chargement...</div>
  )
  if (!standings.length) return (
    <div style={{padding:24,textAlign:"center",color:"var(--text-muted)"}}>Classement non disponible</div>
  )

  return (
    <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
      {/* En-tête */}
      <div style={{
        display:"grid", gridTemplateColumns:"32px 1fr 32px 32px 32px 40px 40px 76px",
        padding:"8px 16px", background:"var(--bg-muted)", borderBottom:"1px solid var(--border)",
        fontSize:11, fontWeight:700, color:"var(--text-muted)",
        letterSpacing:".05em", textTransform:"uppercase",
      }}>
        <span>#</span>
        <span>Équipe</span>
        <span style={{textAlign:"center"}}>MJ</span>
        <span style={{textAlign:"center"}}>G</span>
        <span style={{textAlign:"center"}}>P</span>
        <span style={{textAlign:"center"}}>+/-</span>
        <span style={{textAlign:"center"}}>Pts</span>
        <span style={{textAlign:"center"}}>Forme</span>
      </div>
      {/* Lignes */}
      {standings.map((row: any) => {
        const rank  = parseInt(row.intRank ?? String(row.position ?? 0))
        const name  = row.strTeam ?? row.team?.name ?? ""
        const badge = row.strBadge ?? (row.team?.logo ? `/api/logo?url=${encodeURIComponent(row.team.logo)}` : null)
        const played = row.intPlayed ?? String(row.total?.games ?? "")
        const won    = row.intWin   ?? String(row.total?.wins ?? "")
        const lost   = row.intLoss  ?? String(row.total?.loses ?? "")
        const gd     = row.intGoalDifference
          ? parseInt(row.intGoalDifference)
          : (row.total ? row.total.scoredGoals - row.total.receivedGoals : 0)
        const pts   = row.intPoints ?? String(row.points ?? "")
        const form  = (row.strForm ?? "").split("").slice(0, 5)
        return (
          <div key={row.team?.id ?? rank} style={{
            display:"grid", gridTemplateColumns:"32px 1fr 32px 32px 32px 40px 40px 76px",
            padding:"8px 16px", alignItems:"center", borderBottom:"1px solid var(--border)",
          }}>
            <span style={{fontSize:12,color:"var(--text-muted)",fontWeight:600}}>{rank}</span>
            <div style={{display:"flex",alignItems:"center",gap:6,overflow:"hidden"}}>
              {badge && (
                <img src={badge} width={16} height={16} style={{objectFit:"contain",flexShrink:0}} alt=""/>
              )}
              <span style={{
                fontSize:12,fontWeight:500,color:"var(--text-primary)",
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",
              }}>{name}</span>
            </div>
            <span style={{textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>{played}</span>
            <span style={{textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>{won}</span>
            <span style={{textAlign:"center",fontSize:12,color:"var(--text-secondary)"}}>{lost}</span>
            <span style={{
              textAlign:"center",fontSize:12,fontWeight:600,
              color:gd>0?"#166534":gd<0?"#991b1b":"var(--text-muted)",
            }}>
              {gd>0?`+${gd}`:gd}
            </span>
            <span style={{textAlign:"center",fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{pts}</span>
            {/* Forme */}
            <div style={{display:"flex",gap:2,justifyContent:"center"}}>
              {form.length > 0
                ? form.map((r:string, i:number) => {
                    const color = r==="W"?"#16a34a":r==="L"?"#dc2626":"#f59e0b"
                    const lbl   = r==="W"?"V":r==="L"?"D":"N"
                    return (
                      <div key={i} style={{
                        width:14,height:14,borderRadius:"50%",background:color,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:7,fontWeight:700,color:"#fff",flexShrink:0,
                      }}>{lbl}</div>
                    )
                  })
                : <span style={{fontSize:10,color:"var(--text-muted)"}}>—</span>
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Statut ─────────────────────────────────────────────────
function StatusDisplay({ match }: { match: HMatchFull }) {
  const { t, lang } = useT()
  const status = normalizeStatus(match.state.description)
  const clock  = match.state.clock

  if (status === "NS") {
    const time = new Date(match.date).toLocaleTimeString(lang==='fr'?'fr-FR':'en-GB',{hour:'2-digit',minute:'2-digit'})
    return (
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,fontWeight:700,color:"var(--accent)"}}>{time}</div>
        <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>{t('kickoff')}</div>
      </div>
    )
  }
  if (status === "Match Finished") return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:32,fontWeight:700,color:"var(--text-muted)"}}>FT</div>
      <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>{t('finished')}</div>
    </div>
  )
  if (status === "HT") return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:32,fontWeight:700,color:"#f59e0b"}}>HT</div>
      <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>{t('half_time')}</div>
    </div>
  )

  const isExtra = status === "ET"
  const color   = isExtra ? "#f59e0b" : "#ef4444"
  const pStart  = status==="1H"?0:status==="2H"?45:90
  const pEnd    = status==="1H"?45:status==="2H"?90:120
  const pLabel: Record<string,string> = {
    "1H": t('first_half_long'), "2H": t('second_half_long'), "ET": t('extra_time_long')
  }

  return (
    <div style={{maxWidth:200,margin:"0 auto",textAlign:"center"}}>
      {clock!==null ? (
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:2,marginBottom:4}}>
          <span style={{fontSize:38,fontWeight:700,color,lineHeight:1}}>
            {clock === 90 && status === "2H" ? "90+" :
             clock === 45 && status === "1H" ? "45+" : clock}
          </span>
          <span style={{fontSize:22,fontWeight:700,color}}>′</span>
        </div>
      ) : (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:4}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:color,display:"inline-block",animation:"livePulse 1.2s infinite"}}/>
          <span style={{fontSize:22,fontWeight:700,color}}>{t('live')}</span>
        </div>
      )}
      <div style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>
        {pLabel[status] ?? t('live_label')}
      </div>
      {clock!==null && (
        <>
          <div style={{height:3,background:"rgba(239,68,68,0.15)",borderRadius:999,overflow:"hidden"}}>
            <div style={{height:"100%",background:color,borderRadius:999,
              width:`${Math.min(((Math.min(clock,pEnd)-pStart)/(pEnd-pStart))*100,100)}%`,
              transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:10,color:"var(--text-muted)"}}>{pStart}′</span>
            <span style={{fontSize:10,color:"var(--text-muted)"}}>{pEnd}′</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Barres de stats ────────────────────────────────────────
const KEY_STATS = [
  "Possession","Shots on target","Shots off target",
  "Corners","Fouls","Yellow cards","Attacks","Expected Goals",
]

function StatsBars({ statistics, homeId, awayId }: {
  statistics: TeamStat[]; homeId: number; awayId: number
}) {
  const home = statistics.find(s => s.team.id === homeId)
  const away = statistics.find(s => s.team.id === awayId)
  if (!home || !away) return null

  const LABELS: Record<string,string> = {
    "Possession":"Possession","Shots on target":"Tirs cadrés",
    "Shots off target":"Tirs non cadrés","Corners":"Corners",
    "Fouls":"Fautes","Yellow cards":"Cartons jaunes",
    "Attacks":"Attaques","Expected Goals":"xG",
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {KEY_STATS.map(key => {
        const hStat = home.statistics.find(s => s.displayName === key)
        const aStat = away.statistics.find(s => s.displayName === key)
        if (!hStat && !aStat) return null
        let hVal = hStat?.value ?? 0
        let aVal = aStat?.value ?? 0
        const isPct = key === "Possession"
        const isXG  = key === "Expected Goals"
        if (isPct) { hVal = Math.round(hVal*100); aVal = Math.round(aVal*100) }
        const total = hVal + aVal || 1
        const hPct  = (hVal/total)*100
        const aPct  = (aVal/total)*100
        const hDisplay = isPct ? `${hVal}%` : isXG ? hVal.toFixed(2) : hVal
        const aDisplay = isPct ? `${aVal}%` : isXG ? aVal.toFixed(2) : aVal
        return (
          <div key={key}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:"var(--accent)",minWidth:40}}>{hDisplay}</span>
              <span style={{fontSize:11,color:"var(--text-muted)",textAlign:"center"}}>{LABELS[key]||key}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#ef4444",minWidth:40,textAlign:"right"}}>{aDisplay}</span>
            </div>
            <div style={{display:"flex",gap:2,height:5,borderRadius:999,overflow:"hidden",background:"var(--bg-muted)"}}>
              <div style={{width:`${hPct}%`,background:"var(--accent)",borderRadius:"999px 0 0 999px",minWidth:hVal>0?3:0}}/>
              <div style={{width:`${aPct}%`,background:"#ef4444",borderRadius:"0 999px 999px 0",minWidth:aVal>0?3:0}}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Événements ─────────────────────────────────────────────
function Events({ events, homeTeamId }: { events: MatchEvent[]; homeTeamId: number }) {
  const { t } = useT()
  if (!events?.length) return (
    <div style={{padding:24,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>
      {t('no_events')||"Aucun événement disponible"}
    </div>
  )
  return (
    <div>
      {events.map((ev, i) => {
        const isHome = ev.team.id === homeTeamId
        return (
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:12,padding:"10px 16px",
            borderBottom: i<events.length-1 ? "1px solid var(--border)" : "none",
            flexDirection: isHome ? "row" : "row-reverse",
          }}>
            <span style={{fontSize:11,color:"var(--text-muted)",width:36,textAlign:"center",flexShrink:0}}>
              {ev.time}′
            </span>
            <span style={{fontSize:16,flexShrink:0}}>{eventIcon(ev.type)}</span>
            <div style={{flex:1,textAlign:isHome?"left":"right"}}>
              <p style={{fontSize:13,fontWeight:500,color:"var(--text-primary)"}}>{ev.player}</p>
              {ev.assist    && <p style={{fontSize:11,color:"var(--text-muted)"}}>↳ {ev.assist}</p>}
              {ev.substituted && <p style={{fontSize:11,color:"var(--text-muted)"}}>↑ {ev.substituted}</p>}
              <p style={{fontSize:11,color:"var(--text-muted)"}}>{ev.type}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Top joueurs ────────────────────────────────────────────
function TopPlayers({ players, teamName, logo }: {
  players: TopPlayer[]; teamName: string; logo: string|null
}) {
  if (!players?.length) return null
  return (
    <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderBottom:"1px solid var(--border)",background:"var(--bg-muted)"}}>
        {logo && <div style={{background:"#fff",borderRadius:4,padding:2,display:"flex"}}><img src={logo} style={{width:18,height:18,objectFit:"contain"}}/></div>}
        <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{teamName}</span>
      </div>
      {players.map((p,i) => (
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:i<players.length-1?"1px solid var(--border)":"none"}}>
          <div>
            <p style={{fontSize:13,fontWeight:500,color:"var(--text-primary)"}}>{p.name}</p>
            <p style={{fontSize:11,color:"var(--text-muted)"}}>{p.position}</p>
          </div>
          <div style={{display:"flex",gap:16}}>
            {p.statistics.map((s,j) => (
              <div key={j} style={{textAlign:"right"}}>
                <p style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>
                  {typeof s.value==="number"&&s.value<10&&s.value%1!==0 ? Number(s.value).toFixed(2) : s.value}
                </p>
                <p style={{fontSize:10,color:"var(--text-muted)"}}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Composant principal ────────────────────────────────────
function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

export default function MatchDetailHighlightly({ matchId }: { matchId: string }) {
  const { t, lang } = useT()
  const [match, setMatch]         = useState<HMatchFull|null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<'events'|'stats'|'info'|'standings'>('events')
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/match/${matchId}`)
      if (!res.ok) { setLoading(false); return }
      setMatch(await res.json())
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }, [matchId])

  useEffect(() => { fetchMatch() }, [fetchMatch])

  useEffect(() => {
    if (!match) return
    const s = normalizeStatus(match.state.description)
    if (!["1H","2H","ET","HT","P"].includes(s)) return
    const iv = setInterval(fetchMatch, 30_000)
    return () => clearInterval(iv)
  }, [match, fetchMatch])

  if (loading) return (
    <div style={{maxWidth:896,margin:"0 auto",padding:"32px 16px",display:"flex",flexDirection:"column",gap:12}}>
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      {[280,200].map((h,i) => (
        <div key={i} style={{background:"var(--bg-surface)",borderRadius:16,height:h,border:"1px solid var(--border)",animation:"shimmer 1.6s infinite"}}/>
      ))}
    </div>
  )

  if (!match) return (
    <div style={{textAlign:"center",padding:"80px 0",color:"var(--text-muted)"}}>
      <div style={{fontSize:48,marginBottom:16}}>😕</div>
      <p style={{fontSize:18,marginBottom:8,color:"var(--text-primary)"}}>{t('match_not_found')}</p>
      <Link href="/" style={{color:"var(--accent)",textDecoration:"none",fontSize:14}}>← {t('back_home')}</Link>
    </div>
  )

  const status      = normalizeStatus(match.state.description)
  const isLive      = ["1H","2H","ET","P"].includes(status)
  const score       = match.state.score.current
  const hasPens     = match.state.score.penalties
  const scoreParts  = score ? score.split(" - ") : null
  const countryName = match.country?.name ? translateCountry(match.country.name, lang) : '—'
  const lastPred    = match.predictions?.prematch?.slice(-1)[0]

  const TABS = [
    { id:'events'    as const, label:`⚽ ${t('events')||"Événements"}` },
    { id:'stats'     as const, label:`📊 Stats` },
    { id:'info'      as const, label:`ℹ️ ${t('info')||"Infos"}` },
    { id:'standings' as const, label:`🏆 Classement` },
  ]

  const infoRows = [
    { label: t('competition'), value: match.league.name },
    { label: t('country'),     value: countryName },
    { label: t('season'),      value: String(match.league.season) },
    { label: t('matchday'),    value: formatRound(match.round, t) },
    { label: t('date'),        value: formatDate(match.date, lang) },
    { label: t('stadium'),     value: match.venue?.name ?? '—' },
    { label: t('city'),        value: match.venue?.city ?? '—' },
    { label: t('capacity'),    value: match.venue ? `${parseInt(match.venue.capacity).toLocaleString()} places` : '—' },
    { label: t('referee'),     value: match.referee?.name ?? '—' },
  ]

  return (
    <div style={{maxWidth:896,margin:"0 auto",padding:"24px 16px 80px",display:"flex",flexDirection:"column",gap:16}}>
      <style>{`
        @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
        .dtab{flex:1;padding:8px;border-radius:8px;border:none;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;background:transparent;color:var(--text-muted);}
        .dtab:hover{color:var(--text-primary);}
        .dtab.on{background:var(--accent);color:#fff;}
        .irow{display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);}
        .irow:last-child{border-bottom:none;}
      `}</style>

      {/* Fil d'Ariane */}
      <div style={{fontSize:13,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <Link href="/" style={{color:"var(--text-muted)",textDecoration:"none"}}>{t('home')}</Link>
        <span>/</span><span style={{color:"var(--text-secondary)"}}>{match.league.name}</span>
        {countryName!=='—'&&<><span>/</span><span>{countryName}</span></>}
      </div>

      {/* Header */}
      <div style={{background:"var(--bg-surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden"}}>
        {/* Bandeau ligue — sans bouton classement (maintenant dans les tabs) */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 20px",borderBottom:"1px solid var(--border)",background:"var(--bg-muted)"}}>
          {match.league.logo && (
            <div style={{background:"#fff",borderRadius:4,padding:2,display:"flex"}}>
              <img src={match.league.logo} style={{width:18,height:18,objectFit:"contain"}}/>
            </div>
          )}
          <span style={{fontSize:13,fontWeight:600,color:"var(--text-secondary)"}}>{match.league.name}</span>
          <span style={{fontSize:11,color:"var(--text-muted)"}}>· {formatRound(match.round, t)}</span>
        </div>

        <div style={{padding:"24px 20px"}}>
          {/* Statut */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <StatusDisplay match={match}/>
          </div>

          {/* Équipes + Score */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:isMobile?4:8}}>

            {/* Domicile */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1,minWidth:0}}>
              {!isMobile && (
                <FavoriteButton
                  item={{ id:String(match.homeTeam.id), type:"team", name:match.homeTeam.name, logo:match.homeTeam.logo??undefined }}
                  size="md"
                />
              )}
              <div style={{
                width:isMobile?56:80, height:isMobile?56:80,
                background:"var(--bg-muted)", borderRadius:12,
                display:"flex", alignItems:"center", justifyContent:"center", padding:6, flexShrink:0,
              }}>
                {proxyLogo(match.homeTeam.logo)
                  ? <img src={proxyLogo(match.homeTeam.logo)!} style={{width:isMobile?44:68,height:isMobile?44:68,objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                  : <span style={{fontSize:isMobile?16:22,fontWeight:700,color:"var(--text-muted)"}}>{match.homeTeam.name.slice(0,2).toUpperCase()}</span>
                }
              </div>
              <span style={{fontWeight:600,textAlign:"center",fontSize:isMobile?12:14,color:"var(--text-primary)",maxWidth:isMobile?80:110,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                {match.homeTeam.name}
              </span>
              {isMobile && (
                <FavoriteButton
                  item={{ id:String(match.homeTeam.id), type:"team", name:match.homeTeam.name, logo:match.homeTeam.logo??undefined }}
                  size="md"
                />
              )}
            </div>

            {/* Score central */}
            <div style={{textAlign:"center",flexShrink:0}}>
              {scoreParts ? (
                <>
                  <div style={{fontSize:isMobile?40:56,fontWeight:900,letterSpacing:"-0.03em",color:isLive?"#ef4444":"var(--text-primary)",lineHeight:1}}>
                    {scoreParts[0]}
                    <span style={{color:"var(--border)",margin:isMobile?"0 4px":"0 8px",fontSize:isMobile?28:40}}>-</span>
                    {scoreParts[1]}
                  </div>
                  {hasPens && <p style={{fontSize:11,color:"#f97316",marginTop:6}}>{t('pen_score')}: {hasPens}</p>}
                </>
              ) : (
                <div style={{fontSize:isMobile?22:28,fontWeight:700,color:"var(--text-muted)"}}>vs</div>
              )}
              <p style={{fontSize:10,color:"var(--text-muted)",marginTop:8}}>{formatDate(match.date, lang)}</p>
            </div>

            {/* Extérieur */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1,minWidth:0}}>
              {!isMobile && (
                <FavoriteButton
                  item={{ id:String(match.awayTeam.id), type:"team", name:match.awayTeam.name, logo:match.awayTeam.logo??undefined }}
                  size="md"
                />
              )}
              <div style={{
                width:isMobile?56:80, height:isMobile?56:80,
                background:"var(--bg-muted)", borderRadius:12,
                display:"flex", alignItems:"center", justifyContent:"center", padding:6, flexShrink:0,
              }}>
                {proxyLogo(match.awayTeam.logo)
                  ? <img src={proxyLogo(match.awayTeam.logo)!} style={{width:isMobile?44:68,height:isMobile?44:68,objectFit:"contain"}} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                  : <span style={{fontSize:isMobile?16:22,fontWeight:700,color:"var(--text-muted)"}}>{match.awayTeam.name.slice(0,2).toUpperCase()}</span>
                }
              </div>
              <span style={{fontWeight:600,textAlign:"center",fontSize:isMobile?12:14,color:"var(--text-primary)",maxWidth:isMobile?80:110,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                {match.awayTeam.name}
              </span>
              {isMobile && (
                <FavoriteButton
                  item={{ id:String(match.awayTeam.id), type:"team", name:match.awayTeam.name, logo:match.awayTeam.logo??undefined }}
                  size="md"
                />
              )}
            </div>
          </div>

          {/* Stade / météo / arbitre */}
          {(match.venue||match.forecast||match.referee) && (
            <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:16,marginTop:20,fontSize:12,color:"var(--text-muted)"}}>
              {match.venue    && <span>🏟️ {match.venue.name}, {match.venue.city}</span>}
              {match.forecast && <span>{weatherIcon(match.forecast.status)} {match.forecast.temperature}</span>}
              {match.referee  && <span>🟨 {match.referee.name}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Prédiction */}
      {lastPred && (
        <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",padding:16}}>
          <p style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:12}}>
            {t('prediction')||"Prédiction"}
          </p>
          <div style={{display:"flex",borderRadius:999,overflow:"hidden",height:8,marginBottom:10}}>
            <div style={{width:lastPred.probabilities.home,background:"var(--accent)"}}/>
            <div style={{width:lastPred.probabilities.draw,background:"var(--text-muted)"}}/>
            <div style={{width:lastPred.probabilities.away,background:"#ef4444"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
            <span style={{color:"var(--accent)",fontWeight:600}}>{t('pred_home')||"Dom."} {lastPred.probabilities.home}</span>
            <span style={{color:"var(--text-muted)"}}>{t('pred_draw')||"Nul"} {lastPred.probabilities.draw}</span>
            <span style={{color:"#ef4444",fontWeight:600}}>{t('pred_away')||"Ext."} {lastPred.probabilities.away}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"var(--bg-muted)",padding:4,borderRadius:12,border:"1px solid var(--border)"}}>
        {TABS.map(tab => (
          <button key={tab.id} className={`dtab ${activeTab===tab.id?'on':''}`}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Événements */}
      {activeTab === 'events' && (
        <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
          <Events events={match.events??[]} homeTeamId={match.homeTeam.id}/>
        </div>
      )}

      {/* Tab Stats */}
      {activeTab === 'stats' && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {match.statistics?.length ? (
            <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {match.homeTeam.logo && <div style={{background:"#fff",borderRadius:3,padding:2}}><img src={match.homeTeam.logo} style={{width:16,height:16,objectFit:"contain"}}/></div>}
                  <span style={{fontSize:12,fontWeight:600,color:"var(--accent)"}}>{match.homeTeam.name}</span>
                </div>
                <span style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".07em"}}>Stats</span>
                <div style={{display:"flex",alignItems:"center",gap:6,flexDirection:"row-reverse"}}>
                  {match.awayTeam.logo && <div style={{background:"#fff",borderRadius:3,padding:2}}><img src={match.awayTeam.logo} style={{width:16,height:16,objectFit:"contain"}}/></div>}
                  <span style={{fontSize:12,fontWeight:600,color:"#ef4444"}}>{match.awayTeam.name}</span>
                </div>
              </div>
              <StatsBars statistics={match.statistics} homeId={match.homeTeam.id} awayId={match.awayTeam.id}/>
            </div>
          ) : (
            <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",padding:24,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>
              Statistiques non disponibles
            </div>
          )}
          {(match.homeTeam.topPlayers?.length||match.awayTeam.topPlayers?.length) && (
            <>
              <p style={{fontSize:11,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:".07em"}}>
                {t('top_players')||"Joueurs à suivre"}
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
                <TopPlayers players={match.homeTeam.topPlayers??[]} teamName={match.homeTeam.name} logo={match.homeTeam.logo}/>
                <TopPlayers players={match.awayTeam.topPlayers??[]} teamName={match.awayTeam.name} logo={match.awayTeam.logo}/>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Infos */}
      {activeTab === 'info' && (
        <div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
          {infoRows.map(({label,value}) => (
            <div key={label} className="irow">
              <span style={{fontSize:13,color:"var(--text-muted)"}}>{label}</span>
              <span style={{fontSize:13,fontWeight:500,color:"var(--text-primary)",textAlign:"right",maxWidth:"60%"}}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab Classement */}
      {activeTab === 'standings' && (
        <StandingsInline leagueId={String(match.league.id)} />
      )}
    </div>
  )
}
