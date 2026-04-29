'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`

// Grands tournois ATP/WTA connus dans TheSportsDB
const TOURNAMENTS = [
  { id: '4658', name: 'Roland Garros',  surface: '🔴 Terre battue' },
  { id: '4659', name: 'Wimbledon',      surface: '🟢 Gazon' },
  { id: '4660', name: 'US Open',        surface: '🔵 Dur' },
  { id: '4661', name: 'Australian Open',surface: '🔵 Dur' },
]

interface TennisMatch {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  dateEvent: string
  strTime: string
  strLeague: string
  intRound: string | null
}

interface TournamentData {
  id: string
  name: string
  surface: string
  upcoming: TennisMatch[]
  past: TennisMatch[]
  error?: boolean
}

export default function TennisClient() {
  const [tournaments, setTournaments] = useState<TournamentData[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    async function fetchAll() {
      const results = await Promise.all(
        TOURNAMENTS.map(async (t) => {
          try {
            const [nextRes, pastRes] = await Promise.all([
              fetch(`${BASE}/eventsnextleague.php?id=${t.id}`),
              fetch(`${BASE}/eventslast.php?id=${t.id}`),
            ])
            const nextData = await nextRes.json()
            const pastData = await pastRes.json()
            return {
              ...t,
              upcoming: nextData.events ?? [],
              past:     (pastData.results ?? pastData.events ?? []).slice(0, 10),
            }
          } catch {
            return { ...t, upcoming: [], past: [], error: true }
          }
        })
      )
      // Filtrer les tournois qui ont des matchs
      setTournaments(results.filter(t => t.upcoming.length > 0 || t.past.length > 0))
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🎾</span>
        <div>
          <h1 className="text-xl font-black text-white">Tennis</h1>
          <p className="text-xs text-gray-500">Grands tournois ATP / WTA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setTab('upcoming')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'upcoming' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 Prochains matchs
        </button>
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'past' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Résultats récents
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🎾</p>
          <p className="font-medium">Aucun tournoi majeur en ce moment</p>
          <p className="text-sm mt-1">Roland Garros, Wimbledon, US Open et Australian Open apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tournaments.map(tournament => {
            const matches = tab === 'upcoming' ? tournament.upcoming : tournament.past
            if (matches.length === 0) return null

            return (
              <div key={tournament.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

                {/* Header tournoi */}
                <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{tournament.name}</p>
                    <p className="text-xs text-gray-500">{tournament.surface}</p>
                  </div>
                </div>

                {/* Matchs */}
                {matches.map(match => {
                  const hasScore   = match.intHomeScore !== null && match.intAwayScore !== null
                  const isFinished = match.strStatus === 'Match Finished'

                  return (
                    <Link
                      key={match.idEvent}
                      href={`/match/${match.idEvent}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition border-b border-gray-800/50 last:border-0"
                    >
                      {/* Date */}
                      <div className="w-16 shrink-0 text-center">
                        {isFinished ? (
                          <span className="text-xs text-gray-500 font-medium">FT</span>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500">
                              {new Date(match.dateEvent).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </p>
                            <p className="text-xs text-blue-400 font-medium">
                              {match.strTime?.slice(0, 5)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Joueurs */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate font-medium">
                          {match.strHomeTeam}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {match.strAwayTeam}
                        </p>
                      </div>

                      {/* Score (sets) */}
                      {hasScore && (
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-white tabular-nums">
                            {match.intHomeScore} – {match.intAwayScore}
                          </p>
                          <p className="text-xs text-gray-500">sets</p>
                        </div>
                      )}

                      <span className="text-gray-600 text-xs shrink-0">›</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}

          {/* Si aucun tournoi n'a de matchs pour cet onglet */}
          {tournaments.every(t => (tab === 'upcoming' ? t.upcoming : t.past).length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <p>Aucun match disponible pour cette période</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}