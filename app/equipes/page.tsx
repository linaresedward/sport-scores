import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

type Team = {
  id: string
  name: string
  short_name: string
  logo_url: string | null
}

type Standing = {
  team_id: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
}

function getZone(rank: number, total: number) {
  if (rank <= 2) return { label: 'Ligue des Champions', color: '#1E40AF' }
  if (rank === 3) return { label: 'LDC — Tour préliminaire', color: '#2563EB' }
  if (rank === 4) return { label: 'Europa League', color: '#EA580C' }
  if (rank === 5) return { label: 'Ligue Conférence', color: '#166534' }
  if (rank === 6) return { label: 'Conférence — Tour préliminaire', color: '#854D0E' }
  if (rank === total - 2) return { label: 'Barrage relégation', color: '#C2410C' }
  if (rank >= total - 1) return { label: 'Relégation directe', color: '#991B1B' }
  return { label: 'Milieu de tableau', color: '#888' }
}

export default async function Equipes() {
  const [{ data: teams, error: teamsError }, { data: standings }] = await Promise.all([
    supabase.from('teams').select('id, name, short_name, logo_url').order('name'),
    supabase.from('standings').select('*').order('points', { ascending: false }),
  ])

  if (teamsError) {
    return <p style={{ color: 'red', padding: '2rem' }}>Erreur : {teamsError.message}</p>
  }

  const total = standings?.length ?? 0

  const standingByTeam = new Map<string, Standing & { rank: number }>()
  standings?.forEach((s, index) => {
    standingByTeam.set(s.team_id, { ...s, rank: index + 1 })
  })

  return (
    <main className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Équipes</h1>
        <p className="hero-subtitle">Ligue 1 — Saison 2024/2025 · {total} équipes</p>
      </div>
      <div className="matches-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
          {teams?.map((team) => {
            const standing = standingByTeam.get(team.id)
            const zone = standing ? getZone(standing.rank, total) : null
            const diff = standing
              ? (standing.goals_for ?? 0) - (standing.goals_against ?? 0)
              : null
            return (
              <Link key={team.id} href={`/equipes/${team.id}`} className="team-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="team-card__zone-bar" style={{ background: zone?.color ?? '#e8e8e6' }} />
                <div className="team-card__body">
                  <div className="team-card__header">
                    <div className="team-card__logo">
                      {team.logo_url ? (
                        <Image src={team.logo_url} alt={team.name} width={48} height={48} style={{ objectFit: 'contain' }} />
                      ) : (
                        <div className="team-card__logo-placeholder">{team.short_name?.slice(0, 3)}</div>
                      )}
                    </div>
                    <div className="team-card__identity">
                      <span className="team-card__name">{team.name}</span>
                      <span className="team-card__short">{team.short_name}</span>
                    </div>
                    {standing && (
                      <div className="team-card__rank" style={{ color: zone?.color ?? '#888' }}>
                        #{standing.rank}
                      </div>
                    )}
                  </div>
                  {zone && (
                    <div className="team-card__zone-label" style={{ color: zone.color }}>
                      {zone.label}
                    </div>
                  )}
                  {standing && (
                    <div className="team-card__stats">
                      <div className="team-stat">
                        <span className="team-stat__value">{standing.points}</span>
                        <span className="team-stat__label">Pts</span>
                      </div>
                      <div className="team-stat">
                        <span className="team-stat__value">{standing.played}</span>
                        <span className="team-stat__label">MJ</span>
                      </div>
                      <div className="team-stat">
                        <span className="team-stat__value">{standing.wins}</span>
                        <span className="team-stat__label">V</span>
                      </div>
                      <div className="team-stat">
                        <span className="team-stat__value">{standing.draws}</span>
                        <span className="team-stat__label">N</span>
                      </div>
                      <div className="team-stat">
                        <span className="team-stat__value">{standing.losses}</span>
                        <span className="team-stat__label">D</span>
                      </div>
                      <div className="team-stat">
                        <span className="team-stat__value" style={{ color: diff && diff > 0 ? '#166534' : diff && diff < 0 ? '#991B1B' : '#888' }}>
                          {diff !== null && diff > 0 ? `+${diff}` : diff}
                        </span>
                        <span className="team-stat__label">+/-</span>
                      </div>
                    </div>
                  )}
                  {!standing && (
                    <p className="team-card__no-stats">Aucune statistique disponible</p>
                  )}
                </div>
                <div className="team-card__arrow">→</div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}