"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

// ─── INTERNATIONALE ─────────────────────────────────────────
const INTERNATIONAL_LEAGUES = [
  { id: "17423", nameFr: "Ligue des Champions", nameEn: "Champions League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",
    darkBg: true },   // ← logo blanc, fond sombre
  { id: "19374", nameFr: "Ligue Europa", nameEn: "Europa League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
    darkBg: true },   // ← logo blanc, fond sombre
  { id: "20696", nameFr: "Ligue Conférence", nameEn: "Conference League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://highlightly.net/soccer/images/leagues/20696.png", darkBg: false },
  { id: "28543", nameFr: "Coupe du Monde", nameEn: "FIFA World Cup",
    countryFr: "International", countryEn: "International",
    logo: "https://highlightly.net/soccer/images/leagues/28543.png", darkBg: false },
  { id: "6132",  nameFr: "UEFA Euro", nameEn: "UEFA Euro",
    countryFr: "Europe", countryEn: "Europe",
    logo: "https://highlightly.net/soccer/images/leagues/6132.png", darkBg: false },
  { id: "117551", nameFr: "Coupe d'Afrique des Nations", nameEn: "Africa Cup of Nations",
    countryFr: "Afrique", countryEn: "Africa",
    logo: "https://highlightly.net/soccer/images/leagues/117551.png", darkBg: false },
  { id: "112759", nameFr: "Copa América", nameEn: "Copa América",
    countryFr: "Amér. du Sud", countryEn: "South America",
    logo: "https://highlightly.net/soccer/images/leagues/112759.png", darkBg: false },
]

// ─── LIGUES FAVORITES ───────────────────────────────────────
const FAVORITE_LEAGUES = [
  { id: "33973",  nameFr: "Premier League",  nameEn: "Premier League",
    countryFr: "Angleterre", countryEn: "England",
    logo: "https://highlightly.net/soccer/images/leagues/33973.png", darkBg: false },
  { id: "67162",  nameFr: "Bundesliga",      nameEn: "Bundesliga",
    countryFr: "Allemagne",  countryEn: "Germany",
    logo: "https://highlightly.net/soccer/images/leagues/67162.png", darkBg: false },
  { id: "119924", nameFr: "La Liga",         nameEn: "La Liga",
    countryFr: "Espagne",    countryEn: "Spain",
    logo: "https://highlightly.net/soccer/images/leagues/119924.png", darkBg: false },
  { id: "52695",  nameFr: "Ligue 1",         nameEn: "Ligue 1",
    countryFr: "France",     countryEn: "France",
    logo: "https://highlightly.net/soccer/images/leagues/52695.png", darkBg: false },
  { id: "115669", nameFr: "Serie A",         nameEn: "Serie A",
    countryFr: "Italie",     countryEn: "Italy",
    logo: "https://highlightly.net/soccer/images/leagues/115669.png", darkBg: false },
  { id: "75672",  nameFr: "Eredivisie",      nameEn: "Eredivisie",
    countryFr: "Pays-Bas",   countryEn: "Netherlands",
    logo: "https://highlightly.net/soccer/images/leagues/75672.png", darkBg: false },
  { id: "80778",  nameFr: "Primeira Liga",   nameEn: "Primeira Liga",
    countryFr: "Portugal",   countryEn: "Portugal",
    logo: "https://highlightly.net/soccer/images/leagues/80778.png", darkBg: false },
  { id: "173537", nameFr: "Süper Lig",       nameEn: "Süper Lig",
    countryFr: "Turquie",    countryEn: "Turkey",
    logo: "https://highlightly.net/soccer/images/leagues/173537.png" , darkBg: false},
]

const FIXED_IDS = new Set([
  ...INTERNATIONAL_LEAGUES.map(l => l.id),
  ...FAVORITE_LEAGUES.map(l => l.id),
])

type LeagueItem = {
  id: string; name: string; country: string; logo: string | null; darkBg?: boolean
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
  "Rwanda": "Rwanda", "Gambia": "Gambie", "Africa": "Afrique",
  "China": "Chine", "South Korea": "Corée du Sud",
  "Australia": "Australie", "United Arab Emirates": "Émirats arabes unis",
}

function translateCountry(name: string, lang: string): string {
  if (lang === "fr") return COUNTRY_FR[name] ?? name
  return name
}

function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.includes("thesportsdb.com")) return url
  return `/api/logo?url=${encodeURIComponent(url)}`
}

// ─── Logo Box ── fond blanc systématique pour visibilité ───
function LogoBox({ logo, name, darkBg }: { logo: string | null; name: string; darkBg?: boolean }) {
  const [error, setError] = useState(false)
  const proxied  = proxyLogo(logo)
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div style={{
      width: "28px", height: "28px", borderRadius: "6px",
      background: darkBg ? "#1a1f3c" : "#ffffff",
      border: darkBg ? "none" : "1px solid rgba(0,0,0,0.06)",
      flexShrink: 0, display: "flex", alignItems: "center",
      justifyContent: "center", overflow: "hidden",
    }}>
      {!error && proxied ? (
        <Image src={proxied} alt={name} width={22} height={22}
          style={{ objectFit: "contain", padding: "2px" }}
          onError={() => setError(true)} unoptimized />
      ) : (
        <span style={{ fontSize: "9px", color: darkBg ? "#fff" : "#475569", fontWeight: 700 }}>
          {initials}
        </span>
      )}
    </div>
  )
}

// ─── Bouton de ligue ────────────────────────────────────────
function LeagueBtn({ league, isActive, onClick }: {
  league: LeagueItem; isActive: boolean; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "9px",
        width: "100%", padding: "6px 8px",
        border: "none", borderRadius: "8px",
        background: isActive ? "var(--accent-bg)" : hovered ? "var(--bg-muted)" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.12s", marginBottom: "1px",
      }}
    >
      <LogoBox logo={league.logo} name={league.name} darkBg={league.darkBg} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{
          fontSize: "12.5px", fontWeight: isActive ? 600 : 500,
          color: isActive ? "var(--accent)" : "var(--text-primary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {league.name}
        </div>
        <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "1px" }}>
          {league.country}
        </div>
      </div>
      {isActive && (
        <div style={{ width: "3px", height: "18px", borderRadius: "2px",
          background: "var(--accent)", flexShrink: 0 }} />
      )}
    </button>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "var(--text-muted)",
      padding: "0 6px", marginBottom: "6px", marginTop: "4px",
    }}>
      {label}
    </p>
  )
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)", margin: "10px 4px" }} />
}

// ─── Sidebar principale ─────────────────────────────────────
export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { t, lang } = useT()

  const [othersOpen,    setOthersOpen]    = useState(false)
  const [otherLeagues,  setOtherLeagues]  = useState<LeagueItem[]>([])
  const [loadingOthers, setLoadingOthers] = useState(false)
  const [loaded,        setLoaded]        = useState(false)

  useEffect(() => {
    async function loadOthers() {
      setLoadingOthers(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res   = await fetch(`/api/matches?date=${today}`)
        if (!res.ok) return
        const grouped: Record<string, any[]> = await res.json()
        const seen = new Map<string, LeagueItem>()
        for (const matches of Object.values(grouped)) {
          for (const match of matches) {
            const leagueId = String(match.league?.id)
            if (!leagueId || FIXED_IDS.has(leagueId) || seen.has(leagueId)) continue
            seen.set(leagueId, {
              id:      leagueId,
              name:    match.league.name,
              country: match.country?.name ?? "International",
              logo:    match.league.logo ?? null,
            })
          }
        }
        setOtherLeagues(
          [...seen.values()].sort((a, b) =>
            a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
          )
        )
      } catch (e) {
        console.error("Sidebar others error:", e)
      } finally {
        setLoadingOthers(false)
        setLoaded(true)
      }
    }
    loadOthers()
  }, [])

  const isActive = (id: string) => pathname === `/ligue/${id}`
  const goTo     = (id: string) => router.push(`/ligue/${id}`)

  const internationalItems: LeagueItem[] = INTERNATIONAL_LEAGUES.map(l => ({
    id: l.id,
    name:    lang === "fr" ? l.nameFr : l.nameEn,
    country: lang === "fr" ? l.countryFr : l.countryEn,
    logo: l.logo, darkBg: l.darkBg,
  }))

  const favoriteItems: LeagueItem[] = FAVORITE_LEAGUES.map(l => ({
    id: l.id,
    name:    lang === "fr" ? l.nameFr : l.nameEn,
    country: lang === "fr" ? l.countryFr : l.countryEn,
    logo: l.logo,
  }))

  const othersTranslated: LeagueItem[] = otherLeagues.map(l => ({
    ...l, country: translateCountry(l.country, lang),
  }))

  return (
    <aside className="sidebar-desktop" style={{
      width: "220px", minHeight: "100vh",
      backgroundColor: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      padding: "16px 8px 40px",
      flexShrink: 0, overflowY: "auto",
    }}>

      {/* ── INTERNATIONALE ── */}
      <SectionLabel label={lang === "fr" ? "Internationale" : "International"} />
      {internationalItems.map(l => (
        <LeagueBtn key={l.id} league={l} isActive={isActive(l.id)} onClick={() => goTo(l.id)} />
      ))}

      <Divider />

      {/* ── LIGUES FAVORITES ── */}
      <SectionLabel label={lang === "fr" ? "Ligues favorites" : "Favorite Leagues"} />
      {favoriteItems.map(l => (
        <LeagueBtn key={l.id} league={l} isActive={isActive(l.id)} onClick={() => goTo(l.id)} />
      ))}

      <Divider />

      {/* ── AUTRES COMPÉTITIONS ── */}
      <button
        onClick={() => setOthersOpen(!othersOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "6px 8px",
          border: "none", borderRadius: "8px", background: "transparent",
          cursor: "pointer", color: "var(--text-muted)",
          fontSize: "9.5px", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px",
        }}
      >
        <span>
          {lang === "fr" ? "Autres compétitions" : "Other competitions"}
          {loaded && ` (${othersTranslated.length})`}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: othersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {othersOpen && (
        loadingOthers
          ? <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              {t("loading")}…
            </div>
          : othersTranslated.length === 0
            ? <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                {t("no_matches")}
              </div>
            : othersTranslated.map(l => (
                <LeagueBtn key={l.id} league={l} isActive={isActive(l.id)} onClick={() => goTo(l.id)} />
              ))
      )}

    </aside>
  )
}
