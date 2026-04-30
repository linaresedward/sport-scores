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

interface LiveScore {
  home: string | null;
  away: string | null;
  status: string | null;
}

// ─── Helpers ──────────────────────────────────────────────
function formatDate(dateStr: string, lang: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function getScore(m: ApiMatch) {
  if (m.intHomeScore !== null && m.intAwayScore !== null)
    return `${m.intHomeScore} – ${m.intAwayScore}`;
  return null;
}

function getOpponent(m: ApiMatch, teamId: string) {
  if (m.idHomeTeam === teamId) return { name: m.strAwayTeam, isHome: true };
  return { name: m.strHomeTeam, isHome: false };
}

const LIVE_STATUSES = ["In Progress", "HT", "1H", "2H", "ET", "P", "LIVE", "Extra Time"];

// ─── Fetch matchs équipe ───────────────────────────────────
async function fetchTeamMatches(teamId: string): Promise<FavMatches> {
  try {
    const [nextRes, lastRes] = await Promise.all([
      fetch(`${BASE}/eventsnext.php?id=${teamId}`),
      fetch(`${BASE}/eventslast.php?id=${teamId}`),
    ]);
    const [nextData, lastData] = await Promise.all([nextRes.json(), lastRes.json()]);
    return {
      upcoming: (nextData.events || []).slice(0, 5),
      past: (lastData.results || []).slice(0, 5).reverse(),
    };
  } catch { return { upcoming: [], past: [] }; }
}

// ─── Fetch matchs ligue ────────────────────────────────────
async function fetchLeagueMatches(leagueId: string): Promise<FavMatches> {
  try {
    const leagueRes = await fetch(`${BASE}/lookupleague.php?id=${leagueId}`);
    const leagueData = await leagueRes.json();
    const season: string = leagueData.leagues?.[0]?.strCurrentSeason || "2024-2025";
    const [nextRes, lastRes] = await Promise.all([
      fetch(`${BASE}/eventsnextleague.php?id=${leagueId}`),
      fetch(`${BASE}/eventspastleague.php?id=${leagueId}&s=${season}`),
    ]);
    const [nextData, lastData] = await Promise.all([nextRes.json(), lastRes.json()]);
    return {
      upcoming: (nextData.events || []).slice(0, 5),
      past: (lastData.events || []).slice(-5).reverse(),
    };
  } catch { return { upcoming: [], past: [] }; }
}

// ─── Fetch score live d'un match ──────────────────────────
async function fetchLiveScore(matchId: string): Promise<LiveScore> {
  try {
    const res = await fetch(`${BASE}/lookupevent.php?id=${matchId}`);
    const data = await res.json();
    const ev = data.events?.[0];
    if (!ev) return { home: null, away: null, status: null };
    return {
      home: ev.intHomeScore,
      away: ev.intAwayScore,
      status: ev.strStatus,
    };
  } catch { return { home: null, away: null, status: null }; }
}

// ─── Composant : ligne de match (équipes/ligues) ──────────
function MatchLine({ match, teamId, isPast, lang }: {
  match: ApiMatch; teamId?: string; isPast: boolean; lang: string;
}) {
  const score = getScore(match);
  const opponent = teamId ? getOpponent(match, teamId) : null;

  let resultColor = "#64748b";
  if (isPast && score && teamId) {
    const [h, a] = score.split(" – ").map(Number);
    const isHome = match.idHomeTeam === teamId;
    const my = isHome ? h : a;
    const their = isHome ? a : h;
    if (my > their) resultColor = "#16a34a";
    else if (my < their) resultColor = "#dc2626";
  }

  return (
    <Link href={`/match/${match.idEvent}`} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", borderRadius: "8px", textDecoration: "none", gap: "8px",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "80px", flexShrink: 0 }}>
        {formatDate(match.dateEvent, lang)}
      </span>
      <span style={{ fontSize: "13px", color: "#0f172a", flex: 1, fontWeight: 500 }}>
        {opponent
          ? <><span style={{ color: opponent.isHome ? "#2563eb" : "#64748b", fontSize: "11px", marginRight: "4px" }}>
              {opponent.isHome ? "vs" : "@"}
            </span>{opponent.name}</>
          : <>{match.strHomeTeam} <span style={{ color: "#94a3b8" }}>–</span> {match.strAwayTeam}</>
        }
      </span>
      <span style={{
        fontSize: "13px", fontWeight: 700,
        color: isPast ? resultColor : "#2563eb",
        minWidth: "60px", textAlign: "right", flexShrink: 0,
      }}>
        {isPast ? (score || "–") : (match.strTime?.slice(0, 5) || "TBD")}
      </span>
    </Link>
  );
}

// ─── Composant : carte favori équipe/ligue ────────────────
function FavCard({ fav, type, onRemove, lang }: {
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
    const fetcher = type === "team" ? fetchTeamMatches(fav.id) : fetchLeagueMatches(fav.id);
    fetcher.then((data) => {
      setMatches(data);
      if (data.upcoming.length === 0 && data.past.length > 0) setTab("past");
      setLoading(false);
    });
  }, [fav.id, type]);

  const current = matches?.[tab] || [];

  return (
    <div style={{
      background: "#fff", border: "1px solid #f1f5f9", borderRadius: "16px",
      overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: "16px",
    }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f1f5f9", gap: "12px" }}>
        <Link href={type === "team" ? `/equipe/${fav.id}` : `/ligue/${fav.id}`}
          style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, textDecoration: "none" }}>
          {fav.logo && <img src={fav.logo} alt="" style={{ width: "34px", height: "34px", objectFit: "contain" }} />}
          <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{fav.name}</span>
        </Link>
        <button onClick={onRemove} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "18px", color: "#cbd5e1", padding: "4px 8px", lineHeight: 1, borderRadius: "6px",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
          title={t("remove")}
        >×</button>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0 16px" }}>
        {(["upcoming", "past"] as const).map((tabKey) => {
          const count = matches?.[tabKey]?.length ?? 0;
          const label = tabKey === "upcoming" ? t("upcoming_matches") : t("past_results");
          const isActive = tab === tabKey;
          return (
            <button key={tabKey} onClick={() => setTab(tabKey)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 0", marginRight: "20px",
              fontSize: "12px", fontWeight: isActive ? 700 : 500,
              color: isActive ? "#2563eb" : "#94a3b8",
              borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
            }}>
              {label} {!loading && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Matchs */}
      <div style={{ padding: "8px 4px" }}>
        {loading && <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>⏳ {t("loading")}…</div>}
        {!loading && current.length === 0 && (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
            {tab === "upcoming" ? t("no_upcoming") : t("no_past")}
          </div>
        )}
        {!loading && current.map((m) => (
          <MatchLine key={m.idEvent} match={m} teamId={type === "team" ? fav.id : undefined} isPast={tab === "past"} lang={lang} />
        ))}
      </div>

      {/* Voir tout */}
      {!loading && (
        <div style={{ padding: "8px 16px 14px", textAlign: "right" }}>
          <Link href={type === "team" ? `/equipe/${fav.id}` : `/ligue/${fav.id}`}
            style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
            {t("see_all")} →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Composant : carte match favori ───────────────────────
function FavMatchCard({ match, onRemove, lang }: {
  match: { id: string; homeTeam: string; awayTeam: string; homeLogo?: string; awayLogo?: string; league: string; date: string };
  onRemove: () => void;
  lang: string;
}) {
  const [live, setLive] = useState<LiveScore>({ home: null, away: null, status: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveScore(match.id).then((s) => { setLive(s); setLoading(false); });
    // Refresh toutes les 30s si match en cours
    const interval = setInterval(async () => {
      const s = await fetchLiveScore(match.id);
      setLive(s);
      if (!s.status || !LIVE_STATUSES.includes(s.status)) clearInterval(interval);
    }, 30000);
    return () => clearInterval(interval);
  }, [match.id]);

  const isLive = live.status ? LIVE_STATUSES.includes(live.status) : false;
  const hasScore = live.home !== null && live.away !== null;

  return (
    <Link href={`/match/${match.id}`} style={{
      display: "block", textDecoration: "none",
      background: "#fff", border: `1px solid ${isLive ? "#fca5a5" : "#f1f5f9"}`,
      borderRadius: "16px", overflow: "hidden",
      boxShadow: isLive ? "0 0 0 2px #fee2e2" : "0 1px 4px rgba(0,0,0,0.06)",
      marginBottom: "12px", transition: "box-shadow 0.2s",
    }}>
      <div style={{ padding: "14px 16px" }}>

        {/* Header : ligue + date + statut + supprimer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{match.league}</span>
            <span style={{ fontSize: "11px", color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatDate(match.date, lang)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isLive && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, color: "#ef4444" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s infinite" }} />
                LIVE
              </span>
            )}
            {live.status === "Match Finished" && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>FT</span>
            )}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#cbd5e1", padding: "2px 6px", lineHeight: 1 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
            >×</button>
          </div>
        </div>

        {/* Corps : équipes + scores */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

          {/* Équipe domicile */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
            {match.homeLogo && <img src={match.homeLogo} alt="" style={{ width: "28px", height: "28px", objectFit: "contain" }} />}
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{match.homeTeam}</span>
          </div>

          {/* Score */}
          <div style={{ textAlign: "center", minWidth: "60px" }}>
            {loading ? (
              <span style={{ fontSize: "12px", color: "#cbd5e1" }}>…</span>
            ) : hasScore ? (
              <span style={{ fontSize: "20px", fontWeight: 800, color: isLive ? "#ef4444" : "#0f172a", letterSpacing: "0.05em" }}>
                {live.home} – {live.away}
              </span>
            ) : (
              <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>vs</span>
            )}
          </div>

          {/* Équipe extérieure */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a", textAlign: "right" }}>{match.awayTeam}</span>
            {match.awayLogo && <img src={match.awayLogo} alt="" style={{ width: "28px", height: "28px", objectFit: "contain" }} />}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function FavorisClient() {
  const { teams, leagues, removeFavorite, favMatches, removeFavMatch } = useFavorites();
  const { t, lang } = useT();
  const isEmpty = teams.length === 0 && leagues.length === 0 && favMatches.length === 0;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 24px" }}>

      {/* Titre */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
        <span style={{ fontSize: "28px" }}>⭐</span>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>{t("my_favorites")}</h1>
      </div>

      {/* Vide */}
      {isEmpty && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>☆</div>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#64748b" }}>{t("no_favorites")}</p>
          <p style={{ fontSize: "13px", marginBottom: "24px" }}>{t("no_favorites_sub")}</p>
          <Link href="/" style={{
            display: "inline-block", padding: "10px 20px",
            background: "#2563eb", color: "#fff", borderRadius: "8px",
            fontSize: "13px", fontWeight: 600, textDecoration: "none",
          }}>{t("explore")}</Link>
        </div>
      )}

      {/* ── Matchs épinglés ── */}
      {favMatches.length > 0 && (
        <section style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("pinned_matches")} ({favMatches.length})
          </p>
          {favMatches.map((m) => (
            <FavMatchCard key={m.id} match={m} onRemove={() => removeFavMatch(m.id)} lang={lang} />
          ))}
        </section>
      )}

      {/* ── Ligues ── */}
      {leagues.length > 0 && (
        <section style={{ marginBottom: "8px" }}>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("leagues_label")} ({leagues.length})
          </p>
          {leagues.map((fav) => (
            <FavCard key={fav.id} fav={fav} type="league" onRemove={() => removeFavorite(fav.id, "league")} lang={lang} />
          ))}
        </section>
      )}

      {/* ── Équipes ── */}
      {teams.length > 0 && (
        <section>
          <p style={{
            fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#94a3b8", marginBottom: "12px",
          }}>
            {t("teams_label")} ({teams.length})
          </p>
          {teams.map((fav) => (
            <FavCard key={fav.id} fav={fav} type="team" onRemove={() => removeFavorite(fav.id, "team")} lang={lang} />
          ))}
        </section>
      )}
    </div>
  );
}