import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default async function EquipeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Récupérer l'équipe
  const { data: team } = await supabase
    .from('teams')
    .select('id, name, short_name, logo_url')
    .eq('id', id)
    .single()

  // Récupérer les matchs de cette équipe
  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_date, status, home_score, away_score, home_team_id, away_team_id')
    .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
    .order('match_date', { ascending: false })

  // Récupérer toutes les équipes pour afficher les noms
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, short_name, logo_url')

  const getTeam = (id: string) => teams?.find(t => t.id === id)

  if (!team) {
    return <p className="text-red-500">Équipe introuvable.</p>
  }

  return (
    <div>
      {/* Bouton retour */}
      <Link href="/equipes" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Retour aux équipes
      </Link>

      {/* En-tête équipe */}
      <div className="flex items-center gap-4 mb-8">
        {team.logo_url && (
          <Image
            src={team.logo_url}
            alt={`Logo ${team.name}`}
            width={64}
            height={64}
            className="object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{team.name}</h1>
          <p className="text-slate-500 text-sm">{team.short_name} — Ligue 1</p>
        </div>
      </div>

      {/* Liste des matchs */}
      <h2 className="text-lg font-semibold text-slate-700 mb-4">Matchs</h2>

      {matches && matches.length > 0 ? (
        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const home = getTeam(match.home_team_id)
            const away = getTeam(match.away_team_id)
            const isHome = match.home_team_id === id
            const date = new Date(match.match_date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })

            return (
              <div key={match.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                
                {/* Équipe domicile */}
                <div className="flex items-center gap-2 w-1/3 justify-end">
                  <span className={`text-sm font-medium ${isHome ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                    {home?.short_name}
                  </span>
                  {home?.logo_url && (
                    <Image src={home.logo_url} alt={home.name} width={28} height={28} className="object-contain" />
                  )}
                </div>

                {/* Score / Date */}
                <div className="flex flex-col items-center w-1/3">
                  {match.status === 'finished' ? (
                    <span className="text-lg font-bold text-slate-800">
                      {match.home_score} - {match.away_score}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">À venir</span>
                  )}
                  <span className="text-xs text-slate-400 mt-1">{date}</span>
                </div>

                {/* Équipe extérieur */}
                <div className="flex items-center gap-2 w-1/3 justify-start">
                  {away?.logo_url && (
                    <Image src={away.logo_url} alt={away.name} width={28} height={28} className="object-contain" />
                  )}
                  <span className={`text-sm font-medium ${!isHome ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
                    {away?.short_name}
                  </span>
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Aucun match trouvé pour cette équipe.</p>
      )}
    </div>
  )
}