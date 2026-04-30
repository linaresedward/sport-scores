"use client"

import { computeMatchTimer } from "@/lib/matchTimer"

interface Props {
  status: string
  dateEvent: string
  strTime: string
  intMinute?: string | null
}

export default function LiveBadge({ status, dateEvent, strTime, intMinute }: Props) {
  const timer = computeMatchTimer(status, dateEvent, strTime, intMinute)

  // ── À venir ────────────────────────────────────────────
  if (timer.period === "upcoming") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: "999px",
        background: "#eff6ff", border: "1px solid #bfdbfe",
        fontSize: "12px", fontWeight: 600, color: "#1d4ed8",
      }}>
        {timer.label}
      </span>
    )
  }

  // ── Terminé ────────────────────────────────────────────
  if (timer.period === "finished") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: "999px",
        background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-tertiary)",
        fontSize: "12px", fontWeight: 500,
        color: "var(--color-text-secondary)",
      }}>
        FT
      </span>
    )
  }

  // ── Mi-temps ───────────────────────────────────────────
  if (timer.period === "half_time") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "999px",
        background: "#fffbeb", border: "1px solid #fde68a",
        fontSize: "12px", fontWeight: 700, color: "#92400e",
      }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#f59e0b", display: "inline-block", flexShrink: 0,
        }} />
        Mi-temps
      </span>
    )
  }

  // ── Tirs au but ────────────────────────────────────────
  if (timer.period === "penalties") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "999px",
        background: "#fff7ed", border: "1px solid #fed7aa",
        fontSize: "12px", fontWeight: 700, color: "#9a3412",
      }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#f97316", display: "inline-block", flexShrink: 0,
          animation: "livePulse 1.2s ease-in-out infinite",
        }} />
        TAB
        <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}`}</style>
      </span>
    )
  }

  // ── LIVE (toutes périodes actives) ─────────────────────
  const isExtra = timer.period === "extra_time"
  const bgColor  = isExtra ? "#fffbeb" : "#fef2f2"
  const bdColor  = isExtra ? "#fde68a" : "#fecaca"
  const dotColor = isExtra ? "#f59e0b" : "#ef4444"
  const txtColor = isExtra ? "#92400e" : "#b91c1c"
  const minColor = isExtra ? "#d97706" : "#ef4444"

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px 4px 8px", borderRadius: "999px",
      background: bgColor, border: `1px solid ${bdColor}`,
      fontSize: "12px", fontWeight: 700,
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: dotColor, display: "inline-block", flexShrink: 0,
        animation: "livePulse 1.2s ease-in-out infinite",
      }} />
      <span style={{ color: txtColor }}>{timer.label}</span>
      {/* Minute API uniquement — null = pas affiché */}
      {timer.sublabel && (
        <span style={{ color: minColor, marginLeft: "2px" }}>{timer.sublabel}</span>
      )}
      <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}`}</style>
    </span>
  )
}