import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "./auth-api";
import { getStoredToken, setStoredToken } from "./api-client";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (token, user) => {
        setStoredToken(token);
        set({ user, isAuthenticated: true });
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearSession: () => {
        setStoredToken(null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "sol-user",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
);

/** Sinkronkan token sessionStorage dengan flag login (setelah rehydrate). */
export function syncAuthTokenWithStore(): void {
  const token = getStoredToken();
  const { isAuthenticated, clearSession } = useAuthStore.getState();
  if (!token && isAuthenticated) {
    clearSession();
  }
  if (token && !isAuthenticated) {
    useAuthStore.setState({ isAuthenticated: true });
  }
}
