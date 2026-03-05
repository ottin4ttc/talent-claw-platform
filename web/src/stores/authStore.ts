import { create } from "zustand";
import type { User } from "@/types";
import { clearToken, getToken } from "@/lib/auth";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setLogin: (user: User) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!getToken(),
  user: null,
  setLogin: (user) => set({ isAuthenticated: true, user }),
  setUser: (user) => set({ user }),
  logout: () => {
    clearToken();
    set({ isAuthenticated: false, user: null });
    if (typeof window !== "undefined") {
      const segments = window.location.pathname.split("/");
      const locale = ["en", "zh"].includes(segments[1]) ? segments[1] : "en";
      window.location.href = `/${locale}/login`;
    }
  },
}));
