"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { normalizeStatus } from "@/lib/highlightly";
import { translateCountry } from "@/lib/labels";
import StandingsPanel from "@/app/components/StandingsPanel";
import LeagueFavoriteButton from "@/app/components/LeagueFavoriteButton";
import { useT } from "@/lib/i18n";

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"];

// ─── Types ────────────────────────────────────────────────
interface HMatch {
  id: number;
  date: string;
  round: string;
  country: { name: string };
  state: { score: { current: string | null; penalties: string | null }; description: string; clock: number | null };
  homeTeam: { id: number; name: string; logo: string | null };
  awayTeam: { id: number; name: string; logo: string | null };
  league:   { id: number; name: string; logo: string | null };
}

interface MatchGroup {
  date: string;
  matches: HMatch[];
}

function proxyLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("thesportsdb.com")) return url;
  return `/api/logo?url=${encodeURIComponent(url)}`;
}

function fmt(date: Date, lang: string) {
  return date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

// ─── Badge de statut ──────────────────────────────────────
function StatusCell({ match, lang }: { match: HMatch; lang: string }) {
  const status = normalizeStatus(match.state.description);
  const clock  = match.state.clock;
  const time   = new Date(match.date).toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });

  if (status === "NS")
    return <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>{time}</span>;
  if (status === "Match Finished" || status === "FT-ET" || status === "FT-P")
    return <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>FT</span>;
  if (status === "HT")
    return <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>MT</span>;
  if (LIVE_STATUSES.includes(status)) {
    const min = clock != null ? `${clock}'` : "";
    const lbl = lang === "fr" ? ({ "1H": "1MT", "2H": "2MT", "ET": "Prol.", "P": "TAB" }[status] ?? status) : status;
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#ef4444" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.2s ease-in-out infinite" }} />
        {lbl}{min ? ` ${min}` : ""}
      </span>
    );
  }
  return <span style={{ fontSize: 11, color: "#94a3b8" }}>{status}</span>;
}

// ─── Ligne de match ───────────────────────────────────────
function MatchRow({ match, lang }: { match: HMatch; lang: string }) {
  const status   = normalizeStatus(match.state.description);
  const score    = match.state.score.current;
  const hasScore = score != null && status !== "NS";
  const [hs, as] = hasScore ? score.split(" - ").map(Number) : [null, null];
  const homeWin  = hasScore && hs! > as!;
  const awayWin  = hasScore && as! > hs!;
  const homeLogo = proxyLogo(match.homeTeam.logo);
  const awayLogo = proxyLogo(match.awayTeam.logo);
  const isLive   = LIVE_STATUSES.includes(status);

  return (
    <Link href={`/match/${match.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="match-row-link" style={{
        display: "grid", gridTemplateColumns: "56px 1fr auto",
        alignItems: "center", padding: "9px 16px", gap: 12,
        borderBottom: "1px solid var(--border)", cursor: "pointer",
      }}>
        {/* Statut */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <StatusCell match={match} lang={lang} />
        </div>

        {/* Équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {homeLogo
              ? <Image src={homeLogo} alt="" width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {match.homeTeam.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {awayLogo
              ? <Image src={awayLogo} alt="" width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Score */}
        {hasScore && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: isLive ? "#ef4444" : homeWin ? "var(--text-primary)" : "var(--text-secondary)" }}>{hs}</span>
            <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: isLive ? "#ef4444" : awayWin ? "var(--text-primary)" : "var(--text-secondary)" }}>{as}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function HighlightlyLeaguePage({ highlightlyId }: { highlightlyId: string }) {
  const { t, lang } = useT();

  const [groups,     setGroups]     = useState<MatchGroup[]>([]);
  const [leagueName, setLeagueName] = useState<string>("");
  const [leagueLogo, setLeagueLogo] = useState<string | null>(null);
  const [country,    setCountry]    = useState<string>("");
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"results" | "fixtures">("fixtures");

  useEffect(() => {
    fetch(`/api/league-matches?leagueId=${highlightlyId}`)
      .then(r => r.json())
      .then(data => {
        if (data.leagueInfo) {
          setLeagueName(data.leagueInfo.name);
          setLeagueLogo(proxyLogo(data.leagueInfo.logo));
        }

        const today = new Date().toISOString().split("T")[0];
        const past: MatchGroup[]   = [];
        const future: MatchGroup[] = [];

        Object.entries(data.matches as Record<string, HMatch[]>)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([date, matches]) => {
            const sorted = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (date < today)  past.push({ date, matches: sorted });
            else               future.push({ date, matches: sorted });
          });

        // Déterminer l'onglet par défaut
        if (future.length > 0) setTab("fixtures");
        else setTab("results");

        // Trier : résultats du plus récent, fixtures du plus proche
        past.sort((a, b) => b.date.localeCompare(a.date));

        setGroups([...past.reverse(), ...future]);
        // Stocker séparément pour les onglets
        (window as any).__lm_past   = past;
        (window as any).__lm_future = future;
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [highlightlyId]);

  const displayed = tab === "results"
    ? ((window as any).__lm_past   || []).slice(0, 5)
    : ((window as any).__lm_future || []).slice(0, 5);

  const logo = leagueLogo;

  return (
    <div className="ligue-content" style={{ flex: 1, padding: "28px 36px", maxWidth: 860 }}>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>

      {/* ─── En-tête ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {logo && <Image src={logo} alt="" width={40} height={40} style={{ objectFit: "contain" }} unoptimized />}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {leagueName || "…"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {country ? translateCountry(country, lang) + " · " : ""}2025-2026
          </p>
        </div>
        <LeagueFavoriteButton id={highlightlyId} name={leagueName} logo={logo ?? ""} />
        <StandingsPanel leagueId={highlightlyId} leagueName={leagueName} />
      </div>

      {/* ─── Onglets ─── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border)", marginBottom: 20 }}>
        {(["fixtures", "results"] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 20px", fontSize: 13, fontWeight: tab === tb ? 700 : 500,
            color: tab === tb ? "var(--accent)" : "var(--text-muted)",
            borderBottom: tab === tb ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: -2, transition: "color 0.15s, border-color 0.15s",
          }}>
            {tb === "fixtures" ? (lang === "fr" ? "Prochains matchs" : "Fixtures") : (lang === "fr" ? "Résultats" : "Results")}
          </button>
        ))}
      </div>

      {/* ─── Matchs ─── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          {t("loading")}…
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          {lang === "fr" ? "Aucun match disponible" : "No matches available"}
        </div>
      ) : (
        displayed.map(({ date, matches }: MatchGroup) => (
          <div key={date} style={{ marginBottom: 20 }}>
            {/* En-tête date */}
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--text-muted)",
              padding: "8px 0", borderBottom: "2px solid var(--border)",
            }}>
              {fmt(new Date(date + "T12:00:00"), lang)}
            </div>
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
              {matches.map((m: HMatch) => <MatchRow key={m.id} match={m} lang={lang} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
