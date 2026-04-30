"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

const BASE = "https://www.thesportsdb.com/api/v1/json/139695";

const PRIORITY_IDS = [
  { id: "4480", name: "Champions League", country: "UEFA",       logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png", darkBg: true },
  { id: "4481", name: "Europa League",    country: "UEFA",       logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png", darkBg: true },
  { id: "4328", name: "Premier League",   country: "Angleterre", logo: "" },
  { id: "4334", name: "Ligue 1",          country: "France",     logo: "" },
  { id: "4335", name: "La Liga",          country: "Espagne",    logo: "" },
  { id: "4331", name: "Bundesliga",       country: "Allemagne",  logo: "" },
  { id: "4332", name: "Serie A",          country: "Italie",     logo: "" },
];

const PRIORITY_IDS_SET = new Set(PRIORITY_IDS.map(l => l.id));

const SPORTS = [
  { label: "Football",   icon: "⚽", href: "/" },
  { label: "Tennis",     icon: "🎾", href: "/tennis" },
  { label: "Basketball", icon: "🏀", href: "/basketball" },
];

type League = { id: string; name: string; country: string; logo: string; darkBg?: boolean };

export default function MobileMenu() {
  const [open, setOpen]               = useState(false);
  const [logos, setLogos]             = useState<Record<string, string>>({});
  const [otherLeagues, setOtherLeagues] = useState<League[]>([]);
  const [othersOpen, setOthersOpen]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const { t }    = useT();

  // Charger logos prioritaires + autres ligues du jour
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        // Logos des ligues sans override
        const missing = PRIORITY_IDS.filter(l => !l.logo);
        const logoResults = await Promise.all(
          missing.map(async l => {
            try {
              const res  = await fetch(`${BASE}/lookupleague.php?id=${l.id}`);
              const data = await res.json();
              return { id: l.id, logo: data.leagues?.[0]?.strBadge ?? "" };
            } catch { return { id: l.id, logo: "" }; }
          })
        );
        const map: Record<string, string> = {};
        logoResults.forEach(r => { map[r.id] = r.logo; });
        setLogos(map);

        // Autres ligues du jour
        const today = new Date().toISOString().split("T")[0];
        const res   = await fetch(`${BASE}/eventsday.php?d=${today}&s=Soccer`);
        const data  = await res.json();
        const events: any[] = data.events || [];
        const seen = new Map<string, League>();
        for (const ev of events) {
          if (!ev.idLeague || PRIORITY_IDS_SET.has(ev.idLeague) || seen.has(ev.idLeague)) continue;
          seen.set(ev.idLeague, {
            id:      ev.idLeague,
            name:    ev.strLeague,
            country: ev.strCountry || "International",
            logo:    "",
          });
        }
        const others = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));

        // Logos des autres ligues
        const otherLogos = await Promise.all(
          others.map(async l => {
            try {
              const r = await fetch(`${BASE}/lookupleague.php?id=${l.id}`);
              const d = await r.json();
              return d.leagues?.[0]?.strBadge ?? "";
            } catch { return ""; }
          })
        );
        setOtherLeagues(others.map((l, i) => ({ ...l, logo: otherLogos[i] })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      {/* Bouton hamburger */}
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

          {/* Header */}
          <div className="mobile-menu-header">
            <div className="topbar__logo">
              <div className="topbar__logo-dot" />
              <span>SportScores</span>
            </div>
            <button onClick={() => setOpen(false)} className="mobile-menu-close" aria-label="Fermer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6"  x2="6"  y2="18" />
                <line x1="6"  y1="6"  x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Corps scrollable */}
          <div className="mobile-menu-body">

            {/* Sports */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">Sports</p>
              <div className="mobile-menu-sports">
                {SPORTS.map(s => (
                  <button key={s.href} onClick={() => navigate(s.href)}
                    className={`mobile-menu-sport-btn ${
                      pathname === s.href || (s.href !== "/" && pathname.startsWith(s.href)) ? "active" : ""
                    }`}
                  >
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compétitions prioritaires */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">Compétitions</p>
              {PRIORITY_IDS.map(league => {
                const logo     = league.logo || logos[league.id] || "";
                const isActive = pathname === `/ligue/${league.id}`;
                return (
                  <LeagueRow key={league.id} name={league.name} country={league.country}
                    logo={logo} darkBg={league.darkBg} isActive={isActive}
                    onClick={() => navigate(`/ligue/${league.id}`)} />
                );
              })}
            </div>

            {/* Autres ligues du jour */}
            {otherLeagues.length > 0 && (
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
                  <span>Autres ({otherLeagues.length})</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: othersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {othersOpen && (
                  loading
                    ? <p style={{ padding: "8px 12px", fontSize: 12, color: "#94a3b8" }}>Chargement…</p>
                    : otherLeagues.map(l => (
                        <LeagueRow key={l.id} name={l.name} country={l.country}
                          logo={l.logo} isActive={pathname === `/ligue/${l.id}`}
                          onClick={() => navigate(`/ligue/${l.id}`)} />
                      ))
                )}
              </div>
            )}

            {/* Favoris */}
            <div className="mobile-menu-section">
              <LeagueRow
                name={t("my_favorites")} country=""
                logo="" emoji="⭐" logoStyle={{ background: "#fef9c3" }}
                isActive={pathname === "/favoris"}
                onClick={() => navigate("/favoris")}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function LeagueRow({ name, country, logo, darkBg, isActive, onClick, emoji, logoStyle }: {
  name: string; country: string; logo: string; darkBg?: boolean;
  isActive: boolean; onClick: () => void; emoji?: string; logoStyle?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick}
      className={`mobile-menu-league-item ${isActive ? "active" : ""}`}
    >
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
  );
}