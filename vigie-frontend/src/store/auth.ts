import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: User | null;
  setTokens: (access: string, refresh?: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

/**
 * État d'authentification global (Zustand), persisté dans localStorage.
 * Note : pour une sécurité renforcée en production, on pourra passer
 * le refresh token dans un cookie HttpOnly.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      setTokens: (access, refresh) =>
        set((s) => ({ access, refresh: refresh ?? s.refresh })),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null }),
    }),
    { name: "vigie-auth" },
  ),
);
