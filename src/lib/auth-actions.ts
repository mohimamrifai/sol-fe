"use client";

import { logoutRequest } from "./auth-api";
import { getStoredToken } from "./api-client";
import { useAuthStore } from "./store";

export async function performLogout(): Promise<void> {
  try {
    if (getStoredToken()) {
      await logoutRequest();
    }
  } catch {
    /* abaikan jaringan */
  }
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("sol_profile_cached_at");
  }
  useAuthStore.getState().clearSession();
}
