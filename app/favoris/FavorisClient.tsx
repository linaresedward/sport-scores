"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites, FavoriteMatch } from "@/hooks/useFavorites";
import { normalizeStatus } from "@/lib/highlightly";
import { useT } from "@/lib/i18n";

// ─── Sons depuis les fichiers audio ──────────────────────
function playSound(type: "goal" | "cancelled" | "halftime" | "fulltime") {
  try {
    if (type === "fulltime") {
      // Fin de match = mi-temps × 2
      const a = new Audio("/sounds/mi-temps.mp3")
      a.play().catch(() => {})
      a.addEventListener("ended", () => {
        new Audio("/sounds/mi-temps.mp3").play().catch(() => {})
      })
    } else {
      const file = type === "goal" ? "but.mp3"
                 : type === "cancelled" ? "but-annule.mp3"
                 : "mi-temps.mp3"
      new Audio(`/sounds/${file}`).play().catch(() => {})
    }
  } catch { /* audio indisponible */ }
}

// ─── Types ────────────────────────────────────────────────
const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "P"];

interface GoalFlash {
  team: "home" | "away";
  phase: "pending" | "confirmed" | "cancelled";
}

interface MatchLive {
  score:         string | null;
  status:        string;
  clock:         number | null;
  homeRedCards:  number;
  awayRedCards:  number;
  goalFlash:     GoalFlash | null;
}

interface MatchGroup {
  key:          string;   // leagueId ou league name
  leagueName:   string;
  leagueLogo?:  string;
  matches:      FavoriteMatch[];
  earliestTime: string;
}

// ─── Proxy logo ───────────────────────────────────────────
function proxyLogo(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes("thesportsdb.com")) return url;
  return `/api/logo?url=${encodeURIComponent(url)}`;
}

// ─── Carton rouge ─────────────────────────────────────────
function RedCard({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: count > 1 ? 18 : 14, height: 18,
      background: "#ef4444", borderRadius: 3,
      fontSize: 10, fontWeight: 700, color: "#fff",
      marginLeft: 5, flexShrink: 0, letterSpacing: 0,
    }}>
      {count > 1 ? count : ""}
    </span>
  );
}

// ─── Badge statut ─────────────────────────────────────────
function StatusBadge({ status, clock, lang }: { status: string; clock: number | null; lang: string }) {
  if (status === "NS" || status === "Not started") {
    return null;
  }
  if (status === "Match Finished") {
    return (
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>FT</span>
    );
  }
  if (status === "HT") {
    return (
      <span style={{
        padding: "2px 7px", borderRadius: 999,
        background: "#fffbeb", border: "1px solid #fde68a",
        fontSize: 11, fontWeight: 700, color: "#92400e",
      }}>HT</span>
    );
  }
  const liveLabel: Record<string, Record<string, string>> = {
    fr: { "1H": "1MT", "2H": "2MT", "ET": "Prol.", "P": "TAB" },
    en: { "1H": "1H",  "2H": "2H",  "ET": "ET",    "P": "PEN" },
  };
  const label = liveLabel[lang]?.[status] ?? status;
  const clockStr = clock !== null
    ? (clock === 90 && status === "2H" ? "90+" : clock === 45 && status === "1H" ? "45+" : `${clock}`)
    : "";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 999,
      background: "#fef2f2", border: "1px solid #fecaca",
      fontSize: 11, fontWeight: 700,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: "#ef4444",
        animation: "livePulse 1.2s ease-in-out infinite",
      }} />
      <span style={{ color: "#b91c1c" }}>{label}{clockStr ? ` ${clockStr}'` : ""}</span>
    </span>
  );
}

// ─── Ligne de match dans un groupe ────────────────────────
function MatchRow({
  match, live, onRemove, lang,
}: {
  match: FavoriteMatch;
  live: MatchLive | null;
  onRemove: () => void;
  lang: string;
}) {
  const status   = live?.status ?? "NS";
  const isLive   = LIVE_STATUSES.includes(status);
  const hasScore = live?.score != null && status !== "NS";
  const [homeScore, awayScore] = hasScore
    ? (live!.score!.split(" - ").map(Number) as [number, number])
    : [null, null];
  const homeWin = hasScore && homeScore! > awayScore!;
  const awayWin = hasScore && awayScore! > homeScore!;

  const homeLogo = proxyLogo(match.homeLogo);
  const awayLogo = proxyLogo(match.awayLogo);
  const flash    = live?.goalFlash;

  return (
    <div style={{ position: "relative" }}>
      {/* Flash BUT / But annulé */}
      {flash && flash.phase !== "pending" && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          background: flash.phase === "confirmed" ? "rgba(22,163,74,0.92)" : "rgba(239,68,68,0.88)",
          color: "#fff", textAlign: "center",
          padding: "5px 12px", fontSize: 13, fontWeight: 700,
          animation: "goalFlashAnim 5s forwards",
          borderRadius: "0 0 8px 8px",
          pointerEvents: "none",
        }}>
          {flash.team === "home" ? match.homeTeam : match.awayTeam} — {flash.phase === "confirmed" ? "BUT !" : "BUT ANNULÉ"}
        </div>
      )}

      <Link
        href={`/match/${match.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
      <div style={{
        display: "flex", alignItems: "center",
        padding: "10px 14px", gap: 10,
        borderBottom: "1px solid var(--border)",
        background: flash ? (flash.phase === "confirmed" ? "rgba(22,163,74,0.04)" : "rgba(239,68,68,0.04)") : "transparent",
        transition: "background 0.3s",
        cursor: "pointer",
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-muted)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = flash ? (flash.phase === "confirmed" ? "rgba(22,163,74,0.04)" : "rgba(239,68,68,0.04)") : "transparent")}
      >
        {/* Heure / statut */}
        <div style={{ width: 48, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          {status === "NS" || !live ? (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              {match.time || "—"}
            </span>
          ) : (
            <StatusBadge status={status} clock={live.clock} lang={lang} />
          )}
        </div>

        {/* Équipes */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Domicile */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            {homeLogo
              ? <Image src={homeLogo} alt="" width={15} height={15} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 13, fontWeight: homeWin ? 700 : 400,
              color: homeWin ? "var(--text-primary)" : "var(--text-secondary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {match.homeTeam}
            </span>
            <RedCard count={live?.homeRedCards ?? 0} />
            {flash?.team === "home" && flash.phase === "pending" && (
              <span style={{ color: '#ef4444', fontSize: 8, animation: 'livePulse 0.7s ease-in-out infinite', flexShrink: 0 }}>⬤</span>
            )}
          </div>
          {/* Extérieur */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {awayLogo
              ? <Image src={awayLogo} alt="" width={15} height={15} style={{ objectFit: "contain" }} unoptimized />
              : <div style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
            }
            <span style={{
              fontSize: 13, fontWeight: awayWin ? 700 : 400,
              color: awayWin ? "var(--text-primary)" : "var(--text-secondary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {match.awayTeam}
            </span>
            <RedCard count={live?.awayRedCards ?? 0} />
            {flash?.team === "away" && flash.phase === "pending" && (
              <span style={{ color: '#ef4444', fontSize: 8, animation: 'livePulse 0.7s ease-in-out infinite', flexShrink: 0 }}>⬤</span>
            )}
          </div>
        </div>

        {/* Score */}
        {hasScore && (
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{
              fontSize: 13, fontWeight: homeWin ? 700 : 400,
              color: isLive ? "#ef4444" : homeWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{homeScore}</span>
            <span style={{
              fontSize: 13, fontWeight: awayWin ? 700 : 400,
              color: isLive ? "#ef4444" : awayWin ? "var(--text-primary)" : "var(--text-secondary)",
            }}>{awayScore}</span>
          </div>
        )}

      </div>
      </Link>

      {/* Supprimer — hors du Link pour ne pas déclencher la navigation */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 16, color: "var(--text-muted)", padding: "4px 6px",
          lineHeight: 1, zIndex: 5,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >×</button>
    </div>
  );
}

// ─── Carte de groupe (compétition) ────────────────────────
function MatchGroupCard({
  group, liveStates, onRemove, lang,
}: {
  group: MatchGroup;
  liveStates: Record<string, MatchLive>;
  onRemove: (id: string) => void;
  lang: string;
}) {
  const logo = proxyLogo(group.leagueLogo);
  const hasLive = group.matches.some((m) =>
    LIVE_STATUSES.includes(liveStates[m.id]?.status ?? "")
  );

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: `1px solid ${hasLive ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: hasLive ? "0 0 0 2px rgba(239,68,68,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      marginBottom: 12,
      transition: "border-color 0.3s, box-shadow 0.3s",
    }}>
      {/* En-tête compétition */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 14px",
        background: "var(--bg-muted)",
        borderBottom: "1px solid var(--border)",
      }}>
        {logo
          ? <div style={{ width: 22, height: 22, borderRadius: 4, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              <Image src={logo} alt="" width={18} height={18} style={{ objectFit: "contain" }} unoptimized />
            </div>
          : <div style={{ width: 22, height: 22, borderRadius: 4, background: "var(--border)", flexShrink: 0 }} />
        }
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
          {group.leagueName}
        </span>
        {hasLive && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#ef4444" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "livePulse 1.4s ease-in-out infinite" }} />
            LIVE
          </span>
        )}
      </div>

      {/* Matchs */}
      {group.matches.map((m) => (
        <MatchRow
          key={m.id}
          match={m}
          live={liveStates[m.id] ?? null}
          onRemove={() => onRemove(m.id)}
          lang={lang}
        />
      ))}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function FavorisClient() {
  const { t, lang }          = useT();
  const { favMatches, removeFavMatch } = useFavorites();
  const today                = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Uniquement les matchs du jour (les anciens sont auto-nettoyés dans loadFavMatches)
  const todayMatches = useMemo(
    () => favMatches.filter((m) => m.date === today),
    [favMatches, today]
  );

  // État live par match ID
  const [liveStates, setLiveStates] = useState<Record<string, MatchLive>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const prevRef = useRef<Record<string, { score: string | null; status: string }>>({});

  // Groupement par compétition, trié par heure
  const groups = useMemo<MatchGroup[]>(() => {
    const map = new Map<string, MatchGroup>();
    const sorted = [...todayMatches].sort((a, b) =>
      (a.time ?? "").localeCompare(b.time ?? "")
    );
    for (const m of sorted) {
      const key = m.leagueId || m.league;
      if (!map.has(key)) {
        map.set(key, {
          key,
          leagueName: m.league,
          leagueLogo: m.leagueLogo,
          matches: [],
          earliestTime: m.time ?? "00:00",
        });
      }
      map.get(key)!.matches.push(m);
    }
    return [...map.values()];
  }, [todayMatches]);

  // Rafraîchissement des données live
  const refresh = useCallback(async () => {
    if (todayMatches.length === 0) return;
    try {
      const res = await fetch(`/api/matches?date=${today}`);
      if (!res.ok) return;
      const grouped: Record<string, any[]> = await res.json();
      const allApi = Object.values(grouped).flat();

      setLiveStates((prev) => {
        const next = { ...prev };

        for (const fav of todayMatches) {
          const api = allApi.find((m: any) => String(m.id) === fav.id);
          if (!api) continue;

          const status = normalizeStatus(api.state?.description ?? "");
          const score  = api.state?.score?.current ?? null;
          const clock  = api.state?.clock ?? null;
          const pr     = prevRef.current[fav.id];

          let goalFlash = prev[fav.id]?.goalFlash ?? null;

          if (pr && pr.score !== null && score !== null && pr.score !== score) {
            const [ph, pa] = pr.score.split(" - ").map(Number);
            const [nh, na] = score.split(" - ").map(Number);
            const id = fav.id;

            if (nh > ph || na > pa) {
              // But marqué : point clignotant 4s, puis BUT + son
              goalFlash = { team: nh > ph ? "home" : "away", phase: "pending" };
              setTimeout(() => {
                setLiveStates(s => s[id] ? { ...s, [id]: { ...s[id], goalFlash: { team: nh > ph ? "home" : "away", phase: "confirmed" } } } : s);
                playSound("goal");
                setTimeout(() => setLiveStates(s => ({ ...s, [id]: { ...s[id], goalFlash: null } })), 8000);
              }, 4000);
            } else if (nh < ph || na < pa) {
              // But annulé : afficher immédiatement + son
              goalFlash = { team: nh < ph ? "home" : "away", phase: "cancelled" };
              playSound("cancelled");
              setTimeout(() => setLiveStates(s => ({ ...s, [id]: { ...s[id], goalFlash: null } })), 6000);
            }
          }

          if (pr && pr.status !== "HT" && status === "HT")             playSound("halftime");
          if (pr && pr.status !== "Match Finished" && status === "Match Finished") playSound("fulltime");

          prevRef.current[fav.id] = { score, status };

          next[fav.id] = {
            score,
            status,
            clock,
            homeRedCards: prev[fav.id]?.homeRedCards ?? 0,
            awayRedCards: prev[fav.id]?.awayRedCards ?? 0,
            goalFlash,
          };
        }
        return next;
      });

      // Cartons rouges : fetch match detail pour les matchs live
      for (const fav of todayMatches) {
        const st = prevRef.current[fav.id]?.status ?? "";
        if (!LIVE_STATUSES.includes(st)) continue;
        try {
          const evRes = await fetch(`/api/match/${fav.id}`);
          if (!evRes.ok) continue;
          const ev  = await evRes.json();
          const api = allApi.find((m: any) => String(m.id) === fav.id);
          if (!api || !ev?.events) continue;

          const homeId = api.homeTeam?.id;
          const awayId = api.awayTeam?.id;
          const hRC    = ev.events.filter((e: any) => e.type === "Red Card" && e.team?.id === homeId).length;
          const aRC    = ev.events.filter((e: any) => e.type === "Red Card" && e.team?.id === awayId).length;

          const id = fav.id;
          setLiveStates((s) => ({
            ...s,
            [id]: { ...s[id], homeRedCards: hRC, awayRedCards: aRC },
          }));
        } catch { /* ignore */ }
      }

      setLastRefresh(new Date());
    } catch (e) {
      console.error("Favorites refresh error:", e);
    }
  }, [todayMatches, today]);

  // Fetch initial
  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh toutes les 30s quand des matchs sont en cours
  useEffect(() => {
    const hasLive = Object.values(liveStates).some((s) =>
      LIVE_STATUSES.includes(s.status)
    );
    if (!hasLive) return;
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [liveStates, refresh]);

  const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";
  const isEmpty    = todayMatches.length === 0;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 20px 80px" }}>

      <style>{`
        @keyframes goalFlashAnim {
          0%   { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Titre */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 26 }}>⭐</span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {t("my_favorites")}
        </h1>
        {lastRefresh && !isEmpty && (
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
            {t("updated_at")} {lastRefresh.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* État vide */}
      {isEmpty && (
        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>☆</div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
            {t("no_favorites")}
          </p>
          <p style={{ fontSize: 13, marginBottom: 24 }}>{t("no_favorites_sub")}</p>
          <Link href="/" style={{
            display: "inline-block", padding: "10px 20px",
            background: "var(--accent)", color: "#fff", borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            {t("explore")}
          </Link>
        </div>
      )}

      {/* Groupes de matchs */}
      {groups.map((g) => (
        <MatchGroupCard
          key={g.key}
          group={g}
          liveStates={liveStates}
          onRemove={removeFavMatch}
          lang={lang}
        />
      ))}
    </div>
  );
}
