'use client'

import { useState, useEffect, useCallback } from 'react'
import LeagueSection from './components/LeagueSection'
import { getAllMatchesByDate, Match } from '../lib/sportsdb'

const LIVE_STATUSES = ["In Progress", "HT", "1H", "2H", "ET", "P", "LIVE"]

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

export default function HomePage() {
  const [offset, setOffset] = useState(0)
  const [matchesByLeague, setMatchesByLeague] = useState<Record<string, Match[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
      setMatchesByLeague({})
    }
    const date = getDateWithOffset(offset)
    const dateStr = formatDate(date)
    setCurrentDate(dateStr)
    const grouped = await getAllMatchesByDate(dateStr)
    setMatchesByLeague(grouped)
    setLastRefresh(new Date())
    if (showLoading) setLoading(false)
  }, [offset])

  // Chargement initial + changement de date
  useEffect(() => {
    load(true)
  }, [load])

  // Rafraîchissement auto toutes les 60s si matchs live
  useEffect(() => {
    const allMatches = Object.values(matchesByLeague).flat()
    const hasLive = allMatches.some(m => LIVE_STATUSES.includes((m as any).strStatus || ''))
    if (!hasLive || offset !== 0) return

    const interval = setInterval(() => {
      load(false) // refresh silencieux sans spinner
    }, 60000)

    return () => clearInterval(interval)
  }, [matchesByLeague, offset, load])

  const leagues = Object.keys(matchesByLeague)
  const allMatches = Object.values(matchesByLeague).flat()
  const hasLive = allMatches.some(m => LIVE_STATUSES.includes((m as any).strStatus || ''))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">

      {/* Navigation par date */}
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

      {/* Bandeau LIVE + heure de refresh */}
      {hasLive && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '8px 14px', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444',
              animation: 'livePulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
              MATCHS EN DIRECT
            </span>
          </div>
          {lastRefresh && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      {/* Animation CSS pour le point live */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* Contenu */}
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