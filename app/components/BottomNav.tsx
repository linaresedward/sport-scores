"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

const SPORTS = [
  { labelKey: "football" as const, icon: "⚽", href: "/" },
  { labelKey: "hockey"   as const, icon: "🏒", href: "/hockey" },
  { labelKey: "basketball" as const, icon: "🏀", href: "/basketball" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();

  const activeSport =
    pathname.startsWith("/hockey")     ? "/hockey" :
    pathname.startsWith("/basketball") ? "/basketball" :
    "/";

  const isFavoris = pathname === "/favoris";

  return (
    <nav className="bottom-nav">
      {SPORTS.map(sport => {
        const isActive = activeSport === sport.href && !isFavoris;
        return (
          <Link key={sport.href} href={sport.href} className={`bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}>
            <span className="bottom-nav__icon">{sport.icon}</span>
            <span className="bottom-nav__label">{t(sport.labelKey)}</span>
          </Link>
        );
      })}

      <Link href="/favoris" className={`bottom-nav__item${isFavoris ? " bottom-nav__item--active bottom-nav__item--favorites" : ""}`}>
        <span className="bottom-nav__icon">⭐</span>
        <span className="bottom-nav__label">{t("favorites")}</span>
      </Link>
    </nav>
  );
}
