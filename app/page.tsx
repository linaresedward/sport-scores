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
    return <p className="text-red-500">Erreur : {error.message}</p>
  }

  const getTeamName = (id: string) => teams?.find(t => t.id === id)?.name ?? '?'

  return (
    <div>
      {/* En-tête de page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Résultats</h1>
        <p className="text-slate-500 text-sm mt-1">Ligue 1 — Saison 2024/2025</p>
      </div>

      {/* Liste des matchs */}
      <div className="flex flex-col gap-3">
        {matches?.map((match) => (
          <div
            key={match.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">

              {/* Équipe domicile */}
              <span className="font-semibold w-2/5 text-right text-slate-800">
                {getTeamName(match.home_team_id)}
              </span>

              {/* Score */}
              <div className="text-center w-1/5">
                {match.status === 'finished' ? (
                  <span className="text-xl font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-800">
                    {match.home_score} - {match.away_score}
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    À venir
                  </span>
                )}
              </div>

              {/* Équipe extérieure */}
              <span className="font-semibold w-2/5 text-left text-slate-800">
                {getTeamName(match.away_team_id)}
              </span>

            </div>

            {/* Date */}
            <p className="text-center text-xs text-slate-400 mt-3">
              {new Date(match.match_date).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}