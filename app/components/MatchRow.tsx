import Image from 'next/image'
import type { Match } from '@/lib/sportsdb'

interface Props {
  match: Match
}

function StatusBadge({ status, time }: { status: string; time?: string }) {
  const isLive = status === 'In Progress' || status === 'HT'
  const isFinished = status === 'Match Finished'

  if (isLive) {
    return (
      <span className="flex flex-col items-center gap-0.5">
        <span className="flex items-center gap-1 text-xs font-bold text-red-500">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          LIVE
        </span>
        {time && (
          <span className="text-xs text-red-400 font-medium">{time}</span>
        )}
      </span>
    )
  }
  if (isFinished) return <span className="text-xs text-gray-500 font-medium">FT</span>
  return null
}

export default function MatchRow({ match }: Props) {
  const hasScore = match.intHomeScore !== null && match.intAwayScore !== null
  const isLive = match.strStatus === 'In Progress' || match.strStatus === 'HT'
  const time = match.strTime?.slice(0, 5) ?? ''

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">

      {/* Colonne heure/statut */}
      <div className="w-14 shrink-0 text-center">
        {hasScore ? (
          <StatusBadge status={match.strStatus} time={isLive ? time : undefined} />
        ) : (
          <span className="text-xs text-gray-400">{time}</span>
        )}
      </div>

      {/* Colonne équipes */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* Équipe domicile */}
        <div className="flex items-center gap-2">
          {match.strHomeTeamBadge ? (
            <div className="w-5 h-5 shrink-0 relative">
              <Image
                src={match.strHomeTeamBadge}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-5 h-5 shrink-0 rounded-full bg-gray-200" />
          )}
          <span className="text-sm text-gray-800 truncate">{match.strHomeTeam}</span>
        </div>

        {/* Équipe extérieure */}
        <div className="flex items-center gap-2">
          {match.strAwayTeamBadge ? (
            <div className="w-5 h-5 shrink-0 relative">
              <Image
                src={match.strAwayTeamBadge}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-5 h-5 shrink-0 rounded-full bg-gray-200" />
          )}
          <span className="text-sm text-gray-800 truncate">{match.strAwayTeam}</span>
        </div>
      </div>

      {/* Colonne scores */}
      {hasScore && (
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className={`text-sm font-bold tabular-nums ${
            isLive ? 'text-green-600' : 'text-gray-900'
          }`}>
            {match.intHomeScore}
          </span>
          <span className={`text-sm font-bold tabular-nums ${
            isLive ? 'text-green-600' : 'text-gray-900'
          }`}>
            {match.intAwayScore}
          </span>
        </div>
      )}
    </div>
  )
}