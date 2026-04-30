"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useT } from "@/lib/i18n";

const BASE = "https://www.thesportsdb.com/api/v1/json/139695";

const PRIORITY_IDS = [
  { id: "4480", name: "Champions League", country: "UEFA", logo: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png", darkBg: true },
  { id: "4481", name: "Europa League",    country: "UEFA", logo: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png", darkBg: true },
  { id: "4328", name: "Premier League",   country: "Angleterre", logo: "" },
  { id: "4334", name: "Ligue 1",          country: "France",     logo: "" },
  { id: "4335", name: "La Liga",          country: "Espagne",    logo: "" },
  { id: "4331", name: "Bundesliga",       country: "Allemagne",  logo: "" },
  { id: "4332", name: "Serie A",          country: "Italie",     logo: "" },
];

const SPORTS = [
  { label: "Football", icon: "⚽", href: "/" },
  { label: "Tennis",   icon: "🎾", href: "/tennis" },
  { label: "Basketball", icon: "🏀", href: "/basketball" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();

  // Charger les logos manquants
  useEffect(() => {
    async function loadLogos() {
      const missing = PRIORITY_IDS.filter(l => !l.logo);
      const results = await Promise.all(
        missing.map(async l => {
          try {
            const res = await fetch(`${BASE}/lookupleague.php?id=${l.id}`);
            const data = await res.json();
            return { id: l.id, logo: data.leagues?.[0]?.strBadge ?? "" };
          } catch { return { id: l.id, logo: "" }; }
        })
      );
      const map: Record<string, string> = {};
      results.forEach(r => { map[r.id] = r.logo; });
      setLogos(map);
    }
    loadLogos();
  }, []);

  // Fermer sur changement de route
  useEffect(() => { setOpen(false); }, [pathname]);

  // Bloquer le scroll body quand ouvert
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
      {/* Bouton hamburger — visible uniquement mobile */}
      <button
        onClick={() => setOpen(true)}
        className="mobile-menu-btn"
        aria-label="Menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay plein écran */}
      {open && (
        <div className="mobile-menu-overlay">

          {/* Header */}
          <div className="mobile-menu-header">
            <div className="topbar__logo">
              <div className="topbar__logo-dot" />
              <span>SportScores</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mobile-menu-close"
              aria-label="Fermer"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6"  x2="6"  y2="18" />
                <line x1="6"  y1="6"  x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="mobile-menu-body">

            {/* Sports */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">Sports</p>
              <div className="mobile-menu-sports">
                {SPORTS.map(s => (
                  <button
                    key={s.href}
                    onClick={() => navigate(s.href)}
                    className={`mobile-menu-sport-btn ${pathname === s.href || (s.href !== "/" && pathname.startsWith(s.href)) ? "active" : ""}`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ligues */}
            <div className="mobile-menu-section">
              <p className="mobile-menu-section-title">Compétitions</p>
              {PRIORITY_IDS.map(league => {
                const logo = league.logo || logos[league.id] || "";
                const isActive = pathname === `/ligue/${league.id}`;
                return (
                  <button
                    key={league.id}
                    onClick={() => navigate(`/ligue/${league.id}`)}
                    className={`mobile-menu-league-item ${isActive ? "active" : ""}`}
                  >
                    <div className="mobile-menu-league-logo"
                      style={{ background: league.darkBg ? "#1a1f3c" : "#f1f5f9" }}>
                      {logo ? (
                        <img src={logo} alt={league.name}
                          style={{ width: 22, height: 22, objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700,
                          color: league.darkBg ? "#fff" : "#64748b" }}>
                          {league.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div className="mobile-menu-league-name">{league.name}</div>
                      <div className="mobile-menu-league-country">{league.country}</div>
                    </div>
                    {isActive && (
                      <div style={{ width: 4, height: 20, borderRadius: 2,
                        background: "#2563eb", flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Favoris */}
            <div className="mobile-menu-section">
              <button
                onClick={() => navigate("/favoris")}
                className="mobile-menu-league-item"
              >
                <div className="mobile-menu-league-logo" style={{ background: "#fef9c3" }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div className="mobile-menu-league-name">{t("my_favorites")}</div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}