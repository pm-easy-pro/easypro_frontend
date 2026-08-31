"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "easypro_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      setFavorites([]);
    }
  }, []);

  const persist = useCallback((next: number[]) => {
    setFavorites(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (id: number) => {
      persist(favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);
    },
    [favorites, persist],
  );

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
