import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default async function Equipes() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, short_name, logo_url')
    .order('name', { ascending: true })

  if (error) {
    return <p className="text-red-500">Erreur : {error.message}</p>
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Équipes</h1>
        <p className="text-slate-500 text-sm mt-1">Ligue 1 — Saison 2024/2025</p>
      </div>

      {/* Grille d'équipes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {teams?.map((team) => (
          <Link
            key={team.id}
            href={`/equipes/${team.id}`}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-4"
          >
            {/* Logo ou initiales */}
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
              {team.logo_url ? (
                <Image
                  src={team.logo_url}
                  alt={`Logo ${team.name}`}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {team.short_name?.slice(0, 3) ?? team.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Nom */}
            <div>
              <p className="font-semibold text-slate-800">{team.name}</p>
              {team.short_name && (
                <p className="text-xs text-slate-400 mt-0.5">{team.short_name}</p>
              )}
            </div>

            {/* Flèche */}
            <span className="ml-auto text-slate-300 text-lg">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}