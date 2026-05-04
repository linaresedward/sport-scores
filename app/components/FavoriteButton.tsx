"use client";

import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import type { Favorite } from "@/hooks/useFavorites";

interface Props {
  item: Favorite;
  size?: "sm" | "md";
}

export default function FavoriteButton({ item, size = "md" }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [burst, setBurst] = useState(false);

  const active = isFavorite(item.id, item.type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item);
    if (!active) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
  };

  const sizeStyle = size === "sm"
    ? { width: "24px", height: "24px", fontSize: "13px" }
    : { width: "32px", height: "32px", fontSize: "16px" };

  return (
    <button
  onClick={handleClick}
  title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
  className={size === "sm" ? "fav-btn-team-sm" : ""}
      style={{
        ...sizeStyle,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: active ? "#fef9c3" : "transparent",
        color: active ? "#f59e0b" : "#ffffff",
        transform: burst ? "scale(1.3)" : "scale(1)",
        transition: "transform 0.2s cubic-bezier(.36,2,.5,.8), background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {active ? "★" : "☆"}
    </button>
  );
}