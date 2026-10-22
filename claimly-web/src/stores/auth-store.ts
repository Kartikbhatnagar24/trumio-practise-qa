import { create } from "zustand";

import { User } from "@/constraints/types/claim-types";

const STORAGE_KEY = "claimly-session";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setSession: (token: string, user: User) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

const saved = (): { token: string; user: User } | null => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: saved()?.token ?? null,
  user: saved()?.user ?? null,
  isLoading: false,
  setSession: (token, user) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user });
  },
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => {
    sessionStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null });
  },
}));
