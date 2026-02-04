"use client";

import { useState } from "react";

// Simplified auth hook for demo purposes
export function useAuth() {
  return {
    user: null,
    session: null,
    loading: false,
    signIn: async () => ({ error: "Auth not configured in demo" }),
    signUp: async () => ({ error: "Auth not configured in demo" }),
    signInWithOAuth: async () => ({ error: "Auth not configured in demo" }),
    signOut: async () => ({ error: null }),
  };
}
