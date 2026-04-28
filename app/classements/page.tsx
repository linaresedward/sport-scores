import Image from 'next/image'

const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY

const LEAGUES = [
  { id: "4334", name: "Ligue 1",        country: "France" },
  { id: "4328", name: "Premier League", country: "Angleterre" },
  { id: "4335", name: "La Liga",        country: "Espagne" },
  { id: "4331", name: "Bundesliga",     country: "Allemagne" },
  { id: "4332", name: "Serie A",        country: "Italie" },
  { id: "4337", name: "Eredivisie",     country: "Pays-Bas" },
  { id: "4344", name: "Primeira Liga",  country: "Portugal" },
  { id: "4346", name: "Süper Lig",      country: "Turquie" },
]

type Standing = {
  intRank: string
  strTeam: string
  strTeamBadge: string
  intPlayed: string
  intWin: string
  intDraw: string
  intLoss: string
  intGoalsFor: string
  intGoalsAgainst: string
  intGoalDifference: string
  intPoints: string
  idTeam: string
}

async function getStandings(leagueId: string): Promise<Standing[]> {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${KEY}/lookuptable.php?l=${leagueId}&s=2025-2026`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return data.table || []
  } catch {
    return []
  }
}

function getZone(rank: number, total: number) {
  if (rank <= 4)  return { color: '#1E40AF', bg: '#DBEAFE', label: 'Ligue des Champions' }
  if (rank === 5) return { color: '#EA580C', bg: '#FFF7ED', label: 'Europa League' }
  if (rank === 6) return { color: '#166534', bg: '#F0FDF4', label: 'Ligue Conférence' }
  if (rank === total - 2) return { color: '#C2410C', bg: '#FFEDD5', label: 'Barrage relégation' }
  if (rank >= total - 1)  return { color: '#991B1B', bg: '#FEF2F2', label: 'Relégation directe' }
  return null
}

export default async function Classements({
  searchParams,
}: {
  searchParams: Promise<{ ligue?: string }>
}) {
  const params = await searchParams
  const leagueId = params.ligue || "4334"
  const standings = await getStandings(leagueId)
  const total = standings.length

  return (
    <div style={{ flex: 1, padding: "28px 36px", maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
          Classements
        </h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
          Saison 2025-2026
        </p>
      </div>

      {/* Sélecteur de ligue */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        {LEAGUES.map(l => {
          const isActive = l.id === leagueId
          return (
            
             <a
              key={l.id}
              href={`/classements?ligue=${l.id}`}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                textDecoration: "none",
                background: isActive ? "#2563eb" : "#f1f5f9",
                color: isActive ? "#fff" : "#475569",
                border: isActive ? "1px solid #2563eb" : "1px solid transparent",
              }}
            >
              {l.name}
            </a>
          )
        })}
      </div>

      {/* Tableau */}
      {standings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
          <p>Classement non disponible pour cette ligue.</p>
        </div>
      ) : (
        <div style={{
          background: "#fff",
          border: "1px solid #f1f5f9",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "36px 1fr 36px 36px 36px 36px 48px 48px",
            padding: "10px 16px",
            background: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            fontSize: "11px", fontWeight: 700,
            color: "#94a3b8", letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            <span>#</span>
            <span>Équipe</span>
            <span style={{ textAlign: "center" }}>MJ</span>
            <span style={{ textAlign: "center" }}>G</span>
            <span style={{ textAlign: "center" }}>N</span>
            <span style={{ textAlign: "center" }}>P</span>
            <span style={{ textAlign: "center" }}>+/-</span>
            <span style={{ textAlign: "center" }}>Pts</span>
          </div>

          {standings.map((row, idx) => {
            const rank = parseInt(row.intRank)
            const zone = getZone(rank, total)
            const prevZone = idx > 0 ? getZone(parseInt(standings[idx-1].intRank), total) : null
            const zoneChanged = zone?.label !== prevZone?.label && idx > 0
            const diff = parseInt(row.intGoalDifference || "0")

            return (
              <div key={row.idTeam}>
                {zoneChanged && zone && (
                  <div style={{
                    padding: "4px 16px",
                    fontSize: "10px", fontWeight: 700,
                    color: zone.color, background: zone.bg,
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    {zone.label}
                  </div>
                )}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 36px 36px 36px 36px 48px 48px",
                  padding: "10px 16px",
                  alignItems: "center",
                  borderBottom: idx < total - 1 ? "1px solid #f8fafc" : "none",
                  background: "#fff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "3px", height: "24px", borderRadius: "2px",
                      background: zone ? zone.color : "transparent", flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>
                      {rank}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {row.strTeamBadge ? (
                      <Image src={row.strTeamBadge} alt={row.strTeam}
                        width={20} height={20}
                        style={{ objectFit: "contain" }} unoptimized />
                    ) : (
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%",
                        background: "#f1f5f9", flexShrink: 0,
                      }} />
                    )}
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#1e293b" }}>
                      {row.strTeam}
                    </span>
                  </div>

                  <span style={{ textAlign: "center", fontSize: "13px", color: "#475569" }}>{row.intPlayed}</span>
                  <span style={{ textAlign: "center", fontSize: "13px", color: "#475569" }}>{row.intWin}</span>
                  <span style={{ textAlign: "center", fontSize: "13px", color: "#475569" }}>{row.intDraw}</span>
                  <span style={{ textAlign: "center", fontSize: "13px", color: "#475569" }}>{row.intLoss}</span>

                  <span style={{
                    textAlign: "center", fontSize: "13px", fontWeight: 600,
                    color: diff > 0 ? "#166534" : diff < 0 ? "#991b1b" : "#64748b",
                  }}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>

                  <span style={{
                    textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#0f172a",
                  }}>
                    {row.intPoints}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Légende */}
      {standings.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "12px",
          marginTop: "16px", padding: "12px 0",
        }}>
          {[
            { color: '#1E40AF', label: 'Ligue des Champions' },
            { color: '#EA580C', label: 'Europa League' },
            { color: '#166534', label: 'Ligue Conférence' },
            { color: '#C2410C', label: 'Barrage relégation' },
            { color: '#991B1B', label: 'Relégation directe' },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: item.color, flexShrink: 0,
              }} />
              <span style={{ fontSize: "11px", color: "#64748b" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}