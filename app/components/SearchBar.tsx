"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

const BASE = "https://www.thesportsdb.com/api/v1/json/139695";

interface SearchTeam {
  idTeam: string; strTeam: string; strLeague: string;
  strTeamBadge: string; strCountry: string;
}
interface SearchPlayer {
  idPlayer: string; strPlayer: string; strTeam: string;
  strThumb: string; strNationality: string; strPosition: string;
}
interface SearchLeague {
  idLeague: string; strLeague: string; strCountry: string; strBadge: string;
}
interface Results {
  leagues: SearchLeague[]; teams: SearchTeam[]; players: SearchPlayer[];
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchBar() {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ leagues: [], teams: [], players: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults({ leagues: [], teams: [], players: [] });
      return;
    }
    async function search() {
      setLoading(true);
      try {
        const [teamsRes, playersRes, leaguesRes] = await Promise.all([
          fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(debouncedQuery)}`),
          fetch(`${BASE}/searchplayers.php?p=${encodeURIComponent(debouncedQuery)}`),
          fetch(`${BASE}/search_all_leagues.php?c=&s=Soccer`),
        ]);
        const [teamsData, playersData, leaguesData] = await Promise.all([
          teamsRes.json(), playersRes.json(), leaguesRes.json()
        ]);
        const allLeagues: SearchLeague[] = leaguesData.countrys ?? [];
        const filteredLeagues = allLeagues
          .filter(l => l.strLeague.toLowerCase().includes(debouncedQuery.toLowerCase()))
          .slice(0, 4);
        setResults({
          teams:   (teamsData.teams    ?? []).slice(0, 5),
          players: (playersData.player ?? []).slice(0, 5),
          leagues: filteredLeagues,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [debouncedQuery]);

  const hasResults = results.leagues.length > 0 || results.teams.length > 0 || results.players.length > 0;

  function navigate(href: string) {
    setOpen(false); setQuery(""); router.push(href);
  }

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, maxWidth: "380px" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: "#f1f5f9", borderRadius: "10px", padding: "7px 12px",
        border: open ? "1.5px solid #2563eb" : "1.5px solid transparent",
        transition: "border 0.15s",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t("search_placeholder")}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            border: "none", background: "transparent", outline: "none",
            fontSize: "13px", color: "#0f172a", width: "100%",
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults({ leagues: [], teams: [], players: [] }); }}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", fontSize: "16px", lineHeight: 1, padding: 0 }}>×</button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 1000,
          maxHeight: "420px", overflowY: "auto",
        }}>
          {loading && (
            <div style={{ padding: "16px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
              {t("searching")}
            </div>
          )}
          {!loading && !hasResults && (
            <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "#94a3b8" }}>
              {t("no_results")} « {query} »
            </div>
          )}
          {results.leagues.length > 0 && (
            <Section title={t("search_leagues")}>
              {results.leagues.map(l => (
                <ResultRow key={l.idLeague} logo={l.strBadge} name={l.strLeague}
                  sub={l.strCountry} onClick={() => navigate(`/ligue/${l.idLeague}`)} />
              ))}
            </Section>
          )}
          {results.teams.length > 0 && (
            <Section title={t("search_teams")}>
              {results.teams.map(t2 => (
                <ResultRow key={t2.idTeam} logo={t2.strTeamBadge} name={t2.strTeam}
                  sub={t2.strLeague} onClick={() => navigate(`/equipe/${t2.idTeam}`)} />
              ))}
            </Section>
          )}
          {results.players.length > 0 && (
            <Section title={t("search_players")}>
              {results.players.map(p => (
                <ResultRow key={p.idPlayer} logo={p.strThumb} name={p.strPlayer}
                  sub={`${p.strPosition ?? ""} · ${p.strTeam ?? ""}`}
                  onClick={() => navigate(`/joueur/${p.idPlayer}`)} round />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "#94a3b8", padding: "10px 14px 4px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ logo, name, sub, onClick, round }: {
  logo?: string; name: string; sub?: string; onClick: () => void; round?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        width: "100%", padding: "8px 14px", border: "none",
        background: hovered ? "#f8fafc" : "transparent",
        cursor: "pointer", textAlign: "left", transition: "background 0.1s",
      }}>
      <div style={{
        width: "28px", height: "28px", flexShrink: 0,
        borderRadius: round ? "50%" : "6px", background: "#f1f5f9",
        overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          : <span style={{ fontSize: "10px", color: "#94a3b8" }}>?</span>
        }
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
        {sub && (
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
        )}
      </div>
    </button>
  );
}