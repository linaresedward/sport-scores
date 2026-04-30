"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import LangToggle from "./LangToggle";
import { useT } from "@/lib/i18n";

export default function Topbar() {
  const pathname = usePathname();
  const { t } = useT();

  const activeSport =
    pathname.startsWith("/tennis")     ? "/tennis" :
    pathname.startsWith("/basketball") ? "/basketball" :
    "/";

  const SPORTS = [
    { label: t("football"),   icon: "⚽", href: "/" },
    { label: t("tennis"),     icon: "🎾", href: "/tennis" },
    { label: t("basketball"), icon: "🏀", href: "/basketball" },
  ];

  return (
    <header className="topbar" style={{ gap: "16px" }}>
      <div className="topbar__logo">
        <div className="topbar__logo-dot" />
        <span>SportScores</span>
      </div>

      <nav className="topbar__sports">
        {SPORTS.map((sport) => (
          <Link
            key={sport.href}
            href={sport.href}
            className={`topbar__sport-tab ${activeSport === sport.href ? "topbar__sport-tab--active" : ""}`}
          >
            <span className="topbar__sport-icon">{sport.icon}</span>
            {sport.label}
          </Link>
        ))}
      </nav>

      <SearchBar />

      <LangToggle />

      <Link
        href="/favoris"
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "13px", fontWeight: 600, flexShrink: 0,
          color: pathname === "/favoris" ? "#f59e0b" : "#64748b",
          textDecoration: "none", padding: "6px 12px",
          borderRadius: "8px",
          background: pathname === "/favoris" ? "#fef9c3" : "transparent",
          transition: "all 0.15s",
        }}
      >
        <span>⭐</span>
        <span>{t("favorites")}</span>
      </Link>
    </header>
  );
}