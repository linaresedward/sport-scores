import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import MatchFavoriteButton from './MatchFavoriteButton'
import type { Match } from '@/lib/sportsdb'

interface Props {
  match: Match
}

const LIVE_STATUSES = ['In Progress', 'HT', '1H', '2H', 'ET', 'P', 'LIVE', 'Extra Time']

const PERIOD_LABEL: Record<string, string> = {
  '1H': '1ère MT',
  '2H': '2ème MT',
  'HT': 'Mi-temps',
  'ET': 'Prol.',
  'P':  'Tirs au but',
  'In Progress': 'En cours',
}

function StatusBadge({ status, time }: { status: string; time?: string }) {
  const isLive     = LIVE_STATUSES.includes(status)
  const isFinished = status === 'Match Finished'

  if (isLive) {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: '#ef4444', display: 'inline-block',
            animation: 'livePulse 1.4s ease-in-out infinite' }} />
          LIVE
        </span>
        <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 500 }}>
          {PERIOD_LABEL[status] ?? time ?? ''}
        </span>
      </span>
    )
  }
  if (isFinished) {
    return <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>FT</span>
  }
  return null
}

export default function MatchRow({ match }: Props) {
  const hasScore = match.intHomeScore !== null && match.intAwayScore !== null
  const isLive   = LIVE_STATUSES.includes(match.strStatus)
  const time     = match.strTime?.slice(0, 5) ?? ''

  return (
    <Link
      href={`/match/${match.idEvent}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        textDecoration: 'none',
        transition: 'background 0.12s',
        cursor: 'pointer',
      }}
      className="match-row-link"
    >
      {/* Heure / statut */}
      <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
        {hasScore ? (
          <StatusBadge status={match.strStatus} time={isLive ? time : undefined} />
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{time}</span>
        )}
      </div>

      {/* Équipes */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Domicile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FavoriteButton
            item={{
              id: match.idHomeTeam, type: 'team',
              name: match.strHomeTeam,
              logo: match.strHomeTeamBadge ?? undefined,
            }}
            size="sm"
          />
          {match.strHomeTeamBadge ? (
            <div style={{ width: 18, height: 18, position: 'relative', flexShrink: 0 }}>
              <Image src={match.strHomeTeamBadge} alt="" fill
                style={{ objectFit: 'contain' }} unoptimized />
            </div>
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%',
              background: 'var(--bg-muted)', flexShrink: 0 }} />
          )}
          <span style={{
            fontSize: 13, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.strHomeTeam}
          </span>
        </div>

        {/* Extérieur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FavoriteButton
            item={{
              id: match.idAwayTeam, type: 'team',
              name: match.strAwayTeam,
              logo: match.strAwayTeamBadge ?? undefined,
            }}
            size="sm"
          />
          {match.strAwayTeamBadge ? (
            <div style={{ width: 18, height: 18, position: 'relative', flexShrink: 0 }}>
              <Image src={match.strAwayTeamBadge} alt="" fill
                style={{ objectFit: 'contain' }} unoptimized />
            </div>
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%',
              background: 'var(--bg-muted)', flexShrink: 0 }} />
          )}
          <span style={{
            fontSize: 13, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.strAwayTeam}
          </span>
        </div>
      </div>

      {/* Scores */}
      {hasScore && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: isLive ? '#22c55e' : 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>{match.intHomeScore}</span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: isLive ? '#22c55e' : 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
          }}>{match.intAwayScore}</span>
        </div>
      )}

      {/* Favori match */}
      <MatchFavoriteButton
        match={{
          id: match.idEvent,
          homeTeam: match.strHomeTeam,
          awayTeam: match.strAwayTeam,
          homeLogo: match.strHomeTeamBadge ?? undefined,
          awayLogo: match.strAwayTeamBadge ?? undefined,
          league: match.strLeague ?? '',
          date: match.dateEvent ?? '',
          time: match.strTime?.slice(0, 5) ?? undefined,
        }}
        size={16}
      />

      {/* Flèche */}
      <div style={{ flexShrink: 0, fontSize: 14, color: 'var(--text-muted)' }}>›</div>
    </Link>
  )
}