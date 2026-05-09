"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";

// IDs réels Highlightly — ordre identique à la sidebar desktop
const PRIORITY_LEAGUES = [
  { id: "2486",   name: "Champions League",         countryFr: "UEFA",         countryEn: "UEFA",         logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png", darkBg: true  },
  { id: "3337",   name: "Europa League",            countryFr: "UEFA",         countryEn: "UEFA",         logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png", darkBg: true  },
  { id: "722432", name: "Conference League",        countryFr: "UEFA",         countryEn: "UEFA",         logo: "https://highlightly.net/soccer/images/leagues/722432.png", darkBg: false },
  { id: "1635",   name: "FIFA World Cup",           countryFr: "International",countryEn: "International",logo: "https://r2.thesportsdb.com/images/media/league/badge/e7er5g1696521789.png",   darkBg: false },
  { id: "4188",   name: "UEFA Euro",                countryFr: "Europe",       countryEn: "Europe",       logo: "https://highlightly.net/soccer/images/leagues/4188.png",   darkBg: false },
  { id: "5890",   name: "Africa Cup of Nations",    countryFr: "Afrique",      countryEn: "Africa",       logo: "https://highlightly.net/soccer/images/leagues/5890.png",   darkBg: false },
  { id: "8443",   name: "Copa América",             countryFr: "Amér. du Sud", countryEn: "South America",logo: "https://highlightly.net/soccer/images/leagues/8443.png",   darkBg: false },
  { id: "33973",  name: "Premier League",           countryFr: "Angleterre",   countryEn: "England",      logo: "https://highlightly.net/soccer/images/leagues/33973.png",  darkBg: false },
  { id: "67162",  name: "Bundesliga",               countryFr: "Allemagne",    countryEn: "Germany",      logo: "https://highlightly.net/soccer/images/leagues/67162.png",  darkBg: false },
  { id: "119924", name: "La Liga",                  countryFr: "Espagne",      countryEn: "Spain",        logo: "https://highlightly.net/soccer/images/leagues/119924.png", darkBg: false },
  { id: "52695",  name: "Ligue 1",                  countryFr: "France",       countryEn: "France",       logo: "https://highlightly.net/soccer/images/leagues/52695.png",  darkBg: false },
  { id: "115669", name: "Serie A",                  countryFr: "Italie",       countryEn: "Italy",        logo: "https://highlightly.net/soccer/images/leagues/115669.png", darkBg: false },
  { id: "75672",  name: "Eredivisie",               countryFr: "Pays-Bas",     countryEn: "Netherlands",  logo: "https://highlightly.net/soccer/images/leagues/75672.png",  darkBg: false },
  { id: "80778",  name: "Primeira Liga",            countryFr: "Portugal",     countryEn: "Portugal",     logo: "https://highlightly.net/soccer/images/leagues/80778.png",  darkBg: false },
  { id: "173537", name: "Süper Lig",                countryFr: "Turquie",      countryEn: "Turkey",       logo: "https://highlightly.net/soccer/images/leagues/173537.png", darkBg: false },
]

const PRIORITY_IDS = new Set(PRIORITY_LEAGUES.map(l => l.id))

const SPORTS = [
  { key: "football",   icon: "⚽", href: "/" },
  { key: "hockey",     icon: "🏒", href: "/hockey" },
  { key: "basketball", icon: "🏀", href: "/basketball" },
]

const COUNTRY_FR: Record<string, string> = {
  "England": "Angleterre", "France": "France", "Spain": "Espagne",
  "Germany": "Allemagne", "Italy": "Italie", "Portugal": "Portugal",
  "Netherlands": "Pays-Bas", "Belgium": "Belgique", "Scotland": "Écosse",
  "Turkey": "Turquie", "Brazil": "Brésil", "Argentina": "Argentine",
  "Mexico": "Mexique", "USA": "États-Unis", "Japan": "Japon",
  "Switzerland": "Suisse", "Austria": "Autriche", "Poland": "Pologne",
  "Denmark": "Danemark", "Sweden": "Suède", "Norway": "Norvège",
  "Romania": "Roumanie", "Hungary": "Hongrie", "Ireland": "Irlande",
  "Saudi Arabia": "Arabie Saoudite", "Egypt": "Égypte",
  "International": "International",
}

function translateCountry(name: string, lang: string): string {
  if (lang === 'fr') return COUNTRY_FR[name] ?? name
  return name
}

type League = { id: string; name: string; country: string; logo: string | null; darkBg?: boolean }

export default function MobileMenu() {
  const [open, setOpen]               = useState(false)
  const [othersOpen, setOthersOpen]   = useState(false)
  const [otherLeagues, setOtherLeagues] = useState<League[]>([])
  const [loading, setLoading]         = useState(false)
  const router   = useRouter()
  const pathname = usePathname()
  const { t, lang } = useT()

  useEffect(() => {
    async function loadOthers() {
      setLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res   = await fetch(`/api/matches?date=${today}`)
        if (!res.ok) return
        const grouped: Record<string, any[]> = await res.json()
        const seen = new Map<string, League>()
        for (const [, matches] of Object.entries(grouped)) {
          for (const match of matches) {
            const leagueId = String(match.league?.id)
            if (!leagueId || PRIORITY_IDS.has(leagueId) || seen.has(leagueId)) continue
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
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadOthers()
  }, [])

  useEffect(() => { 
  setOpen(false)
  document.body.style.overflow = "" // ← force la réinitialisation
}, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])
  useEffect(() => {
  // Sécurité : fermer le menu si la page se recharge
  setOpen(false)
  document.body.style.overflow = ""
}, [])

  function navigate(href: string) { setOpen(false); router.push(href) }

  const priorityWithCountry = PRIORITY_LEAGUES.map(l => ({
    id: l.id, name: l.name,
    country: lang === 'fr' ? l.countryFr : l.countryEn,
    logo: l.logo, darkBg: l.darkBg,
  }))

  const othersTranslated = otherLeagues.map(l => ({
    ...l, country: translateCountry(l.country, lang),
  }))

  return (
    <>
      <button onClick={() => setOpen(true)} className="mobile-menu-btn" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-header">
            <div className="topbar__logo">
              <div className="topbar__logo-dot" />
              <span>NyxScores</span>
            </div>
            <button onClick={() => setOpen(false)} className="mobile-menu-close" aria-label="Fermer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6"  x2="6"  y2="18" />
                <line x1="6"  y1="6"  x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="mobile-menu-body">

            {/* Sports */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">{t('sports')}</p>
              <div className="mobile-menu-sports">
                {SPORTS.map(s => (
                  <button key={s.href} onClick={() => navigate(s.href)}
                    className={`mobile-menu-sport-btn ${
                      pathname === s.href || (s.href !== "/" && pathname.startsWith(s.href)) ? "active" : ""
                    }`}
                  >
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <span>{t(s.key as any)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compétitions prioritaires */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">{t('competitions')}</p>
              {priorityWithCountry.map(league => (
                <LeagueRow key={league.id}
                  name={league.name} country={league.country}
                  logo={league.logo} darkBg={league.darkBg}
                  isActive={pathname === `/ligue/${league.id}`}
                  onClick={() => navigate(`/ligue/${league.id}`)}
                />
              ))}
            </div>

            {/* Autres ligues du jour */}
            <div className="mobile-menu-section">
              <button
                onClick={() => setOthersOpen(!othersOpen)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "10px 12px",
                  border: "none", borderRadius: "10px", background: "transparent",
                  cursor: "pointer", color: "#64748b",
                  fontSize: "11px", fontWeight: 700,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                }}
              >
                <span>{t('others')} ({othersTranslated.length})</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: othersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {othersOpen && (
                loading
                  ? <p style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>{t('loading')}…</p>
                  : othersTranslated.map(l => (
                      <LeagueRow key={l.id}
                        name={l.name} country={l.country}
                        logo={l.logo}
                        isActive={pathname === `/ligue/${l.id}`}
                        onClick={() => navigate(`/ligue/${l.id}`)}
                      />
                    ))
              )}
            </div>

            {/* Favoris */}
            <div className="mobile-menu-section">
              <LeagueRow
                name={t("my_favorites")} country=""
                logo="" emoji="⭐"
                logoStyle={{ background: "#fef9c3" }}
                isActive={pathname === "/favoris"}
                onClick={() => navigate("/favoris")}
              />
            </div>

            {/* ─── Paramètres ─── */}
            <div className="mobile-menu-section" style={{
              borderTop: "1px solid #f1f5f9",
              paddingTop: 8,
              marginTop: 8,
            }}>
              <p className="mobile-menu-section-title">Paramètres</p>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px",
              }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                  Langue
                </span>
                <LangToggle />
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px",
              }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                  Mode sombre
                </span>
                <ThemeToggle />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}

function LeagueRow({ name, country, logo, darkBg, isActive, onClick, emoji, logoStyle }: {
  name: string; country: string; logo: string | null; darkBg?: boolean
  isActive: boolean; onClick: () => void; emoji?: string; logoStyle?: React.CSSProperties
}) {
  return (
    <button onClick={onClick} className={`mobile-menu-league-item ${isActive ? "active" : ""}`}>
      <div className="mobile-menu-league-logo"
        style={{ background: logoStyle?.background ?? (darkBg ? "#1a1f3c" : "#f1f5f9"), ...logoStyle }}>
        {emoji ? (
          <span style={{ fontSize: 18 }}>{emoji}</span>
        ) : logo ? (
          <img src={logo} alt={name} style={{ width: 22, height: 22, objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 9, fontWeight: 700, color: darkBg ? "#fff" : "#64748b" }}>
            {name.split(" ").map(w => w[0]).slice(0, 2).join("")}
          </span>
        )}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div className="mobile-menu-league-name">{name}</div>
        {country && <div className="mobile-menu-league-country">{country}</div>}
      </div>
      {isActive && (
        <div style={{ width: 4, height: 20, borderRadius: 2, background: "#2563eb", flexShrink: 0 }} />
      )}
    </button>
  )
}