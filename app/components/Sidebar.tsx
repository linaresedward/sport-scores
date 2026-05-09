"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

// ─── INTERNATIONALE ─────────────────────────────────────────
const INTERNATIONAL_LEAGUES = [
  { id: "2486",   nameFr: "Ligue des Champions", nameEn: "Champions League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",
    darkBg: true },
  { id: "3337",   nameFr: "Ligue Europa", nameEn: "Europa League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
    darkBg: true },
  { id: "722432", nameFr: "Ligue Conférence", nameEn: "Conference League",
    countryFr: "UEFA", countryEn: "UEFA",
    logo: "https://highlightly.net/soccer/images/leagues/722432.png", darkBg: false },
  { id: "1635",   nameFr: "Coupe du Monde", nameEn: "FIFA World Cup",
    countryFr: "International", countryEn: "International",
    logo: "https://r2.thesportsdb.com/images/media/league/badge/e7er5g1696521789.png", darkBg: false },
  { id: "4188",   nameFr: "UEFA Euro", nameEn: "UEFA Euro",
    countryFr: "Europe", countryEn: "Europe",
    logo: "https://highlightly.net/soccer/images/leagues/4188.png", darkBg: false },
  { id: "5890",   nameFr: "Coupe d'Afrique des Nations", nameEn: "Africa Cup of Nations",
    countryFr: "Afrique", countryEn: "Africa",
    logo: "https://highlightly.net/soccer/images/leagues/5890.png", darkBg: false },
  { id: "8443",   nameFr: "Copa América", nameEn: "Copa América",
    countryFr: "Amér. du Sud", countryEn: "South America",
    logo: "https://highlightly.net/soccer/images/leagues/8443.png", darkBg: false },
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
  if (lang !== "fr") return name
  return COUNTRY_FR[name] ?? name // garde le fallback local pour rétrocompatibilité
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

// ─── Ligues fixes Hockey ────────────────────────────────────
const HOCKEY_PHARES = [
  { name: "NHL",         countryFr: "États-Unis",  countryEn: "USA",         logo: null },
  { name: "AHL",         countryFr: "États-Unis",  countryEn: "USA",         logo: null },
  { name: "KHL",         countryFr: "Russie",      countryEn: "Russia",      logo: null },
  { name: "SHL",         countryFr: "Suède",       countryEn: "Sweden",      logo: null },
  { name: "Liiga",       countryFr: "Finlande",    countryEn: "Finland",     logo: null },
  { name: "DEL",         countryFr: "Allemagne",   countryEn: "Germany",     logo: null },
  { name: "NLA",         countryFr: "Suisse",      countryEn: "Switzerland", logo: null },
  { name: "PWHL Women",  countryFr: "États-Unis",  countryEn: "USA",         logo: null },
]
const HOCKEY_PHARES_NAMES = new Set(HOCKEY_PHARES.map(l => l.name))

// ─── Ligues fixes Basketball ─────────────────────────────────
const BASKET_PHARES = [
  { name: "NBA",                         countryFr: "États-Unis", countryEn: "USA",    logo: null },
  { name: "EuroLeague Basketball",        countryFr: "Europe",     countryEn: "Europe", logo: null },
  { name: "EuroCup",                      countryFr: "Europe",     countryEn: "Europe", logo: null },
  { name: "French LNB",                   countryFr: "France",     countryEn: "France", logo: null },
  { name: "Spanish ACB",                  countryFr: "Espagne",    countryEn: "Spain",  logo: null },
  { name: "Italian Lega Basket",          countryFr: "Italie",     countryEn: "Italy",  logo: null },
  { name: "Turkish Basketbol Super Ligi", countryFr: "Turquie",    countryEn: "Turkey", logo: null },
  { name: "German BBL",                   countryFr: "Allemagne",  countryEn: "Germany",logo: null },
  { name: "BNXT League",                  countryFr: "Bel/NL",     countryEn: "Bel/NL", logo: null },
  { name: "WNBA",                         countryFr: "États-Unis", countryEn: "USA",    logo: null },
]
const BASKET_PHARES_NAMES = new Set(BASKET_PHARES.map(l => l.name))

// ─── Sous-composant "Autres compétitions" générique ──────────
function OthersSection({
  items, lang, loading, loaded, activeLeague,
  onSelect, labelFr = "Autres compétitions", labelEn = "Other competitions",
}: {
  items: LeagueItem[]; lang: string; loading: boolean; loaded: boolean
  activeLeague: string | null; onSelect: (name: string) => void
  labelFr?: string; labelEn?: string
}) {
  const [open, setOpen] = useState(false)
  const { t } = useT()
  const label = lang === "fr" ? labelFr : labelEn

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "6px 8px", border: "none", borderRadius: "8px",
        background: "transparent", cursor: "pointer", color: "var(--text-muted)",
        fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", marginBottom: "4px",
      }}>
        <span>{label}{loaded ? ` (${items.length})` : ""}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (loading
        ? <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)" }}>{t("loading")}…</div>
        : items.length === 0
          ? <div style={{ padding: "8px", fontSize: "12px", color: "var(--text-muted)" }}>{t("no_matches")}</div>
          : items.map(l => (
              <LeagueBtn key={l.id} league={l} isActive={activeLeague === l.name}
                onClick={() => onSelect(l.name)} />
            ))
      )}
    </>
  )
}

// ─── Sidebar Hockey ──────────────────────────────────────────
function HockeySidebar({ lang, activeLeague, onSelect }: {
  lang: string; activeLeague: string | null; onSelect: (name: string | null) => void
}) {
  const { t } = useT()
  const [others, setOthers]       = useState<LeagueItem[]>([])
  const [loading, setLoading]     = useState(false)
  const [loaded, setLoaded]       = useState(false)
  const [logoMap, setLogoMap]     = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res = await fetch(`/api/hockey?date=${today}`)
        if (!res.ok) return
        const grouped: Record<string, any[]> = await res.json()
        const logos: Record<string, string> = {}
        const seen = new Map<string, LeagueItem>()
        for (const matches of Object.values(grouped)) {
          const first = matches[0]
          if (!first) continue
          const name = first.league?.name ?? ""
          if (first.league?.logo) logos[name] = first.league.logo
          if (!HOCKEY_PHARES_NAMES.has(name) && !seen.has(name)) {
            seen.set(name, {
              id:      name,
              name,
              country: first.country?.name ?? "",
              logo:    first.league?.logo ?? null,
            })
          }
        }
        setLogoMap(logos)
        setOthers([...seen.values()].sort((a, b) =>
          a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
        ))
      } catch {} finally { setLoading(false); setLoaded(true) }
    }
    load()
  }, [])

  const phares: LeagueItem[] = HOCKEY_PHARES.map(l => ({
    id: l.name, name: l.name,
    country: lang === "fr" ? l.countryFr : l.countryEn,
    logo: logoMap[l.name] ?? null,
  }))

  return (
    <>
      <SectionLabel label={lang === "fr" ? "Ligues phares" : "Major Leagues"} />
      {phares.map(l => (
        <LeagueBtn key={l.name} league={l} isActive={activeLeague === l.name}
          onClick={() => onSelect(activeLeague === l.name ? null : l.name)} />
      ))}
      <Divider />
      <OthersSection items={others} lang={lang} loading={loading} loaded={loaded}
        activeLeague={activeLeague} onSelect={(n) => onSelect(activeLeague === n ? null : n)} />
    </>
  )
}

// ─── Sidebar Basketball ──────────────────────────────────────
function BasketballSidebar({ lang, activeLeague, onSelect }: {
  lang: string; activeLeague: string | null; onSelect: (name: string | null) => void
}) {
  const { t } = useT()
  const [others, setOthers]   = useState<LeagueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [logoMap, setLogoMap] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const today = new Date().toISOString().split("T")[0]
        const res = await fetch(`https://www.thesportsdb.com/api/v1/json/139695/eventsday.php?d=${today}&s=Basketball`)
        if (!res.ok) return
        const data = await res.json()
        const events: any[] = data.events ?? []
        const logos: Record<string, string> = {}
        const seen = new Map<string, LeagueItem>()
        for (const ev of events) {
          const name = ev.strLeague ?? ""
          if (ev.strLeagueBadge) logos[name] = ev.strLeagueBadge
          if (!BASKET_PHARES_NAMES.has(name) && !seen.has(name)) {
            seen.set(name, {
              id:      name,
              name,
              country: ev.strCountry ?? "",
              logo:    ev.strLeagueBadge ?? null,
            })
          }
        }
        setLogoMap(logos)
        setOthers([...seen.values()].sort((a, b) =>
          a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
        ))
      } catch {} finally { setLoading(false); setLoaded(true) }
    }
    load()
  }, [])

  const phares: LeagueItem[] = BASKET_PHARES.map(l => ({
    id: l.name, name: l.name,
    country: lang === "fr" ? l.countryFr : l.countryEn,
    logo: logoMap[l.name] ?? null,
  }))

  return (
    <>
      <SectionLabel label={lang === "fr" ? "Ligues phares" : "Major Leagues"} />
      {phares.map(l => (
        <LeagueBtn key={l.name} league={l} isActive={activeLeague === l.name}
          onClick={() => onSelect(activeLeague === l.name ? null : l.name)} />
      ))}
      <Divider />
      <OthersSection items={others} lang={lang} loading={loading} loaded={loaded}
        activeLeague={activeLeague} onSelect={(n) => onSelect(activeLeague === n ? null : n)} />
    </>
  )
}

// ─── Sidebar Football ────────────────────────────────────────
function FootballSidebar({ lang, pathname }: { lang: string; pathname: string }) {
  const router = useRouter()
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
      } catch {} finally { setLoadingOthers(false); setLoaded(true) }
    }
    loadOthers()
  }, [])

  const isActive = (id: string) => pathname === `/ligue/${id}`
  const goTo     = (id: string) => router.push(`/ligue/${id}`)

  const internationalItems: LeagueItem[] = INTERNATIONAL_LEAGUES.map(l => ({
    id: l.id, name: lang === "fr" ? l.nameFr : l.nameEn,
    country: lang === "fr" ? l.countryFr : l.countryEn, logo: l.logo, darkBg: l.darkBg,
  }))
  const favoriteItems: LeagueItem[] = FAVORITE_LEAGUES.map(l => ({
    id: l.id, name: lang === "fr" ? l.nameFr : l.nameEn,
    country: lang === "fr" ? l.countryFr : l.countryEn, logo: l.logo,
  }))
  const othersTranslated: LeagueItem[] = otherLeagues.map(l => ({
    ...l, country: translateCountry(l.country, lang),
  }))

  return (
    <>
      <SectionLabel label={lang === "fr" ? "Internationale" : "International"} />
      {internationalItems.map(l => (
        <LeagueBtn key={l.id} league={l} isActive={isActive(l.id)} onClick={() => goTo(l.id)} />
      ))}
      <Divider />
      <SectionLabel label={lang === "fr" ? "Ligues favorites" : "Favorite Leagues"} />
      {favoriteItems.map(l => (
        <LeagueBtn key={l.id} league={l} isActive={isActive(l.id)} onClick={() => goTo(l.id)} />
      ))}
      <Divider />
      <OthersSection
        items={othersTranslated} lang={lang} loading={loadingOthers} loaded={loaded}
        activeLeague={null} onSelect={(id) => goTo(id)}
        labelFr="Autres compétitions" labelEn="Other competitions"
      />
    </>
  )
}

// ─── Sidebar principale — dispatche selon le sport ───────────
export default function Sidebar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { lang } = useT()

  const [activeLeague, setActiveLeague] = useState<string | null>(null)
  useEffect(() => {
    // Détecte la ligue active depuis le pathname /hockey/league/[slug] ou /basketball/league/[slug]
    const match = pathname.match(/\/(hockey|basketball)\/league\/(.+)/)
    setActiveLeague(match ? decodeURIComponent(match[2]) : null)
  }, [pathname])

  const isHockey     = pathname.startsWith("/hockey")
  const isBasketball = pathname.startsWith("/basketball")

  const selectLeague = (sport: string) => (name: string | null) => {
    if (!name) { router.push(`/${sport}`); setActiveLeague(null); return }
    // Option B : page dédiée avec historique + prochains matchs
    router.push(`/${sport}/league/${encodeURIComponent(name)}`)
    setActiveLeague(name)
  }

  let content: React.ReactNode
  if (isHockey) {
    content = <HockeySidebar lang={lang} activeLeague={activeLeague} onSelect={selectLeague("hockey")} />
  } else if (isBasketball) {
    content = <BasketballSidebar lang={lang} activeLeague={activeLeague} onSelect={selectLeague("basketball")} />
  } else {
    content = <FootballSidebar lang={lang} pathname={pathname} />
  }

  return (
    <aside className="sidebar-desktop" style={{
      width: "220px", backgroundColor: "var(--bg-surface)",
      borderRight: "1px solid var(--border)", padding: "16px 8px 40px",
      flexShrink: 0, overflowY: "auto",
    }}>
      {content}
    </aside>
  )
}
