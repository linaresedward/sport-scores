"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const PRIORITY_IDS = [
  { id: "4480", name: "Champions League", country: "UEFA",       logoOverride: "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png", darkBg: true },
  { id: "4481", name: "Europa League",    country: "UEFA",       logoOverride: "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png", darkBg: true },
  { id: "4328", name: "Premier League",   country: "Angleterre", logoOverride: "" },
  { id: "4334", name: "Ligue 1",          country: "France",     logoOverride: "" },
  { id: "4335", name: "La Liga",          country: "Espagne",    logoOverride: "" },
  { id: "4331", name: "Bundesliga",       country: "Allemagne",  logoOverride: "" },
  { id: "4332", name: "Serie A",          country: "Italie",     logoOverride: "" },
];

type League = {
  id: string;
  name: string;
  country: string;
  logo: string;
  darkBg?: boolean;
};

async function getLeagueLogo(id: string, key: string): Promise<string> {
  try {
    const r = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${key}/lookupleague.php?id=${id}`
    );
    const d = await r.json();
    const l = d.leagues?.[0];
    return l?.strBadge || l?.strLogo || "";
  } catch {
    return "";
  }
}

function LogoBox({ logo, name, darkBg }: { logo: string; name: string; darkBg?: boolean }) {
  const [error, setError] = useState(false);
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{
      width: "30px", height: "30px", borderRadius: "6px",
      background: darkBg ? "#1a1f3c" : "#f1f5f9",
      flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {!error && logo ? (
        <Image
          src={logo} alt={name} width={24} height={24}
          style={{ objectFit: "contain", padding: "2px" }}
          onError={() => setError(true)}
          unoptimized
        />
      ) : (
        <span style={{ fontSize: "10px", color: darkBg ? "#fff" : "#64748b", fontWeight: 700 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

function LeagueItem({ league, isActive, onClick }: {
  league: League; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        width: "100%", padding: "7px 10px",
        border: "none", borderRadius: "8px",
        background: isActive ? "rgba(37,99,235,0.08)" : hovered ? "#f8fafc" : "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.12s", marginBottom: "1px",
      }}
    >
      <LogoBox logo={league.logo} name={league.name} darkBg={league.darkBg} />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{
          fontSize: "13px", fontWeight: isActive ? 600 : 500,
          color: isActive ? "#2563eb" : "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {league.name}
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
          {league.country}
        </div>
      </div>
      {isActive && (
        <div style={{
          width: "3px", height: "20px", borderRadius: "2px",
          background: "#2563eb", flexShrink: 0,
        }} />
      )}
    </button>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [othersOpen, setOthersOpen] = useState(false);
  const [priorityLeagues, setPriorityLeagues] = useState<League[]>(
    PRIORITY_IDS.map(l => ({ id: l.id, name: l.name, country: l.country, logo: "", darkBg: l.darkBg }))
  );
  const [otherLeagues, setOtherLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SPORTSDB_KEY!;

    async function loadAll() {
      // Logos des 7 prioritaires en parallèle
      const logos = await Promise.all(
        PRIORITY_IDS.map(l =>
          l.logoOverride ? Promise.resolve(l.logoOverride) : getLeagueLogo(l.id, key)
        )
      );
      // ✅ darkBg bien transmis ici
      setPriorityLeagues(
        PRIORITY_IDS.map((l, i) => ({
          id: l.id,
          name: l.name,
          country: l.country,
          logo: logos[i],
          darkBg: l.darkBg,
        }))
      );

      // Autres ligues depuis les matchs du jour
      try {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${today}&s=Soccer`
        );
        const data = await res.json();
        const events: any[] = data.events || [];
        const priorityIds = new Set(PRIORITY_IDS.map(l => l.id));
        const seen = new Map<string, League>();

        for (const ev of events) {
          if (!ev.idLeague || priorityIds.has(ev.idLeague) || seen.has(ev.idLeague)) continue;
          seen.set(ev.idLeague, {
            id: ev.idLeague,
            name: ev.strLeague,
            country: ev.strCountry || "International",
            logo: "",
          });
        }

        const others = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
        const otherLogos = await Promise.all(
          others.map(l => getLeagueLogo(l.id, key))
        );
        setOtherLeagues(others.map((l, i) => ({ ...l, logo: otherLogos[i] })));
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    }

    loadAll();
  }, []);

  return (
    <aside className="sidebar-desktop" style={{
      width: "224px", minHeight: "100vh",
      backgroundColor: "#ffffff",
      borderRight: "1px solid #e2e8f0",
      padding: "20px 10px",
      flexShrink: 0, overflowY: "auto",
    }}>
      <p style={{
        fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#94a3b8",
        padding: "0 6px", marginBottom: "10px",
      }}>
        Compétitions
      </p>

      {priorityLeagues.map(league => (
        <LeagueItem
          key={league.id} league={league}
          isActive={pathname === `/ligue/${league.id}`}
          onClick={() => router.push(`/ligue/${league.id}`)}
        />
      ))}

      <div style={{ height: "1px", background: "#f1f5f9", margin: "10px 4px" }} />

      <button
        onClick={() => setOthersOpen(!othersOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "7px 10px",
          border: "none", borderRadius: "8px", background: "transparent",
          cursor: "pointer", color: "#64748b", fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px",
        }}
      >
        <span>Autres {!loading && `(${otherLeagues.length})`}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: othersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {othersOpen && (
        loading
          ? <div style={{ padding: "8px 10px", fontSize: "12px", color: "#94a3b8" }}>
              Chargement…
            </div>
          : otherLeagues.map(league => (
              <LeagueItem
                key={league.id} league={league}
                isActive={pathname === `/ligue/${league.id}`}
                onClick={() => router.push(`/ligue/${league.id}`)}
              />
            ))
      )}
    </aside>
  );
}