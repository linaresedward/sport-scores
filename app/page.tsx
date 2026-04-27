import { supabase } from '@/lib/supabase'

type Team = {
  id: string
  name: string
  short_name: string
  logo_url: string | null
}

type Match = {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  match_date: string
  status: string
  minute: number | null
  home_team: Team
  away_team: Team
}

function TeamLogo({ team }: { team: Team }) {
  if (team.logo_url) {
    return (
      <img
        src={team.logo_url}
        alt={team.short_name}
        width={32}
        height={32}
        style={{ borderRadius: '50%', objectFit: 'contain' }}
      />
    )
  }
  return (
    <div className="team-logo-placeholder">
      {team.short_name.slice(0, 3)}
    </div>
  )
}

function ScoreDisplay({ match }: { match: Match }) {
  if (match.status === 'live') {
    return (
      <div className="score-center">
        <div className="score-numbers">
          <span className="score-value">{match.home_score ?? 0}</span>
          <span className="score-sep">–</span>
          <span className="score-value">{match.away_score ?? 0}</span>
        </div>
        {match.minute && (
          <span className="score-minute">{match.minute}'</span>
        )}
      </div>
    )
  }

  if (match.status === 'finished') {
    return (
      <div className="score-numbers">
        <span className="score-value">{match.home_score}</span>
        <span className="score-sep">–</span>
        <span className="score-value">{match.away_score}</span>
      </div>
    )
  }

  const time = new Date(match.match_date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return <span className="score-tbd">{time}</span>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') return <span className="badge badge-live">En direct</span>
  if (status === 'finished') return <span className="badge badge-done">Terminé</span>
  return <span className="badge badge-soon">À venir</span>
}

function LiveDot() {
  return <span className="live-dot" />
}

function MatchCard({ match }: { match: Match }) {
  const homeLeading =
    match.status === 'live' &&
    (match.home_score ?? 0) > (match.away_score ?? 0)

  const awayLeading =
    match.status === 'live' &&
    (match.away_score ?? 0) > (match.home_score ?? 0)

  return (
    <div className={`match-card ${match.status === 'live' ? 'match-card--live' : ''}`}>
      <div className="match-card__header">
        <StatusBadge status={match.status} />
        <span className="match-meta-text">Ligue 1</span>
      </div>
      <div className="match-card__body">
        <div className="team-block">
          <TeamLogo team={match.home_team} />
          <span className="team-name">{match.home_team.name}</span>
          {homeLeading && <LiveDot />}
        </div>
        <ScoreDisplay match={match} />
        <div className="team-block team-block--right">
          {awayLeading && <LiveDot />}
          <span className="team-name">{match.away_team.name}</span>
          <TeamLogo team={match.away_team} />
        </div>
      </div>
    </div>
  )
}

export default async function HomePage() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, short_name, logo_url),
      away_team:teams!away_team_id(id, name, short_name, logo_url)
    `)
    .order('match_date', { ascending: true })

  if (error) {
    console.error('Erreur Supabase:', error)
  }

  const allMatches = (matches as Match[]) ?? []
  const liveMatches = allMatches.filter(m => m.status === 'live')
  const finishedMatches = allMatches.filter(m => m.status === 'finished')
  const upcomingMatches = allMatches.filter(m => m.status === 'upcoming')

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">Résultats du jour</h1>
        <p className="hero-subtitle">Ligue 1 · {today}</p>
      </div>

      <div className="matches-container">
        {allMatches.length === 0 && (
          <p className="empty-state">Aucun match aujourd'hui.</p>
        )}

        {liveMatches.length > 0 && (
          <section>
            <h2 className="section-label">En direct</h2>
            {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </section>
        )}

        {finishedMatches.length > 0 && (
          <section>
            <h2 className="section-label">Terminés</h2>
            {finishedMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </section>
        )}

        {upcomingMatches.length > 0 && (
          <section>
            <h2 className="section-label">À venir</h2>
            {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </section>
        )}
      </div>
    </main>
  )
}