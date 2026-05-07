"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useFavorites, FavoriteMatch } from "@/hooks/useFavorites";
import { normalizeStatus } from "@/lib/highlightly";
import { translateCountry as _translateCountry } from "@/lib/labels";
import { useT } from "@/lib/i18n";

// ─── Sons depuis les fichiers audio ──────────────────────
function playSound(type: "goal" | "cancelled" | "halftime" | "fulltime") {
  try {
    if (type === "fulltime") {
      // Fin de match = mi-temps × 2, délai 1 seconde entre les deux
      new Audio("/sounds/mi-temps.mp3").play().catch(() => {})
      setTimeout(() => new Audio("/sounds/mi-temps.mp3").play().catch(() => {}), 1000)
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

interface ToastMsg {
  id:          string;
  type:        "goal" | "cancelled" | "halftime" | "fulltime";
  homeTeam:    string;
  awayTeam:    string;
  scoringTeam?: string;
  score:       string | null;
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
  key:            string;
  leagueName:     string;
  leagueLogo?:    string;
  leagueCountry?: string;
  matches:        FavoriteMatch[];
  earliestTime:   string;
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
      {/* Bannière BUT / But annulé — 20s, borderRadius uniforme */}
      {flash && flash.phase !== "pending" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: flash.phase === "confirmed"
            ? "rgba(21,128,61,0.93)"   /* vert foncé visible clair+sombre */
            : "rgba(185,28,28,0.93)",  /* rouge foncé visible clair+sombre */
          color: "#fff", textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, letterSpacing: "0.04em",
          animation: "goalFlashAnim 20s forwards",
          borderRadius: 0, /* Uniforme — le card parent gère les coins */
          pointerEvents: "none",
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>{flash.phase === "confirmed" ? "⚽" : "❌"}</span>
          <span>
            {flash.team === "home" ? match.homeTeam : match.awayTeam}
            {" — "}
            {flash.phase === "confirmed"
              ? (lang === "fr" ? "BUT !" : "GOAL!")
              : (lang === "fr" ? "BUT ANNULÉ" : "GOAL DISALLOWED")}
          </span>
        </div>
      )}

      {/* Rangée principale : Link (flex:1) + bouton × dans le flux */}
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--border)",
        background: flash ? (flash.phase === "confirmed" ? "rgba(22,163,74,0.04)" : "rgba(239,68,68,0.04)") : "transparent",
        transition: "background 0.3s",
      }}>
        <Link
          href={`/match/${match.id}`}
          style={{ flex: 1, display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, textDecoration: "none", color: "inherit", minWidth: 0 }}
        >
          {/* Heure / statut */}
          <div style={{ width: 48, flexShrink: 0, display: "flex", justifyContent: "center" }}>
            {status === "NS" || !live ? (
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{match.time || "—"}</span>
            ) : (
              <StatusBadge status={status} clock={live.clock} lang={lang} />
            )}
          </div>

          {/* Équipes */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              {homeLogo
                ? <Image src={homeLogo} alt="" width={15} height={15} style={{ objectFit: "contain" }} unoptimized />
                : <div style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
              }
              <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: homeWin ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.homeTeam}
              </span>
              <RedCard count={live?.homeRedCards ?? 0} />
              {flash?.team === "home" && flash.phase === "pending" && (
                <span style={{ color: '#ef4444', fontSize: 8, animation: 'livePulse 0.7s ease-in-out infinite', flexShrink: 0 }}>⬤</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {awayLogo
                ? <Image src={awayLogo} alt="" width={15} height={15} style={{ objectFit: "contain" }} unoptimized />
                : <div style={{ width: 15, height: 15, borderRadius: "50%", background: "var(--bg-muted)", flexShrink: 0 }} />
              }
              <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: awayWin ? "var(--text-primary)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.awayTeam}
              </span>
              <RedCard count={live?.awayRedCards ?? 0} />
              {flash?.team === "away" && flash.phase === "pending" && (
                <span style={{ color: '#ef4444', fontSize: 8, animation: 'livePulse 0.7s ease-in-out infinite', flexShrink: 0 }}>⬤</span>
              )}
            </div>
          </div>

          {/* Score — aligné à droite, séparé du bouton × */}
          {hasScore && (
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: homeWin ? 700 : 400, color: isLive ? "#ef4444" : homeWin ? "var(--text-primary)" : "var(--text-secondary)" }}>{homeScore}</span>
              <span style={{ fontSize: 13, fontWeight: awayWin ? 700 : 400, color: isLive ? "#ef4444" : awayWin ? "var(--text-primary)" : "var(--text-secondary)" }}>{awayScore}</span>
            </div>
          )}
        </Link>

        {/* Bouton × dans le flux flex — clairement séparé du score */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          style={{
            flexShrink: 0, background: "none", border: "none", cursor: "pointer",
            fontSize: 16, color: "var(--text-muted)", padding: "4px 10px",
            lineHeight: 1, alignSelf: "stretch", display: "flex", alignItems: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >×</button>
      </div>
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
        {group.leagueCountry && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {_translateCountry(group.leagueCountry, lang)}
          </span>
        )}
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

// ─── Toasts notification ─────────────────────────────────
function ToastContainer({ toasts, lang, onClose }: { toasts: ToastMsg[]; lang: string; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;

  const texts: Record<ToastMsg["type"], { icon: string; fr: string; en: string }> = {
    goal:      { icon: "⚽", fr: "BUT !",          en: "GOAL!" },
    cancelled: { icon: "❌", fr: "But annulé",     en: "Goal Disallowed" },
    halftime:  { icon: "🔔", fr: "Mi-temps",       en: "Half Time" },
    fulltime:  { icon: "🏁", fr: "Fin du match",   en: "Full Time" },
  };

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      display: "flex", flexDirection: "column", gap: 8,
      zIndex: 9999, maxWidth: 300, pointerEvents: "none",
    }}>
      {toasts.map((t) => {
        const info = texts[t.type];
        const label = lang === "fr" ? info.fr : info.en;
        const score = t.score ? ` ${t.score.replace(" - ", "–")}` : "";
        const matchLine = `${t.homeTeam}${score} vs ${t.awayTeam}`;
        const detailLine = t.scoringTeam ? (lang === "fr" ? `${t.scoringTeam}` : `${t.scoringTeam}`) : "";

        const bgColor = t.type === "goal"     ? "#15803d"
                      : t.type === "cancelled"? "#b91c1c"
                      : t.type === "halftime" ? "#b45309"
                      : "#1d4ed8"; /* fulltime blue */

        return (
          <div key={t.id} style={{
            background: bgColor, color: "#fff",
            borderRadius: 12, padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            animation: "toastSlideIn 0.25s ease",
            pointerEvents: "all", minWidth: 240,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{info.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.03em" }}>
                  {label}{detailLine ? ` — ${detailLine}` : ""}
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {matchLine}
                </div>
              </div>
              <button
                onClick={() => onClose(t.id)}
                style={{
                  background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6,
                  color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                  width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, padding: 0,
                }}
              >×</button>
            </div>
          </div>
        );
      })}
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

  // Toasts
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const addToast = useCallback((msg: Omit<ToastMsg, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...msg, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 30000);
  }, []);

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
          leagueName:     m.league,
          leagueLogo:     m.leagueLogo,
          leagueCountry:  m.leagueCountry,
          matches:        [],
          earliestTime:   m.time ?? "00:00",
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

            const team = nh > ph ? "home" : na > pa ? "away" : nh < ph ? "home" : "away";
            const isGoal = nh > ph || na > pa;
            const isCancelled = nh < ph || na < pa;

            if (isGoal) {
              // Point clignotant 4s → BUT confirmé + son + toast
              goalFlash = { team, phase: "pending" };
              setTimeout(() => {
                setLiveStates(s => s[id] ? { ...s, [id]: { ...s[id], goalFlash: { team, phase: "confirmed" } } } : s);
                playSound("goal");
                addToast({ type: "goal", homeTeam: fav.homeTeam, awayTeam: fav.awayTeam, scoringTeam: team === "home" ? fav.homeTeam : fav.awayTeam, score });
                setTimeout(() => setLiveStates(s => ({ ...s, [id]: { ...s[id], goalFlash: null } })), 20000);
              }, 4000);
            } else if (isCancelled) {
              // But annulé : immédiat + son + toast
              goalFlash = { team, phase: "cancelled" };
              playSound("cancelled");
              addToast({ type: "cancelled", homeTeam: fav.homeTeam, awayTeam: fav.awayTeam, scoringTeam: team === "home" ? fav.homeTeam : fav.awayTeam, score });
              setTimeout(() => setLiveStates(s => ({ ...s, [id]: { ...s[id], goalFlash: null } })), 20000);
            }
          }

          if (pr && pr.status !== "HT" && status === "HT") {
            playSound("halftime");
            addToast({ type: "halftime", homeTeam: fav.homeTeam, awayTeam: fav.awayTeam, score });
          }
          if (pr && pr.status !== "Match Finished" && status === "Match Finished") {
            playSound("fulltime");
            addToast({ type: "fulltime", homeTeam: fav.homeTeam, awayTeam: fav.awayTeam, score });
          }

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
  }, [todayMatches, today, addToast]);

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
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Toasts — notifications événements en bas à droite */}
      <ToastContainer toasts={toasts} lang={lang} onClose={(id) => setToasts(p => p.filter(t => t.id !== id))} />

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
