"use client";

import { useState, useEffect, useCallback } from "react";

export type FavoriteType = "team" | "league" | "match";

export interface Favorite {
  id: string;
  type: FavoriteType;
  name: string;
  logo?: string;
}

export interface FavoriteMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  league: string;
  leagueId?: string;
  leagueLogo?: string;
  date: string;
  time?: string;
}

const STORAGE_KEY       = "sport-scores-favorites";
const STORAGE_KEY_MATCH = "sport-scores-fav-matches";

function loadFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(favs: Favorite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

function loadFavMatches(): FavoriteMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MATCH);
    const all: FavoriteMatch[] = raw ? JSON.parse(raw) : [];
    // Auto-suppression des matchs d'un jour passé
    const today = new Date().toISOString().split("T")[0];
    const active = all.filter((m) => m.date >= today);
    if (active.length < all.length) {
      localStorage.setItem(STORAGE_KEY_MATCH, JSON.stringify(active));
    }
    return active;
  } catch { return []; }
}

function saveFavMatches(matches: FavoriteMatch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_MATCH, JSON.stringify(matches));
}

export function useFavorites() {
  const [favorites, setFavorites]     = useState<Favorite[]>([]);
  const [favMatches, setFavMatches]   = useState<FavoriteMatch[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
    setFavMatches(loadFavMatches());
  }, []);

  // ── Équipes & Ligues ──────────────────────────────────
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

  const toggleFavorite = useCallback((fav: Favorite) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === fav.id && f.type === fav.type);
      const updated = exists
        ? prev.filter((f) => !(f.id === fav.id && f.type === fav.type))
        : [...prev, fav];
      saveFavorites(updated);
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string, type: FavoriteType) =>
      favorites.some((f) => f.id === id && f.type === type),
    [favorites]
  );

  // ── Matchs ────────────────────────────────────────────
  const toggleFavMatch = useCallback((match: FavoriteMatch) => {
    setFavMatches((prev) => {
      const exists = prev.some((m) => m.id === match.id);
      const updated = exists
        ? prev.filter((m) => m.id !== match.id)
        : [...prev, match];
      saveFavMatches(updated);
      return updated;
    });
  }, []);

  const isFavMatch = useCallback(
    (id: string) => favMatches.some((m) => m.id === id),
    [favMatches]
  );

  const removeFavMatch = useCallback((id: string) => {
    setFavMatches((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      saveFavMatches(updated);
      return updated;
    });
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    teams:      favorites.filter((f) => f.type === "team"),
    leagues:    favorites.filter((f) => f.type === "league"),
    // matchs
    favMatches,
    toggleFavMatch,
    isFavMatch,
    removeFavMatch,
  };
}