"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";
import { useT } from "@/lib/i18n";

const BASE = "https://www.thesportsdb.com/api/v1/json/139695";

// ─── Types ────────────────────────────────────────────────
interface ApiMatch {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  dateEvent: string;
  strTime: string | null;
  strLeague: string;
  strStatus: string | null;
  idHomeTeam: string;
  idAwayTeam: string;
}

interface FavMatches {
  upcoming: ApiMatch[];
  past: ApiMatch[];
}

// ─── Helpers ──────────────────────────────────────────────
function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getScore(m: ApiMatch) {
  if (m.intHomeScore !== null && m.intAwayScore !== null) {
    return `${m.intHomeScore} – ${m.intAwayScore}`;
  }
  return null;
}

function getOpponent(m: ApiMatch, teamId: string) {
  if (m.idHomeTeam === teamId) {
    return { name: m.strAwayTeam, isHome: true };
  }
  return { name: m.strHomeTeam, isHome: false };
}

// ─── Fetch matchs d'une équipe ────────────────────────────
async function fetchTeamMatches(teamId: string): Promise<FavMatches> {
  try {
    const [nextRes, lastRes] = await Promise.all([
      fetch(`${BASE}/eventsnext.php?id=${teamId}`),
      fetch(`${BASE}/eventslast.php?id=${teamId}`),
    ]);
    const [nextData, lastData] = await Promise.all([
      nextRes.json(),
      lastRes.json(),
    ]);
    return {
      upcoming: (nextData.events || []).slice(0, 5),
      past: (lastData.results || []).slice(0, 5).reverse(),
    };
  } catch {
    return { upcoming: [], past: [] };
  }
}

// ─── Fetch matchs d'une ligue ─────────────────────────────
async function fetchLeagueMatches(leagueId: string): Promise<FavMatches> {
  try {
    // Saison courante via détail ligue
    const leagueRes = await fetch(`${BASE}/lookupleague.php?id=${leagueId}`);
    const leagueData = await leagueRes.json();
    const season: string = leagueData.leagues?.[0]?.strCurrentSeason || "2024-2025";

    const [nextRes, lastRes] = await Promise.all([
      fetch(`${BASE}/eventsnextleague.php?id=${leagueId}`),
      fetch(`${BASE}/eventspastleague.php?id=${leagueId}&s=${season}`),
    ]);
    const [nextData, lastData] = await Promise.all([
      nextRes.json(),
      lastRes.json(),
    ]);

    const upcoming = (nextData.events || []).slice(0, 5);
    const past = (lastData.events || []).slice(-5).reverse();

    return { upcoming, past };
  } catch {
    return { upcoming: [], past: [] };
  }
}

// ─── Composant : une ligne de match ───────────────────────
function MatchLine({
  match,
  teamId,
  isPast,
  lang,
}: {
  match: ApiMatch;
  teamId?: string;
  isPast: boolean;
  lang: string;
}) {
  const score = getScore(match);
  const opponent = teamId ? getOpponent(match, teamId) : null;

  // Couleur du résultat
  let resultColor = "#64748b";
  if (isPast && score && teamId) {
    const [h, a] = score.split(" – ").map(Number);
    const isHome = match.idHomeTeam === teamId;
    const myGoals = isHome ? h : a;
    const theirGoals = isHome ? a : h;
    if (myGoals > theirGoals) resultColor = "#16a34a";
    else if (myGoals < theirGoals) resultColor = "#dc2626";
    else resultColor = "#64748b";
  }

  return (
    <Link
      href={`/match/${match.idEvent}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: "8px",
        textDecoration: "none",
        transition: "background 0.15s",
        gap: "8px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Date */}
      <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "80px", flexShrink: 0 }}>
        {formatDate(match.dateEvent, lang)}
      </span>

      {/* Équipes */}
      <span style={{ fontSize: "13px", color: "#0f172a", flex: 1, fontWeight: 500 }}>
        {opponent
          ? <>
              <span style={{ color: opponent.isHome ? "#2563eb" : "#64748b", fontSize: "11px", marginRight: "4px" }}>
                {opponent.isHome ? "vs" : "@"}
              </span>
              {opponent.name}
            </>
          : <>{match.strHomeTeam} <span style={{ color: "#94a3b8" }}>–</span> {match.strAwayTeam}</>
        }
      </span>

      {/* Score ou heure */}
      <span style={{
        fontSize: "13px",
        fontWeight: 700,
        color: isPast ? resultColor : "#2563eb",
        minWidth: "60px",
        textAlign: "right",
        flexShrink: 0,
      }}>
        {isPast
          ? (score || "–")
          : (match.strTime?.slice(0, 5) || "TBD")}
      </span>
    </Link>
  );
}

// ─── Composant : carte d'un favori ────────────────────────
function FavCard({
  fav,
  type,
  onRemove,
  lang,
}: {
  fav: { id: string; name: string; logo?: string };
  type: "team" | "league";
  onRemove: () => void;
  lang: string;
}) {
  const { t } = useT();
  const [matches, setMatches] = useState<FavMatches | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    setLoading(true);
    const fetcher = type === "team"
      ? fetchTeamMatches(fav.id)
      : fetchLeagueMatches(fav.id);

    fetcher.then((data) => {
      setMatches(data);
      // Si pas de prochains matchs, afficher les passés par défaut
      if (data.upcoming.length === 0 && data.past.length > 0) {
        setTab("past");
      }
      setLoading(false);
    });
  }, [fav.id, type]);

  const current = matches?.[tab] || [];

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      marginBottom: "16px",
    }}>
      {/* En-tête de la carte */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 16px",
        borderBottom: "1px solid #f1f5f9",
        gap: "12px",
      }}>
        <Link
          href={type === "team" ? `/equipe/${fav.id}` : `/ligue/${fav.id}`}
          style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, textDecoration: "none" }}
        >
          {fav.logo && (
            <img src={fav.logo} alt="" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
          )}
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            {fav.name}
          </span>
        </Link>

        {/* Bouton supprimer */}
        <button
          onClick={onRemove}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "18px", color: "#cbd5e1", padding: "4px 8px",
            lineHeight: 1, borderRadius: "6px",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
          title={t("remove")}
        >×</button>
      </div>

      {/* Onglets Prochains / Passés */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #f1f5f9",
        padding: "0 16px",
      }}>
        {(["upcoming", "past"] as const).map((tabKey) => {
          const count = matches?.[tabKey]?.length ?? 0;
          const label = tabKey === "upcoming" ? t("upcoming_matches") : t("past_results");
          const isActive = tab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 0", marginRight: "20px",
                fontSize: "12px", fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2563eb" : "#94a3b8",
                borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              {label} {!loading && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Contenu matchs */}
      <div style={{ padding: "8px 4px" }}>
        {loading && (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            ⏳ {t("loading")}…
          </div>
        )}

        {!loading && current.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            {tab === "upcoming" ? t("no_upcoming") : t("no_results")}
          </div>
        )}

        {!loading && current.map((m) => (
          <MatchLine
            key={m.idEvent}
            match={m}
            teamId={type === "team" ? fav.id : undefined}
            isPast={tab === "past"}
            lang={lang}
          />
        ))}
      </div>

      {/* Lien "Voir tout" */}
      {!loading && (
        <div style={{ padding: "8px 16px 14px", textAlign: "right" }}>
          <Link
            href={type === "team" ? `/equipe/${fav.id}` : `/ligue/${fav.id}`}
            style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
          >
            {t("see_all")} →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function FavorisClient() {
  const { teams, leagues, removeFavorite } = useFavorites();
  const { t, lang } = useT();
  const isEmpty = teams.length === 0 && leagues.length === 0;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 24px" }}>

      {/* Titre */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <span style={{ fontSize: "28px" }}>⭐</span>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {t("my_favorites")}
        </h1>
      </div>

      {/* État vide */}
      {isEmpty && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>☆</div>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#64748b" }}>
            {t("no_favorites")}
          </p>
          <p style={{ fontSize: "13px", marginBottom: "24px" }}>
            {t("no_favorites_sub")}
          </p>
          <Link href="/" style={{
            display: "inline-block", padding: "10px 20px",
            background: "#2563eb", color: "#fff",
            borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            textDecoration: "none",
          }}>
            {t("explore")}
          </Link>
        </div>
      )}

      {/* Section Ligues */}
      {leagues.length > 0 && (
        <section style={{ marginBottom: "8px" }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("leagues_label")} ({leagues.length})
          </p>
          {leagues.map((fav) => (
            <FavCard
              key={fav.id}
              fav={fav}
              type="league"
              onRemove={() => removeFavorite(fav.id, "league")}
              lang={lang}
            />
          ))}
        </section>
      )}

      {/* Section Équipes */}
      {teams.length > 0 && (
        <section>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("teams_label")} ({teams.length})
          </p>
          {teams.map((fav) => (
            <FavCard
              key={fav.id}
              fav={fav}
              type="team"
              onRemove={() => removeFavorite(fav.id, "team")}
              lang={lang}
            />
          ))}
        </section>
      )}
    </div>
  );
}