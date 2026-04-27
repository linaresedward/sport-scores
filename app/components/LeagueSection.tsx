// app/components/LeagueSection.tsx
// Groupe de matchs pour une ligue (avec header drapeau + nom)

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
    <div className="mb-3 rounded-lg overflow-hidden border border-gray-800">
      
      {/* Header ligue */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900">
        <span className="text-base">{flag}</span>
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
          {leagueName}
        </span>
      </div>

      {/* Liste des matchs */}
      {matches.map(match => (
        <MatchRow key={match.idEvent} match={match} />
      ))}
    </div>
  )
}