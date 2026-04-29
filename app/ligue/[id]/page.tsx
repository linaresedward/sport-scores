import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ShowMoreResults from "./ShowMoreResults";
import StandingsPanel from "../../components/StandingsPanel";

const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY;

const CUP_IDS = ["4480", "4481", "4482", "4483"];

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

const LIVE_STATUSES = ["In Progress", "HT", "1H", "2H", "ET", "P", "LIVE"];

const ROUND_ORDER_CUP: Record<string, number> = {
  "150": 100, "125": 90, "16": 80, "32": 70,
  "8": 60, "7": 59, "6": 58, "5": 57,
  "4": 56, "3": 55, "2": 54, "1": 53, "400": 10,
};

function getRoundLabel(round: string | null, leagueId?: string): string {
  if (!round) return "Phase de groupe";
  const isCup = leagueId ? CUP_IDS.includes(leagueId) : false;
  if (isCup) {
    if (round === "150") return "Demi-finales";
    if (round === "125") return "Quarts de finale";
    if (round === "32")  return "Barrages";
    if (round === "16")  return "Huitièmes de finale";
    if (round === "400") return "Tours préliminaires";
    const n = parseInt(round);
    if (n >= 1 && n <= 8) return `Journée ${n} — Phase de ligue`;
    return `Round ${round}`;
  }
  const n = parseInt(round);
  if (!isNaN(n)) return `Journée ${n}`;
  return round;
}

function getRoundPriority(round: string | null, leagueId?: string): number {
  const isCup = leagueId ? CUP_IDS.includes(leagueId) : false;
  if (isCup) return ROUND_ORDER_CUP[round || "0"] ?? 0;
  return parseInt(round || "0");
}

// ✅ CORRECTION : un match est vraiment LIVE seulement si son statut est live
//    ET soit pas de score, soit la date est il y a moins de 3h
function isReallyLive(ev: Event): boolean {
  if (!LIVE_STATUSES.includes(ev.strStatus)) return false;
  if (ev.intHomeScore === null) return true; // pas encore de score → vraiment à venir ou en cours
  const matchDate = new Date(ev.strTimestamp || `${ev.dateEvent}T${ev.strTime || "00:00:00"}Z`);
  const diffMs = Date.now() - matchDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours < 4; // si plus de 3h depuis le coup d'envoi → on considère terminé
}

function getEventDate(ev: Event): Date {
  return new Date(ev.strTimestamp || `${ev.dateEvent}T${ev.strTime || "00:00:00"}`);
}

async function getLeagueInfo(id: string) {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${KEY}/lookupleague.php?id=${id}`,
    { next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return data.leagues?.[0] || null;
}

async function getLeagueMatches(id: string, season: string) {
  const [resSeason, resNext] = await Promise.all([
    fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/eventsseason.php?id=${id}&s=${season}`, { next: { revalidate: 300 } }),
    fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/eventsnextleague.php?id=${id}`, { next: { revalidate: 60 } }),
  ]);
  const [seasonData, nextData] = await Promise.all([resSeason.json(), resNext.json()]);
  const allEvents: Event[] = seasonData.events || [];
  const past = allEvents.filter((e: Event) => e.intHomeScore !== null);
  const next: Event[] = nextData.events || [];
  return { past, next };
}

function groupByRound(events: Event[], leagueId?: string): { round: string; events: Event[] }[] {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const key = ev.intRound || "0";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return [...map.entries()]
    .sort((a, b) => getRoundPriority(b[0], leagueId) - getRoundPriority(a[0], leagueId))
    .map(([round, evs]) => ({
      round,
      events: evs.sort((a, b) =>
        new Date(b.strTimestamp || b.dateEvent).getTime() -
        new Date(a.strTimestamp || a.dateEvent).getTime()
      ),
    }));
}

export default async function LiguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const league = await getLeagueInfo(id);
  if (!league) notFound();

  const { past, next } = await getLeagueMatches(id, league.strCurrentSeason);
  const isUEFA = id === "4480" || id === "4481";

  const pastGroups = groupByRound(past, id);
  const nextGroups = groupByRound(next, id);

  const visibleGroups = pastGroups.slice(0, 2);
  const hiddenGroups = pastGroups.slice(2);

  return (
    <div style={{ flex: 1, padding: "28px 36px", maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "12px",
          background: isUEFA ? "#1a1f3c" : "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {league.strBadge && (
            <Image src={league.strBadge} alt={league.strLeague}
              width={40} height={40} style={{ objectFit: "contain" }} unoptimized />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {league.strLeague}
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "2px 0 0" }}>
            {league.strCountry} · Saison {league.strCurrentSeason}
          </p>
        </div>
        <StandingsPanel leagueId={id} leagueName={league.strLeague} />
      </div>

      {/* Prochains matchs */}
      {next.length > 0 && (
        <section style={{ marginBottom: "36px" }}>
          <SectionTitle>Prochains matchs</SectionTitle>
          {nextGroups.map(({ round, events }) => (
            <RoundBlock key={round} round={round} events={events} upcoming leagueId={id} />
          ))}
        </section>
      )}

      {/* Résultats */}
      {past.length > 0 && (
        <section>
          <SectionTitle>Résultats</SectionTitle>
          {visibleGroups.map(({ round, events }) => (
            <RoundBlock key={round} round={round} events={events} leagueId={id} />
          ))}
          {hiddenGroups.length > 0 && (
            <ShowMoreResults groups={hiddenGroups} leagueId={id} />
          )}
        </section>
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "#94a3b8", marginBottom: "16px",
    }}>
      {children}
    </h2>
  );
}

export function RoundBlock({ round, events, upcoming, leagueId }: {
  round: string; events: Event[]; upcoming?: boolean; leagueId?: string;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        color: "#64748b", padding: "8px 0",
        borderBottom: "2px solid #f1f5f9",
      }}>
        {getRoundLabel(round, leagueId)}
      </div>
      <div style={{
        background: "#fff",
        border: "1px solid #f1f5f9",
        borderTop: "none",
        borderRadius: "0 0 10px 10px",
        overflow: "hidden",
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

// ✅ Renommé MatchRowLigue pour éviter le conflit avec MatchRow de la page d'accueil
// ✅ Enveloppé dans <Link> pour rendre cliquable
export function MatchRowLigue({ ev, upcoming }: { ev: Event; upcoming?: boolean }) {
  const live = isReallyLive(ev);  // ✅ utilise la fonction corrigée
  const hasScore = ev.intHomeScore !== null && ev.intAwayScore !== null;
  const date = getEventDate(ev);
  const homeWin = hasScore && parseInt(ev.intHomeScore!) > parseInt(ev.intAwayScore!);
  const awayWin = hasScore && parseInt(ev.intAwayScore!) > parseInt(ev.intHomeScore!);

  return (
    <Link
      href={`/match/${ev.idEvent}`}
      className="match-row-link"
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr 40px",
        alignItems: "center",
        padding: "10px 16px",
        gap: "12px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Heure / statut */}
      <div>
        {live ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>
              {ev.strStatus === "HT" ? "MI-T." : ev.strProgress || "LIVE"}
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

      {/* Équipes */}
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

      {/* Scores */}
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

// ✅ On garde l'export MatchRow pour que ShowMoreResults ne casse pas
export { MatchRowLigue as MatchRow };