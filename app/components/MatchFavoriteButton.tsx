"use client";

import { useFavorites, FavoriteMatch } from "@/hooks/useFavorites";

interface Props {
  match: FavoriteMatch;
  size?: number;
}

export default function MatchFavoriteButton({ match, size = 18 }: Props) {
  const { isFavMatch, toggleFavMatch } = useFavorites();
  const active = isFavMatch(match.id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavMatch(match);
      }}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px 6px",
        fontSize: `${size}px`,
        lineHeight: 1,
        color: active ? "#f59e0b" : "#cbd5e1",
        transition: "color 0.2s, transform 0.15s",
        transform: active ? "scale(1.2)" : "scale(1)",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "#fbbf24";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "#cbd5e1";
      }}
    >
      {active ? "★" : "☆"}
    </button>
  );
}