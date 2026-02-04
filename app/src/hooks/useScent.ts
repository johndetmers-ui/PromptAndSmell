"use client";

import { useState, useCallback } from "react";

// Simplified scent hooks for demo purposes
export function useScent(id: string | null) {
  return {
    scent: null,
    loading: false,
    error: null,
    refetch: async () => {},
  };
}

export function useScents(filters = {}) {
  return {
    scents: [],
    count: 0,
    loading: false,
    error: null,
    refetch: async () => {},
  };
}

export function useTrendingScents(limit = 20) {
  return {
    scents: [],
    loading: false,
    error: null,
    refetch: async () => {},
  };
}

export function useCreateScent() {
  return {
    createScent: async () => null,
    loading: false,
    error: null,
  };
}

export function useLikeScent(scentId: string | null) {
  const [liked, setLiked] = useState(false);
  return {
    liked,
    likeCount: 0,
    loading: false,
    toggle: async () => setLiked(!liked),
    checkStatus: async () => {},
  };
}

export function useFavoriteScent(scentId: string | null) {
  const [favorited, setFavorited] = useState(false);
  return {
    favorited,
    loading: false,
    toggle: async () => setFavorited(!favorited),
  };
}
