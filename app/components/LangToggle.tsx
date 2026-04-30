"use client";

import { useT } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "#f1f5f9", borderRadius: "8px",
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
            background: lang === l ? "#fff" : "transparent",
            color: lang === l ? "#0f172a" : "#94a3b8",
            boxShadow: lang === l ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}