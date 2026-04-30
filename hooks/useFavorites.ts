// hooks/useFavorites.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export type FavoriteType = "team" | "league";

export interface Favorite {
  id: string;
  type: FavoriteType;
  name: string;
  logo?: string;
}

const STORAGE_KEY = "sport-scores-favorites";

function loadFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: Favorite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // Chargement initial depuis localStorage
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const addFavorite = useCallback((fav: Favorite) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === fav.id && f.type === fav.type);
      if (exists) return prev;
      const updated = [...prev, fav];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((id: string, type: FavoriteType) => {
    setFavorites((prev) => {
      const updated = prev.filter((f) => !(f.id === id && f.type === type));
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const toggleFavorite = useCallback(
    (fav: Favorite) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === fav.id && f.type === fav.type);
        const updated = exists
          ? prev.filter((f) => !(f.id === fav.id && f.type === fav.type))
          : [...prev, fav];
        saveFavorites(updated);
        return updated;
      });
    },
    []
  );

  const isFavorite = useCallback(
    (id: string, type: FavoriteType) =>
      favorites.some((f) => f.id === id && f.type === type),
    [favorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    teams: favorites.filter((f) => f.type === "team"),
    leagues: favorites.filter((f) => f.type === "league"),
  };
}