import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd, { buildSportsOrganizationLd } from "../../components/JsonLd";
import { cookies } from "next/headers";
import Image from "next/image";
import ShowMoreResults from "./ShowMoreResults";
import StandingsPanel from "../../components/StandingsPanel";
import LeagueFavoriteButton from "../../components/LeagueFavoriteButton";
import { RoundBlock } from "./RoundBlock";
import type { Event } from "./RoundBlock";
import { HIGHLIGHTLY_TO_SPORTSDB, SPORTSDB_CUP_IDS, translateCountry } from "../../../lib/labels";
import HighlightlyLeaguePage from "./HighlightlyLeaguePage";

const KEY = process.env.NEXT_PUBLIC_SPORTSDB_KEY;
// IDs TheSportsDB qui sont des compétitions européennes (format K.O.)
const CUP_IDS = ["4480", "4481", "4429", "4496", "4499"];

const ROUND_ORDER_CUP: Record<string, number> = {
  "200": 120, // Finale
  "0":   115, // Finale (variante)
  "160": 108, // Match pour la 3e place
  "150": 100, "125": 90, "16": 80, "32": 70,
  "8": 60, "7": 59, "6": 58, "5": 57,
  "4": 56, "3": 55, "2": 54, "1": 53, "400": 10,
};

function getRoundPriority(round: string | null, leagueId?: string): number {
  const isCup = leagueId ? CUP_IDS.includes(leagueId) : false;
  if (isCup) return ROUND_ORDER_CUP[round || "0"] ?? 0;
  return parseInt(round || "0");
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
  const today = new Date().toISOString().split("T")[0];
  const [resSeason, resNext] = await Promise.all([
    fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/eventsseason.php?id=${id}&s=${season}`, { next: { revalidate: 300 } }),
    fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/eventsnextleague.php?id=${id}`, { next: { revalidate: 60 } }),
  ]);
  const [seasonData, nextData] = await Promise.all([resSeason.json(), resNext.json()]);
  const allEvents: Event[] = seasonData.events || [];
  const past = allEvents.filter((e: Event) => e.intHomeScore !== null);

  // eventsnextleague ne retourne pas toutes les journées à venir
  // → compléter avec eventsseason (matchs sans score et date >= aujourd'hui)
  const nextFromAPI: Event[] = nextData.events || [];
  const nextIds = new Set(nextFromAPI.map((e: Event) => e.idEvent));
  const extraFuture = allEvents.filter(
    (e: Event) => e.intHomeScore === null && e.dateEvent >= today && !nextIds.has(e.idEvent)
  );
  const next: Event[] = [...nextFromAPI, ...extraFuture];

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const league = await getLeagueInfo(id)
    if (league) {
      const name = league.strLeague ?? ''
      const country = translateCountry(league.strCountry ?? '', 'fr')
      const title = `${name}${country ? ` · ${country}` : ''}`
      const desc = `Résultats, classement et matchs ${name}${country ? ` (${country})` : ''} en direct sur NyxScores.`
      return { title, description: desc, openGraph: { title: `${title} | NyxScores`, description: desc } }
    }
  } catch { /* fallback */ }
  return { title: 'Ligue', description: 'Résultats et classement de la ligue sur NyxScores.' }
}

export default async function LiguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value ?? "fr";

  // Convertit un ID Highlightly (sidebar) en ID TheSportsDB
  const id = HIGHLIGHTLY_TO_SPORTSDB[rawId] ?? rawId;

  // Ligues sans mapping TheSportsDB → page Highlightly (Conference League, UEFA Euro…)
  if (!HIGHLIGHTLY_TO_SPORTSDB[rawId]) {
    return <HighlightlyLeaguePage highlightlyId={rawId} />;
  }

  const league = await getLeagueInfo(id);
  if (!league) notFound();

  // Certaines compétitions nécessitent une saison fixe (CAN, Copa América)
  const FIXED_SEASONS: Record<string, string> = {
    "4496": "2025",  // CAN 2025 (Maroc, terminée jan 2026)
    "4499": "2024",  // Copa América 2024 (USA)
  }
  const season = FIXED_SEASONS[id] ?? league.strCurrentSeason

  const { past, next } = await getLeagueMatches(id, season);
  const isUEFA = SPORTSDB_CUP_IDS.has(id);

  const pastGroups = groupByRound(past, id);
  const nextGroups = groupByRound(next, id);
  const visibleGroups = pastGroups.slice(0, 2);
  const hiddenGroups  = pastGroups.slice(2);

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sport-scores.vercel.app'

  return (
    <div style={{ flex: 1, padding: "28px 36px", maxWidth: "860px" }}>
      <JsonLd data={buildSportsOrganizationLd({
        name: league.strLeague,
        sport: league.strSport ?? 'Football',
        url: `${SITE_URL}/ligue/${rawId}`,
      })} />

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
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {league.strLeague}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
            {translateCountry(league.strCountry, lang)} · {league.strCurrentSeason}
          </p>
        </div>
        {/* LeagueFavoriteButton utilise l'ID Highlightly pour la sidebar */}
        <LeagueFavoriteButton id={rawId} name={league.strLeague} logo={league.strBadge ?? ""} />
        {/* StandingsPanel utilise l'ID Highlightly pour notre API /api/standings */}
        <StandingsPanel leagueId={rawId} leagueName={league.strLeague} />
      </div>

      {next.length > 0 && (
        <section style={{ marginBottom: "36px" }}>
          <SectionTitle>Prochains matchs</SectionTitle>
          {nextGroups.map(({ round, events }) => (
            <RoundBlock key={round} round={round} events={events} upcoming leagueId={id} />
          ))}
        </section>
      )}

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "#94a3b8", marginBottom: "16px",
    }}>
      {children}
    </h2>
  );
}