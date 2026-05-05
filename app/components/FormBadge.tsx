"use client"

import { useEffect, useState } from "react"

type FormChar = "W" | "D" | "L"

const COLORS: Record<FormChar, { bg: string; color: string; label: string }> = {
  W: { bg: "#22c55e", color: "#fff", label: "V" },
  D: { bg: "#f59e0b", color: "#fff", label: "N" },
  L: { bg: "#ef4444", color: "#fff", label: "D" },
}

function FormDot({ char }: { char: string }) {
  const style = COLORS[char as FormChar] ?? { bg: "#e2e8f0", color: "#94a3b8", label: char }
  return (
    <span
      title={char === "W" ? "Victoire" : char === "D" ? "Nul" : "Défaite"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: style.bg,
        color: style.color,
        fontSize: 9,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {style.label}
    </span>
  )
}

export default function FormBadge({
  leagueId,
  teamName,
}: {
  leagueId: string
  teamName: string
}) {
  const [form, setForm] = useState<string | null>(null)

  useEffect(() => {
    const cacheKey = `form_${leagueId}`
    const cached   = sessionStorage.getItem(cacheKey)

    if (cached) {
      const map = JSON.parse(cached)
      setForm(findForm(map, teamName))
      return
    }

    fetch(`/api/form?leagueId=${leagueId}`)
      .then(r => r.json())
      .then(map => {
        sessionStorage.setItem(cacheKey, JSON.stringify(map))
        setForm(findForm(map, teamName))
      })
      .catch(() => {})
  }, [leagueId, teamName])

  if (!form) return null

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {form.split("").map((c, i) => (
        <FormDot key={i} char={c} />
      ))}
    </div>
  )
}

// Correspondance approximative par nom (TheSportsDB ≠ Highlightly noms)
function findForm(map: Record<string, string>, teamName: string): string | null {
  // Recherche exacte
  if (map[teamName]) return map[teamName]

  // Recherche partielle (insensible à la casse)
  const lower = teamName.toLowerCase()
  for (const [key, val] of Object.entries(map)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return val
    }
  }
  return null
}