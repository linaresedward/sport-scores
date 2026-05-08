"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import MatchFavoriteButton from "@/app/components/MatchFavoriteButton";

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
  strLeague?: string;
};

export type { Event };

const LIVE_STATUSES = ["In Progress", "HT", "1H", "2H", "ET", "P", "LIVE"];

// IDs TheSportsDB des compétitions à format coupe (ordre spécial des rounds)
const CUP_IDS = ["4480", "4481", "4482", "4483", "4429", "4499", "4496", "4523"];

// Compétitions de sélections nationales → afficher drapeaux au lieu de badges
const NATIONAL_TEAM_IDS = new Set(["4429", "4499", "4496", "4523", "4490"]);

const ROUND_ORDER_CUP: Record<string, number> = {
  "200": 120, // Finale (TheSportsDB code)
  "0":   110, // Finale alternative
  "150": 100, "125": 90, "16": 80, "32": 70,
  "8": 60, "7": 59, "6": 58, "5": 57,
  "4": 56, "3": 55, "2": 54, "1": 53, "400": 10,
};

// Drapeaux des pays pour les compétitions de sélections
const COUNTRY_FLAG: Record<string, string> = {
  "Argentina":"🇦🇷","France":"🇫🇷","Germany":"🇩🇪","Spain":"🇪🇸","Portugal":"🇵🇹",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Brazil":"🇧🇷","Uruguay":"🇺🇾","Colombia":"🇨🇴","Chile":"🇨🇱",
  "Peru":"🇵🇪","Ecuador":"🇪🇨","Bolivia":"🇧🇴","Paraguay":"🇵🇾","Venezuela":"🇻🇪",
  "Morocco":"🇲🇦","Egypt":"🇪🇬","Senegal":"🇸🇳","Nigeria":"🇳🇬","Ghana":"🇬🇭",
  "Ivory Coast":"🇨🇮","Cameroon":"🇨🇲","Algeria":"🇩🇿","Tunisia":"🇹🇳","Mali":"🇲🇱",
  "Guinea":"🇬🇳","South Africa":"🇿🇦","DR Congo":"🇨🇩","Cape Verde":"🇨🇻",
  "Zambia":"🇿🇲","Angola":"🇦🇴","Tanzania":"🇹🇿","Namibia":"🇳🇦","Burkina Faso":"🇧🇫",
  "Italy":"🇮🇹","Netherlands":"🇳🇱","Belgium":"🇧🇪","Croatia":"🇭🇷","Poland":"🇵🇱",
  "Denmark":"🇩🇰","Sweden":"🇸🇪","Switzerland":"🇨🇭","Austria":"🇦🇹","Serbia":"🇷🇸",
  "Turkey":"🇹🇷","Hungary":"🇭🇺","Czech Republic":"🇨🇿","Slovakia":"🇸🇰","Romania":"🇷🇴",
  "Ukraine":"🇺🇦","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Wales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","Albania":"🇦🇱","Slovenia":"🇸🇮",
  "USA":"🇺🇸","Mexico":"🇲🇽","Canada":"🇨🇦","Japan":"🇯🇵","South Korea":"🇰🇷",
  "Australia":"🇦🇺","Saudi Arabia":"🇸🇦","Iran":"🇮🇷","Qatar":"🇶🇦",
  "Jordan":"🇯🇴","Iraq":"🇮🇶","New Zealand":"🇳🇿","Norway":"🇳🇴","Finland":"🇫🇮",
  "Georgia":"🇬🇪","North Macedonia":"🇲🇰","Montenegro":"🇲🇪",
  "Panama":"🇵🇦","Costa Rica":"🇨🇷","Honduras":"🇭🇳","El Salvador":"🇸🇻",
  "Jamaica":"🇯🇲","Trinidad and Tobago":"🇹🇹","Haiti":"🇭🇹",
  "Comoros":"🇰🇲","Equatorial Guinea":"🇬🇶","Gambia":"🇬🇲","Mozambique":"🇲🇿",
  "Guinea-Bissau":"🇬🇼","Mauritania":"🇲🇷","Zimbabwe":"🇿🇼","Ethiopia":"🇪🇹",
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
    if (round === "200" || round === "0") return "Finale";
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
            <MatchRowLigue ev={ev} upcoming={upcoming} leagueId={leagueId} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchRowLigue({ ev, upcoming, leagueId }: { ev: Event; upcoming?: boolean; leagueId?: string }) {
  const { t } = useT();
  const live = isReallyLive(ev);
  const hasScore = ev.intHomeScore !== null && ev.intAwayScore !== null;
  const date = getEventDate(ev);
  const homeWin = hasScore && parseInt(ev.intHomeScore!) > parseInt(ev.intAwayScore!);
  const awayWin = hasScore && parseInt(ev.intAwayScore!) > parseInt(ev.intHomeScore!);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>

      {/* Lien principal — toute la ligne sauf le bouton étoile */}
      <Link
        href={`/match/${ev.idEvent}`}
        className="match-row-link"
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "80px 1fr 40px",
          alignItems: "center",
          padding: "10px 16px",
          gap: "12px",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* Colonne date/statut */}
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
              <div
                style={{ fontSize: "12px", fontWeight: 600, color: upcoming ? "#2563eb" : "#64748b" }}
                suppressHydrationWarning
              >
                {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}
        </div>

        {/* Colonne équipes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {leagueId && NATIONAL_TEAM_IDS.has(leagueId)
              ? <span style={{ fontSize: "16px", lineHeight: 1 }}>{COUNTRY_FLAG[ev.strHomeTeam] ?? "🏳️"}</span>
              : ev.strHomeTeamBadge && (
                  <Image src={ev.strHomeTeamBadge} alt={ev.strHomeTeam}
                    width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
                )
            }
            <span style={{ fontSize: "13px", fontWeight: homeWin ? 700 : 400, color: homeWin ? "#0f172a" : "#475569" }}>
              {ev.strHomeTeam}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {leagueId && NATIONAL_TEAM_IDS.has(leagueId)
              ? <span style={{ fontSize: "16px", lineHeight: 1 }}>{COUNTRY_FLAG[ev.strAwayTeam] ?? "🏳️"}</span>
              : ev.strAwayTeamBadge && (
                  <Image src={ev.strAwayTeamBadge} alt={ev.strAwayTeam}
                    width={16} height={16} style={{ objectFit: "contain" }} unoptimized />
                )
            }
            <span style={{ fontSize: "13px", fontWeight: awayWin ? 700 : 400, color: awayWin ? "#0f172a" : "#475569" }}>
              {ev.strAwayTeam}
            </span>
          </div>
        </div>

        {/* Colonne scores */}
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

      {/* ⭐ Bouton favori match — en dehors du Link */}
      <div style={{ paddingRight: "12px", flexShrink: 0 }}>
        <MatchFavoriteButton
          match={{
            id: ev.idEvent,
            homeTeam: ev.strHomeTeam,
            awayTeam: ev.strAwayTeam,
            homeLogo: ev.strHomeTeamBadge || undefined,
            awayLogo: ev.strAwayTeamBadge || undefined,
            league: ev.strLeague || "",
            date: ev.dateEvent,
            time: ev.strTime?.slice(0, 5) ?? undefined,
          }}
          size={16}
        />
      </div>
    </div>
  );
}