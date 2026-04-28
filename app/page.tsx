// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import LeagueSection from './components/LeagueSection'
import { getAllMatchesByDate, Match } from '../lib/sportsdb'

// ─── Helpers date ─────────────────────────────────────────────────
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDateLabel(offset: number): string {
  if (offset === -1) return 'Hier'
  if (offset === 0) return "Aujourd'hui"
  if (offset === 1) return 'Demain'
  return ''
}

function getDateWithOffset(offset: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d
}

// ─── Composant principal ──────────────────────────────────────────
export default function HomePage() {
  const [offset, setOffset] = useState(0)
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, Match[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setMatchesByLeague({})

      const date = getDateWithOffset(offset)
      const dateStr = formatDate(date)
      setCurrentDate(dateStr)

      const grouped = await getAllMatchesByDate(dateStr)
      setMatchesByLeague(grouped)
      setLoading(false)
    }
    load()
  }, [offset])

  const leagues = Object.keys(matchesByLeague)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">

      {/* ── Navigation par date ── */}
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-sm p-3">
        {[-1, 0, 1].map((o) => {
          const d = getDateWithOffset(o)
          const isActive = o === offset
          return (
            <button
              key={o}
              onClick={() => setOffset(o)}
              className={`flex-1 mx-1 py-2 px-3 rounded-lg text-center transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <div className="text-xs font-medium">{getDateLabel(o)}</div>
              <div className="text-xs opacity-75 capitalize">
                {d.toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">⚽</div>
          <p>Chargement des matchs...</p>
        </div>
      ) : leagues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">📅</div>
          <p>Aucun match trouvé pour le {currentDate}</p>
          <p className="text-sm mt-1">Essayez une autre date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leagues.map((league) => (
            <LeagueSection
              key={league}
              leagueName={league}
              matches={matchesByLeague[league]}
            />
          ))}
        </div>
      )}

    </main>
  )
}