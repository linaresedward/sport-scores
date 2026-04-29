'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API_KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team {
  idTeam: string
  strTeam: string
  strBadge: string
  strStadium: string | null
  strCountry: string | null
  strLeague: string | null
  strDescriptionFR: string | null
  strDescriptionEN: string | null
  intFormedYear: string | null
  strWebsite: string | null
  strStadiumThumb: string | null
}

interface TeamMatch {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  intHomeScore: string | null
  intAwayScore: string | null
  dateEvent: string
  strTime: string
  strLeague: string
  strStatus: string
  idHomeTeam: string
  idAwayTeam: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMatchDate(dateStr: string, timeStr: string) {
  const dt = new Date(`${dateStr}T${timeStr}`)
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function MatchCard({ match, teamId }: { match: TeamMatch; teamId: string }) {
  const isHome    = match.idHomeTeam === teamId
  const teamScore = isHome ? match.intHomeScore : match.intAwayScore
  const oppScore  = isHome ? match.intAwayScore : match.intHomeScore
  const oppName   = isHome ? match.strAwayTeam  : match.strHomeTeam
  const oppBadge  = isHome ? match.strAwayTeamBadge : match.strHomeTeamBadge
  const oppId     = isHome ? match.idAwayTeam   : match.idHomeTeam
  const hasScore  = teamScore !== null && oppScore !== null

  let result: 'W' | 'L' | 'D' | null = null
  if (hasScore) {
    const ts = parseInt(teamScore!)
    const os = parseInt(oppScore!)
    result = ts > os ? 'W' : ts < os ? 'L' : 'D'
  }

  const resultStyle = {
    W: 'bg-green-500/20 text-green-400 border-green-500/30',
    L: 'bg-red-500/20 text-red-400 border-red-500/30',
    D: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const resultLabel = { W: 'V', L: 'D', D: 'N' }

  return (
    <Link
      href={`/match/${match.idEvent}`}
      className="flex items-center gap-3 px-4 py-3 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition"
    >
      {/* Résultat */}
      {result && (
        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded border ${resultStyle[result]}`}>
          {resultLabel[result]}
        </span>
      )}

      {/* Adversaire */}
      <img src={oppBadge} alt={oppName} className="w-8 h-8 object-contain shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isHome ? 'vs' : '@'} {oppName}
        </p>
        <p className="text-xs text-gray-500">{match.strLeague}</p>
      </div>

      {/* Score */}
      {hasScore ? (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums">
            {teamScore} – {oppScore}
          </p>
          <p className="text-xs text-gray-500">{formatMatchDate(match.dateEvent, match.strTime)}</p>
        </div>
      ) : (
        <div className="text-right shrink-0">
          <p className="text-sm font-medium text-blue-400">
            {match.strTime?.slice(0, 5)}
          </p>
          <p className="text-xs text-gray-500">{formatMatchDate(match.dateEvent, match.strTime)}</p>
        </div>
      )}

      <span className="text-gray-600 text-xs shrink-0">›</span>
    </Link>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function TeamPageClient({ teamId }: { teamId: string }) {
  const [team, setTeam]       = useState<Team | null>(null)
  const [past, setPast]       = useState<TeamMatch[]>([])
  const [next, setNext]       = useState<TeamMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'past' | 'next'>('past')

  useEffect(() => {
    async function fetchAll() {
      try {
        const [teamRes, pastRes, nextRes] = await Promise.all([
          fetch(`${BASE}/lookupteam.php?id=${teamId}`),
          fetch(`${BASE}/eventslast.php?id=${teamId}`),
          fetch(`${BASE}/eventsnext.php?id=${teamId}`),
        ])
        const teamData = await teamRes.json()
        const pastData = await pastRes.json()
        const nextData = await nextRes.json()

        setTeam(teamData.teams?.[0] ?? null)
        setPast((pastData.results ?? []).reverse()) // plus récent en premier
        setNext(nextData.events ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [teamId])

  if (loading) return null
  if (!team)   return (
    <div className="text-center py-20 text-gray-400">Équipe introuvable</div>
  )

  const description = team.strDescriptionFR || team.strDescriptionEN

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Fil d'Ariane */}
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-white transition">Accueil</Link>
        <span>/</span>
        <span className="text-gray-300">{team.strTeam}</span>
      </div>

      {/* ── Header équipe ── */}
      <div className="bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-800">
        <div className="flex items-center gap-6">
          <img
            src={team.strBadge}
            alt={team.strTeam}
            className="w-24 h-24 object-contain shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black mb-1">{team.strTeam}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              {team.strLeague  && <span>🏆 {team.strLeague}</span>}
              {team.strCountry && <span>🌍 {team.strCountry}</span>}
              {team.strStadium && <span>🏟️ {team.strStadium}</span>}
              {team.intFormedYear && <span>📅 Fondé en {team.intFormedYear}</span>}
            </div>
          </div>
        </div>

        {/* Description courte */}
        {description && (
          <p className="text-sm text-gray-400 mt-4 leading-relaxed line-clamp-3">
            {description.replace(/<[^>]+>/g, '').slice(0, 300)}
            {description.length > 300 ? '…' : ''}
          </p>
        )}
      </div>

      {/* ── Tabs matchs ── */}
      <div className="flex gap-1 mb-4 bg-gray-900 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setTab('past')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'past' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 Derniers matchs
        </button>
        <button
          onClick={() => setTab('next')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'next' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 Prochains matchs
        </button>
      </div>

      {/* ── Liste matchs ── */}
      <div className="space-y-2">
        {tab === 'past' && (
          past.length === 0
            ? <p className="text-center text-gray-500 py-8">Aucun match récent</p>
            : past.map(m => <MatchCard key={m.idEvent} match={m} teamId={teamId} />)
        )}
        {tab === 'next' && (
          next.length === 0
            ? <p className="text-center text-gray-500 py-8">Aucun prochain match</p>
            : next.map(m => <MatchCard key={m.idEvent} match={m} teamId={teamId} />)
        )}
      </div>
    </div>
  )
}