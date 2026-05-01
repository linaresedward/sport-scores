import type { Match } from '@/lib/sportsdb'
import MatchRow from './MatchRow'

const LEAGUE_FLAGS: Record<string, string> = {
  'French Ligue 1': '🇫🇷',
  'English Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Spanish La Liga': '🇪🇸',
  'German Bundesliga': '🇩🇪',
  'Italian Serie A': '🇮🇹',
  'UEFA Champions League': '🇪🇺',
}

interface Props {
  leagueName: string
  leagueBadge?: string
  matches: Match[]
}

export default function LeagueSection({ leagueName, leagueBadge, matches }: Props) {
  const flag = LEAGUE_FLAGS[leagueName] || '⚽'

  return (
    <div style={{
      marginBottom: 12,
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--bg-surface)',
    }}>
      {/* Header ligue */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: 'var(--bg-muted)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 15 }}>{flag}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          {leagueName}
        </span>
      </div>

      {/* Matchs */}
      {matches.map(match => (
        <MatchRow key={match.idEvent} match={match} />
      ))}
    </div>
  )
}