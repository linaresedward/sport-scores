"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import LangToggle from "./LangToggle";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";
import { useT } from "@/lib/i18n";

const SPORTS = [
  { label: "Football",   icon: "⚽", href: "/" },
  { label: "Tennis",     icon: "🎾", href: "/tennis" },
  { label: "Basketball", icon: "🏀", href: "/basketball" },
];

export default function Topbar() {
  const pathname = usePathname();
  const { t } = useT();

  const activeSport =
    pathname.startsWith("/tennis")     ? "/tennis" :
    pathname.startsWith("/basketball") ? "/basketball" :
    "/";

  return (
    <header className="topbar" style={{ gap: "12px" }}>

      {/* Hamburger mobile */}
      <MobileMenu />

      {/* Logo */}
      <div className="topbar__logo">
        <div className="topbar__logo-dot" />
        <span>SportScores</span>
      </div>

      {/* Navigation sports — desktop */}
      <nav className="topbar__sports topbar__sports--desktop">
        {SPORTS.map(sport => (
          <Link
            key={sport.href}
            href={sport.href}
            className={`topbar__sport-tab ${activeSport === sport.href ? "topbar__sport-tab--active" : ""}`}
          >
            <span className="topbar__sport-icon">{sport.icon}</span>
            {t(sport.label.toLowerCase() as any)}
          </Link>
        ))}
      </nav>

      {/* Recherche */}
      <SearchBar />

      {/* Lang toggle */}
      <LangToggle />

      {/* 🌙 Theme toggle */}
      <ThemeToggle />

      {/* Favoris — desktop */}
      <Link
        href="/favoris"
        className="topbar__favorites--desktop"
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