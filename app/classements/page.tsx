import { supabase } from '@/lib/supabase'

type Standing = {
  id: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  team: {
    name: string
    short_name: string
    logo_url: string | null
  }
}

function getZone(rank: number, total: number) {
  if (rank <= 2) return { label: 'Ligue des Champions', color: '#1E40AF', bg: '#DBEAFE' }
  if (rank === 3) return { label: 'LDC — Tour préliminaire', color: '#2563EB', bg: '#EFF6FF' }
  if (rank === 4) return { label: 'Europa League', color: '#EA580C', bg: '#FFF7ED' }
  if (rank === 5) return { label: 'Ligue Conférence', color: '#166534', bg: '#F0FDF4' }
  if (rank === 6) return { label: 'Conférence — Tour préliminaire', color: '#854D0E', bg: '#FEFCE8' }
  if (rank === total - 2) return { label: 'Barrage relégation', color: '#C2410C', bg: '#FFEDD5' }
  if (rank >= total - 1) return { label: 'Relégation directe', color: '#991B1B', bg: '#FEF2F2' }
  return null
}

function TeamLogo({ team }: { team: Standing['team'] }) {
  if (team.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt={team.short_name}
        width={24}
        height={24}
        style={{ borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }}
      />
    )
  }
  return (
    <div className="standing-logo-placeholder">
      {team.short_name.slice(0, 3)}
    </div>
  )
}

function DiffCell({ value }: { value: number }) {
  const color = value > 0 ? '#166534' : value < 0 ? '#991B1B' : '#888'
  const prefix = value > 0 ? '+' : ''
  return (
    <span className="standing-col--diff" style={{ color }}>
      {prefix}{value}
    </span>
  )
}

export default async function Classements() {
  const { data: standings, error } = await supabase
    .from('standings')
    .select('*, team:teams(name, short_name, logo_url)')
    .order('points', { ascending: false })

  if (error) {
    return <p style={{ color: 'red', padding: '2rem' }}>Erreur : {error.message}</p>
  }

  const total = standings?.length ?? 0

  return (
    <main className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Classements</h1>
        <p className="hero-subtitle">Ligue 1 — Saison 2024/2025</p>
      </div>

      <div className="matches-container">
        <div className="standing-table">

          <div className="standing-header">
            <span className="standing-col--rank">#</span>
            <span className="standing-col--team">Équipe</span>
            <span className="standing-col--stat">MJ</span>
            <span className="standing-col--stat">G</span>
            <span className="standing-col--stat">N</span>
            <span className="standing-col--stat">P</span>
            <span className="standing-col--diff">+/-</span>
            <span className="standing-col--pts">Pts</span>
          </div>

          {standings?.map((row, index) => {
            const rank = index + 1
            const zone = getZone(rank, total)
            const prevZone = index > 0 ? getZone(rank - 1, total) : null
            const zoneChanged = zone?.label !== prevZone?.label
            const diff = (row.goals_for ?? 0) - (row.goals_against ?? 0)

            return (
              <div key={row.id}>
                {zoneChanged && index > 0 && zone && (
                  <div
                    className="standing-divider"
                    style={{ borderColor: zone.color, background: zone.bg, color: zone.color }}
                  >
                    {zone.label}
                  </div>
                )}
                <div className="standing-row">
                  <span className="standing-col--rank">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '3px', height: '28px', borderRadius: '2px',
                        background: zone ? zone.color : 'transparent',
                        flexShrink: 0,
                      }} />
                      <span className="rank-number">{rank}</span>
                    </div>
                  </span>
                  <span className="standing-col--team">
                    <TeamLogo team={row.team} />
                    <span className="standing-team-name">{row.team?.name ?? '?'}</span>
                  </span>
                  <span className="standing-col--stat">{row.played}</span>
                  <span className="standing-col--stat">{row.wins}</span>
                  <span className="standing-col--stat">{row.draws}</span>
                  <span className="standing-col--stat">{row.losses}</span>
                  <DiffCell value={diff} />
                  <span className="standing-col--pts">{row.points}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="standing-legend">
          {[
            { color: '#1E40AF', label: 'Ligue des Champions' },
            { color: '#2563EB', label: 'LDC — Tour préliminaire' },
            { color: '#EA580C', label: 'Europa League' },
            { color: '#166534', label: 'Ligue Conférence' },
            { color: '#854D0E', label: 'Conférence — Tour préliminaire' },
            { color: '#C2410C', label: 'Barrage relégation' },
            { color: '#991B1B', label: 'Relégation directe' },
          ].map(item => (
            <div className="legend-item" key={item.label}>
              <div className="legend-dot" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}