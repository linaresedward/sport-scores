"use client";

import Image from "next/image";
import Link from "next/link";
import { translations } from "@/lib/translations";
import { useT } from "@/lib/i18n";

type Event = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strHomeTeamBadge: string;
  strAwayTeamBadge: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strTimestamp: string;
  dateEvent: string;
  strTime: string;
  strStatus: string;
  strProgress: string | null;
  intRound: string | null;
  idHomeTeam: string;
  idAwayTeam: string;
};

export type { Event };

const LIVE_STATUSES = ["In Progress", "HT", "1H", "2H", "ET", "P", "LIVE"];
const CUP_IDS = ["4480", "4481", "4482", "4483"];

const ROUND_ORDER_CUP: Record<string, number> = {
  "150": 100, "125": 90, "16": 80, "32": 70,
  "8": 60, "7": 59, "6": 58, "5": 57,
  "4": 56, "3": 55, "2": 54, "1": 53, "400": 10,
};

function isReallyLive(ev: Event): boolean {
  if (!LIVE_STATUSES.includes(ev.strStatus)) return false;
  if (ev.intHomeScore === null) return true;
  const matchDate = new Date(ev.strTimestamp || `${ev.dateEvent}T${ev.strTime || "00:00:00"}Z`);
  const diffHours = (Date.now() - matchDate.getTime()) / (1000 * 60 * 60);
  return diffHours < 4;
}

function getEventDate(ev: Event): Date {
  return new Date(ev.strTimestamp || `${ev.dateEvent}T${ev.strTime || "00:00:00"}`);
}

function getRoundLabel(round: string | null, leagueId: string | undefined, t: (k: any) => string): string {
  if (!round) return t("group_stage");
  const isCup = leagueId ? CUP_IDS.includes(leagueId) : false;
  if (isCup) {
    if (round === "150") return t("semifinal");
    if (round === "125") return t("quarterfinal");
    if (round === "32")  return t("playoff");
    if (round === "16")  return t("round_of_16");
    if (round === "400") return t("prelim");
    const n = parseInt(round);
    if (n >= 1 && n <= 8) return `${t("matchday")} ${n} — ${t("league_phase")}`;
    return `Round ${round}`;
  }
  const n = parseInt(round);
  if (!isNaN(n)) return `${t("matchday")} ${n}`;
  return round;
}

export function getRoundPriority(round: string | null, leagueId?: string): number {
  const isCup = leagueId ? CUP_IDS.includes(leagueId) : false;
  if (isCup) return ROUND_ORDER_CUP[round || "0"] ?? 0;
  return parseInt(round || "0");
}

export function RoundBlock({ round, events, upcoming, leagueId }: {
  round: string; events: Event[]; upcoming?: boolean; leagueId?: string;
}) {
  const { t } = useT();

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "#64748b", padding: "8px 0",
        borderBottom: "2px solid #f1f5f9",
      }}>
        {getRoundLabel(round, leagueId, t)}
      </div>
      <div style={{
        background: "#fff", border: "1px solid #f1f5f9",
        borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden",
      }}>
        {events.map((ev, idx) => (
          <div key={ev.idEvent}>
            {idx > 0 && <div style={{ height: "1px", background: "#f8fafc", marginLeft: "16px" }} />}
            <MatchRowLigue ev={ev} upcoming={upcoming} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchRowLigue({ ev, upcoming }: { ev: Event; upcoming?: boolean }) {
  const { t } = useT();
  const live = isReallyLive(ev);
  const hasScore = ev.intHomeScore !== null && ev.intAwayScore !== null;
  const date = getEventDate(ev);
  const homeWin = hasScore && parseInt(ev.intHomeScore!) > parseInt(ev.intAwayScore!);
  const awayWin = hasScore && parseInt(ev.intAwayScore!) > parseInt(ev.intHomeScore!);

  return (
    <Link href={`/match/${ev.idEvent}`} className="match-row-link"
      style={{
        display: "grid", gridTemplateColumns: "80px 1fr 40px",
        alignItems: "center", padding: "10px 16px", gap: "12px",
        textDecoration: "none", color: "inherit",
      }}
    >
      <div>
        {live ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>
              {ev.strStatus === "HT" ? t("halftime") : ev.strProgress || t("live")}
            </span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }} suppressHydrationWarning>
              {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: upcoming ? "#2563eb" : "#64748b" }}
              suppressHydrationWarning>
              {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {ev.strHomeTeamBadge && (
            <Image src={ev.strHomeTeamBadge} alt={ev.strHomeTeam}
              width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
          )}
          <span style={{ fontSize: "13px", fontWeight: homeWin ? 700 : 400, color: homeWin ? "#0f172a" : "#475569" }}>
            {ev.strHomeTeam}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {ev.strAwayTeamBadge && (
            <Image src={ev.strAwayTeamBadge} alt={ev.strAwayTeam}
              width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
          )}
          <span style={{ fontSize: "13px", fontWeight: awayWin ? 700 : 400, color: awayWin ? "#0f172a" : "#475569" }}>
            {ev.strAwayTeam}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        {hasScore ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ fontSize: "13px", fontWeight: homeWin ? 700 : 400, color: homeWin ? "#0f172a" : "#475569" }}>
              {ev.intHomeScore}
            </span>
            <span style={{ fontSize: "13px", fontWeight: awayWin ? 700 : 400, color: awayWin ? "#0f172a" : "#475569" }}>
              {ev.intAwayScore}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "#cbd5e1" }}>–</span>
        )}
      </div>
    </Link>
  );
}