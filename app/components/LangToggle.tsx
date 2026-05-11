"use client";

import { useT } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "var(--bg-muted)", borderRadius: "8px",
      padding: "2px", gap: "2px", flexShrink: 0,
    }}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: lang === l ? "var(--bg-surface)" : "transparent",
            color: lang === l ? "var(--text-primary)" : "var(--text-muted)",
            boxShadow: lang === l ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}