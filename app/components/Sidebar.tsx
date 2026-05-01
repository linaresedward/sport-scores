"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

const PRIORITY_LEAGUES = [
  { id: "17423", name: "UEFA Champions League", countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png", darkBg: true },
  { id: "19374", name: "UEFA Europa League", countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png", darkBg: true },
  { id: "33973", name: "Premier League", countryFr: "Angleterre", countryEn: "England",
    logo: "https://highlightly.net/soccer/images/leagues/33973.png", darkBg: false },
  { id: "52695", name: "Ligue 1", countryFr: "France", countryEn: "France",
    logo: "https://highlightly.net/soccer/images/leagues/52695.png", darkBg: false },
  { id: "119924", name: "La Liga", countryFr: "Espagne", countryEn: "Spain",
    logo: "https://highlightly.net/soccer/images/leagues/119924.png", darkBg: false },
  { id: "58588", name: "Bundesliga", countryFr: "Allemagne", countryEn: "Germany",
    logo: "https://highlightly.net/soccer/images/leagues/58588.png", darkBg: false },
  { id: "115669", name: "Serie A", countryFr: "Italie", countryEn: "Italy",
    logo: "https://highlightly.net/soccer/images/leagues/115669.png", darkBg: false },
]

type League = {
  id: string; name: string; country: string
  logo: string | null; darkBg?: boolean
}

const COUNTRY_FR: Record<string, string> = {
  "England": "Angleterre", "France": "France", "Spain": "Espagne",
  "Germany": "Allemagne", "Italy": "Italie", "Portugal": "Portugal",
  "Netherlands": "Pays-Bas", "Belgium": "Belgique", "Scotland": "Écosse",
  "Turkey": "Turquie", "Brazil": "Brésil", "Argentina": "Argentine",
  "Mexico": "Mexique", "USA": "États-Unis", "Japan": "Japon",
  "Switzerland": "Suisse", "Austria": "Autriche", "Greece": "Grèce",
  "Croatia": "Croatie", "Serbia": "Serbie", "Ukraine": "Ukraine",
  "Poland": "Pologne", "Denmark": "Danemark", "Sweden": "Suède",
  "Norway": "Norvège", "Romania": "Roumanie", "Hungary": "Hongrie",
  "International": "International", "Europe": "Europe",
  "South America": "Amérique du Sud", "Saudi Arabia": "Arabie Saoudite",
  "Egypt": "Égypte", "Morocco": "Maroc", "Russia": "Russie",
  "Ireland": "Irlande", "Bosnia": "Bosnie", "Bulgaria": "Bulgarie",
  "Georgia": "Géorgie", "Iraq": "Irak", "Qatar": "Qatar",
  "Colombia": "Colombie", "Ecuador": "Équateur", "Bolivia": "Bolivie",
  "Paraguay": "Paraguay", "El Salvador": "El Salvador",
  "Northern Ireland": "Irlande du Nord", "Iceland": "Islande",
  "Rwanda": "Rwanda", "Gambia": "Gambie",
}

function translateCountry(name: string, lang: string): string {
  if (lang === 'fr') return COUNTRY_FR[name] ?? name
  return name
}

// ─── Logo Box — fond adapté dark/light ──────────────────────
function LogoBox({ logo, name, darkBg }: { logo: string | null; name: string; darkBg?: boolean }) {
  const [error, setError] = useState(false)
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <>
      <style>{`
        :root     { --logo-bg: #f1f5f9; --logo-text: #64748b; }
        html.dark { --logo-bg: #ffffff; --logo-text: #64748b; }
      `}</style>
      <div style={{
        width: "30px", height: "30px", borderRadius: "6px",
        background: darkBg ? "#1a1f3c" : "var(--logo-bg)",
        flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "center", overflow: "hidden",
      }}>
        {!error && logo ? (
          <Image src={logo} alt={name} width={24} height={24}
            style={{ objectFit: "contain", padding: "3px" }}
            onError={() => setError(true)} unoptimized />
        ) : (
          <span style={{ fontSize: "10px", color: darkBg ? "#fff" : "var(--logo-text)", fontWeight: 700 }}>
            {initials}
          </span>
        )}
      </div>
    </>
  )
}

// ─── Item de ligue ──────────────────────────────────────────
function LeagueItem({ league, isActive, onClick }: {
  league: League; isActive: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        width: "100%", padding: "7px 10px",
        border: "none", borderRadius: "8px",
        background: isActive
          ? "var(--accent-bg)"
          : hovered ? "var(--bg-muted)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.12s", marginBottom: "1px",
      }}
    >
      <LogoBox logo={league.logo} name={league.name} darkBg={league.darkBg} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{
          fontSize: "13px",
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "var(--accent)" : "var(--text-primary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {league.name}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
          {league.country}
        </div>
      </div>
      {isActive && (
        <div style={{
          width: "3px", height: "20px", borderRadius: "2px",
          background: "var(--accent)", flexShrink: 0,
        }} />
      )}
    </button>
  )
}

// ─── Sidebar principale ─────────────────────────────────────
export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { t, lang } = useT()

  const [othersOpen, setOthersOpen]       = useState(false)
  const [otherLeagues, setOtherLeagues]   = useState<League[]>([])
  const [loadingOthers, setLoadingOthers] = useState(false)
  const [loaded, setLoaded]               = useState(false)

  const priorityIds = new Set(PRIORITY_LEAGUES.map(l => String(l.id)))

  useEffect(() => {
    async function loadOthers() {
      setLoadingOthers(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res   = await fetch(`/api/matches?date=${today}`)
        if (!res.ok) return
        const grouped: Record<string, any[]> = await res.json()
        const seen = new Map<string, League>()
        for (const [, matches] of Object.entries(grouped)) {
          for (const match of matches) {
            const leagueId = String(match.league?.id)
            if (!leagueId || priorityIds.has(leagueId) || seen.has(leagueId)) continue
            seen.set(leagueId, {
              id:      leagueId,
              name:    match.league.name,
              country: match.country?.name ?? "International",
              logo:    match.league.logo ?? null,
            })
          }
        }
        setOtherLeagues([...seen.values()].sort((a, b) => a.name.localeCompare(b.name)))
      } catch (e) {
        console.error("Sidebar others error:", e)
      } finally {
        setLoadingOthers(false)
        setLoaded(true)
      }
    }
    loadOthers()
  }, [])

  const priorityWithCountry: League[] = PRIORITY_LEAGUES.map(l => ({
    id: l.id, name: l.name,
    country: lang === 'fr' ? l.countryFr : l.countryEn,
    logo: l.logo, darkBg: l.darkBg,
  }))

  const othersTranslated: League[] = otherLeagues.map(l => ({
    ...l, country: translateCountry(l.country, lang),
  }))

  return (
    <aside className="sidebar-desktop" style={{
      width: "224px", minHeight: "100vh",
      backgroundColor: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      padding: "20px 10px",
      flexShrink: 0, overflowY: "auto",
    }}>

      {/* Titre section */}
      <p style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--text-muted)",
        padding: "0 6px", marginBottom: "10px",
      }}>
        {t('competitions')}
      </p>

      {/* Ligues prioritaires */}
      {priorityWithCountry.map(league => (
        <LeagueItem
          key={league.id} league={league}
          isActive={pathname === `/ligue/${league.id}`}
          onClick={() => router.push(`/ligue/${league.id}`)}
        />
      ))}

      {/* Séparateur */}
      <div style={{ height: "1px", background: "var(--border)", margin: "10px 4px" }} />

      {/* Autres ligues */}
      <button
        onClick={() => setOthersOpen(!othersOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "7px 10px",
          border: "none", borderRadius: "8px", background: "transparent",
          cursor: "pointer", color: "var(--text-muted)",
          fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px",
        }}
      >
        <span>{t('others')}{loaded && ` (${othersTranslated.length})`}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: othersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {othersOpen && (
        loadingOthers
          ? <div style={{ padding: "8px 10px", fontSize: "12px", color: "var(--text-muted)" }}>
              {t('loading')}…
            </div>
          : othersTranslated.length === 0
            ? <div style={{ padding: "8px 10px", fontSize: "12px", color: "var(--text-muted)" }}>
                {t('no_matches')}
              </div>
            : othersTranslated.map(league => (
                <LeagueItem
                  key={league.id} league={league}
                  isActive={pathname === `/ligue/${league.id}`}
                  onClick={() => router.push(`/ligue/${league.id}`)}
                />
              ))
      )}
    </aside>
  )
}