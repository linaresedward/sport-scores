import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, match_date, status, home_score, away_score, home_team_id, away_team_id')
    .order('match_date', { ascending: false })

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')

  if (error) {
    return <main className="p-8"><p className="text-red-500">Erreur : {error.message}</p></main>
  }

  const getTeamName = (id: string) => teams?.find(t => t.id === id)?.name ?? '?'

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Resultats Ligue 1</h1>

      <div className="flex flex-col gap-4">
        {matches?.map((match) => (
          <div key={match.id} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold w-2/5 text-right">
                {getTeamName(match.home_team_id)}
              </span>

              <div className="text-center w-1/5">
                {match.status === 'finished' ? (
                  <span className="text-xl font-bold">
                    {match.home_score} - {match.away_score}
                  </span>
                ) : (
                  <span className="text-sm text-blue-500 font-medium">A venir</span>
                )}
              </div>

              <span className="font-semibold w-2/5 text-left">
                {getTeamName(match.away_team_id)}
              </span>
            </div>

            <p className="text-center text-xs text-gray-400 mt-2">
              {new Date(match.match_date).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}