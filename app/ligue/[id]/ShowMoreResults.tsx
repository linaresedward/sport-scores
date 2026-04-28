"use client";

import { useState } from "react";
import { RoundBlock } from "./page";

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

export default function ShowMoreResults({
  groups,
  leagueId,
}: {
  groups: { round: string; events: Event[] }[];
  leagueId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {open && groups.map(({ round, events }) => (
        <RoundBlock key={round} round={round} events={events} leagueId={leagueId} />
      ))}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          width: "100%", padding: "12px",
          border: "1px solid #e2e8f0", borderRadius: "10px",
          background: "#fff", cursor: "pointer",
          fontSize: "13px", fontWeight: 600, color: "#475569",
          marginTop: "4px",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? "Masquer les phases précédentes" : `Voir les phases précédentes (${groups.length})`}
      </button>
    </div>
  );
}