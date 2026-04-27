import {
  getRecentMatches,
  getUpcomingMatches,
  getTodayMatches,
  getYesterdayMatches,
  LEAGUE_IDS,
  ALLOWED_LEAGUES,
  type Match
} from '@/lib/sportsdb'
import LeagueSection from './components/LeagueSection'

function groupByLeague(matches: Match[]): Record<string, Match[]> {
  return matches.reduce((acc, match) => {
    const key = match.strLeague
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {} as Record<string, Match[]>)
}

const LEAGUE_ORDER = [
  'French Ligue 1',
  'English Premier League',
  'Spanish La Liga',
  'German Bundesliga',
  'Italian Serie A',
  'UEFA Champions League',
]

export default async function HomePage() {
  const [
    ligue1Past, ligue1Next,
    plPast, plNext,
    laLigaPast,
    bundesligaPast,
    serieAPast,
    todayMatches,
    yesterdayMatches,
  ] = await Promise.all([
    getRecentMatches(LEAGUE_IDS.ligue1),
    getUpcomingMatches(LEAGUE_IDS.ligue1),
    getRecentMatches(LEAGUE_IDS.premierLeague),
    getUpcomingMatches(LEAGUE_IDS.premierLeague),
    getRecentMatches(LEAGUE_IDS.laLiga),
    getRecentMatches(LEAGUE_IDS.bundesliga),
    getRecentMatches(LEAGUE_IDS.serieA),
    getTodayMatches(),
    getYesterdayMatches(),
  ])

  const seen = new Set<string>()
  const allMatches = [
    ...todayMatches,
    ...yesterdayMatches,
    ...ligue1Past, ...ligue1Next,
    ...plPast, ...plNext,
    ...laLigaPast,
    ...bundesligaPast,
    ...serieAPast,
  ]
  .filter(match => {
    if (!ALLOWED_LEAGUES.has(match.strLeague)) return false
    if (seen.has(match.idEvent)) return false
    seen.add(match.idEvent)
    return true
  })
  .sort((a, b) => new Date(b.dateEvent).getTime() - new Date(a.dateEvent).getTime())
  .slice(0, 60)

  const grouped = groupByLeague(allMatches)

  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
    const ia = LEAGUE_ORDER.indexOf(a)
    const ib = LEAGUE_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        {['Hier', "Aujourd'hui", 'Demain'].map((label, i) => (
          <button
            key={label}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i === 1
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-gray-400">Aucun match trouvé</p>
          <p className="text-gray-600 text-sm mt-2">Essayez "Hier" pour voir les derniers résultats</p>
        </div>
      ) : (
        sortedEntries.map(([leagueName, matches]) => (
          <LeagueSection
            key={leagueName}
            leagueName={leagueName}
            matches={matches}
          />
        ))
      )}
    </main>
  )
}