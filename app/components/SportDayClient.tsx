'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`

interface SportEvent {
  idEvent: string
  strEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string
  strTime: string
  dateEvent: string
  strLeague: string
  strVenue: string | null
}

const LIVE_STATUSES = ['In Progress', 'HT', '1H', '2H', 'ET', 'P', 'LIVE', 'Extra Time']

function getDateStr(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function formatDateLabel(offset: number) {
  if (offset === -1) return 'Hier'
  if (offset === 0)  return "Aujourd'hui"
  if (offset === 1)  return 'Demain'
  return ''
}

export default function SportDayClient({
  sport,
  sportLabel,
  emoji,
}: {
  sport: string
  sportLabel: string
  emoji: string
}) {
  const [dayOffset, setDayOffset] = useState(0)
  const [grouped, setGrouped]     = useState<Record<string, SportEvent[]>>({})
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const date = getDateStr(dayOffset)
        const res  = await fetch(`${BASE}/eventsday.php?d=${date}&s=${sport}`)
        const data = await res.json()
        const events: SportEvent[] = data.events ?? []

        // Grouper par ligue
        const map: Record<string, SportEvent[]> = {}
        for (const ev of events) {
          const key = ev.strLeague || 'Autre'
          if (!map[key]) map[key] = []
          map[key].push(ev)
        }
        setGrouped(map)
      } catch (e) {
        console.error(e)
        setGrouped({})
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [dayOffset, sport])

  const totalMatches = Object.values(grouped).flat().length
  const hasLive = Object.values(grouped).flat().some(e => LIVE_STATUSES.includes(e.strStatus))

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h1 className="text-xl font-black text-white">{sportLabel}</h1>
          <p className="text-xs text-gray-500">{totalMatches} match{totalMatches > 1 ? 's' : ''}</p>
        </div>
        {hasLive && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            EN DIRECT
          </span>
        )}
      </div>

      {/* Navigation Hier / Aujourd'hui / Demain */}
      <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl border border-gray-800">
        {[-1, 0, 1].map(offset => (
          <button
            key={offset}
            onClick={() => setDayOffset(offset)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
              dayOffset === offset
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {formatDateLabel(offset)}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : totalMatches === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">{emoji}</p>
          <p>Aucun match {sportLabel.toLowerCase()} ce jour</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([league, events]) => (
            <div key={league} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">

              {/* Header ligue */}
              <div className="px-4 py-2 border-b border-gray-800 bg-gray-800/50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {league}
                </p>
              </div>

              {/* Matchs */}
              {events.map((ev) => {
                const isLive    = LIVE_STATUSES.includes(ev.strStatus)
                const isFinished = ev.strStatus === 'Match Finished'
                const hasScore  = ev.intHomeScore !== null && ev.intAwayScore !== null

                return (
                  <Link
                    key={ev.idEvent}
                    href={`/match/${ev.idEvent}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition border-b border-gray-800/50 last:border-0"
                  >
                    {/* Statut / heure */}
                    <div className="w-16 shrink-0 text-center">
                      {isLive ? (
                        <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : isFinished ? (
                        <span className="text-xs text-gray-500 font-medium">FT</span>
                      ) : (
                        <span className="text-xs text-blue-400 font-medium">
                          {ev.strTime?.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    {/* Équipes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {ev.strHomeTeamBadge ? (
                          <img src={ev.strHomeTeamBadge} alt="" className="w-4 h-4 object-contain shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-700 shrink-0" />
                        )}
                        <span className="text-sm text-gray-200 truncate">{ev.strHomeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.strAwayTeamBadge ? (
                          <img src={ev.strAwayTeamBadge} alt="" className="w-4 h-4 object-contain shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-700 shrink-0" />
                        )}
                        <span className="text-sm text-gray-200 truncate">{ev.strAwayTeam}</span>
                      </div>
                    </div>

                    {/* Scores */}
                    {hasScore && (
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold tabular-nums ${isLive ? 'text-green-400' : 'text-white'}`}>
                          {ev.intHomeScore}
                        </p>
                        <p className={`text-sm font-bold tabular-nums ${isLive ? 'text-green-400' : 'text-white'}`}>
                          {ev.intAwayScore}
                        </p>
                      </div>
                    )}

                    <span className="text-gray-600 text-xs shrink-0">›</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}