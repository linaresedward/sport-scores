import { supabase } from '@/lib/supabase'

export default async function Classements() {
  const { data: standings, error } = await supabase
    .from('standings')
    .select('*, team:teams(name)')
    .order('points', { ascending: false })

  if (error) {
    return <p className="text-red-500">Erreur : {error.message}</p>
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Classements</h1>
        <p className="text-slate-500 text-sm mt-1">Ligue 1 — Saison 2024/2025</p>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">

          {/* En-tête du tableau */}
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-slate-500 font-medium w-8">#</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Équipe</th>
              <th className="text-center px-4 py-3 text-slate-500 font-medium">MJ</th>
              <th className="text-center px-4 py-3 text-slate-500 font-medium">G</th>
              <th className="text-center px-4 py-3 text-slate-500 font-medium">N</th>
              <th className="text-center px-4 py-3 text-slate-500 font-medium">P</th>
              <th className="text-center px-4 py-3 text-slate-500 font-medium font-bold text-slate-700">Pts</th>
            </tr>
          </thead>

          {/* Lignes */}
          <tbody>
            {standings?.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400 font-medium">{index + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {row.team?.name ?? '?'}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">{row.played}</td>
                <td className="px-4 py-3 text-center text-slate-600">{row.wins}</td>
                <td className="px-4 py-3 text-center text-slate-600">{row.draws}</td>
                <td className="px-4 py-3 text-center text-slate-600">{row.losses}</td>
                <td className="px-4 py-3 text-center font-bold text-slate-800">{row.points}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )
}