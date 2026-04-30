// lib/matchTimer.ts

export type MatchPeriod =
  | "upcoming"
  | "first_half"
  | "half_time"
  | "second_half"
  | "extra_time"
  | "penalties"
  | "finished"
  | "live_unknown"

export interface MatchTimer {
  period: MatchPeriod
  minute: number | null
  label: string
  sublabel: string | null
  isLive: boolean
  progress: number
  periodStart: number
  periodEnd: number
}

const LIVE_STATUSES = ["In Progress", "1H", "2H", "HT", "ET", "P", "LIVE", "Extra Time"]

export function computeMatchTimer(
  status: string,
  dateEvent: string,
  strTime: string,
  intMinute?: string | null
): MatchTimer {

  const isLive = LIVE_STATUSES.includes(status)

  // ── Terminé ────────────────────────────────────────────
  if (status === "Match Finished" || status === "FT") {
    return {
      period: "finished", minute: 90, label: "Terminé", sublabel: null,
      isLive: false, progress: 100, periodStart: 0, periodEnd: 90,
    }
  }

  // ── À venir ────────────────────────────────────────────
  if (!isLive) {
    return {
      period: "upcoming", minute: null,
      label: strTime?.slice(0, 5) || "À venir", sublabel: null,
      isLive: false, progress: 0, periodStart: 0, periodEnd: 45,
    }
  }

  // ── Mi-temps ───────────────────────────────────────────
  if (status === "HT") {
    return {
      period: "half_time", minute: 45, label: "Mi-temps", sublabel: null,
      isLive: true, progress: 100, periodStart: 0, periodEnd: 45,
    }
  }

  // ── Tirs au but ────────────────────────────────────────
  if (status === "P") {
    return {
      period: "penalties", minute: null, label: "Tirs au but", sublabel: null,
      isLive: true, progress: 100, periodStart: 90, periodEnd: 120,
    }
  }

  // ── Minute API uniquement (approche stricte) ───────────
  const apiMinute = intMinute && intMinute !== "0"
    ? parseInt(intMinute)
    : null

  // ── 1ère mi-temps ──────────────────────────────────────
  if (status === "1H") {
    return {
      period: "first_half",
      minute: apiMinute,
      label: "1ère MT",
      sublabel: apiMinute ? `${apiMinute}'` : null,
      isLive: true,
      progress: apiMinute ? Math.min((apiMinute / 45) * 100, 100) : 0,
      periodStart: 0,
      periodEnd: 45,
    }
  }

  // ── 2ème mi-temps ──────────────────────────────────────
  if (status === "2H") {
    return {
      period: "second_half",
      minute: apiMinute,
      label: "2ème MT",
      sublabel: apiMinute ? `${apiMinute}'` : null,
      isLive: true,
      progress: apiMinute ? Math.min(((apiMinute - 45) / 45) * 100, 100) : 0,
      periodStart: 45,
      periodEnd: 90,
    }
  }

  // ── Prolongations ──────────────────────────────────────
  if (status === "ET" || status === "Extra Time") {
    return {
      period: "extra_time",
      minute: apiMinute,
      label: "Prol.",
      sublabel: apiMinute ? `${apiMinute}'` : null,
      isLive: true,
      progress: apiMinute ? Math.min(((apiMinute - 90) / 30) * 100, 100) : 0,
      periodStart: 90,
      periodEnd: 120,
    }
  }

  // ── Fallback "In Progress" sans période précise ────────
  return {
    period: "live_unknown",
    minute: apiMinute,
    label: "LIVE",
    sublabel: apiMinute ? `${apiMinute}'` : null,
    isLive: true,
    progress: apiMinute ? Math.min((apiMinute / 90) * 100, 100) : 50,
    periodStart: 0,
    periodEnd: 90,
  }
}