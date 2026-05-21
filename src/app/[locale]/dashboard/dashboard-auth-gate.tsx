"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore, syncAuthTokenWithStore } from "@/lib/store";
import { getStoredToken } from "@/lib/api-client";
import { profileRequest } from "@/lib/auth-api";
import { useAuthPersistHydrated } from "@/lib/use-auth-hydrated";

const PROFILE_CACHE_KEY = "sol_profile_cached_at";
const PROFILE_REVALIDATE_MS = 5 * 60 * 1000; // 5 menit

function getProfileCachedAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
  const ts = raw ? Number(raw) : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

function markProfileCachedNow(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PROFILE_CACHE_KEY, String(Date.now()));
}

function clearProfileCacheMark(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PROFILE_CACHE_KEY);
}

export function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthPersistHydrated();
  const { user, setUser, clearSession } = useAuthStore();

  useEffect(() => {
    syncAuthTokenWithStore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = getStoredToken();
    if (!token) {
      clearProfileCacheMark();
      router.replace("/login");
      return;
    }
    const stale = Date.now() - getProfileCachedAt() > PROFILE_REVALIDATE_MS;

    // Jika user sudah ada, tetap render cepat. Revalidate profile di background saat stale.
    if (user) {
      if (!stale) return;
      profileRequest()
        .then((res) => {
          setUser(res.data);
          markProfileCachedNow();
        })
        .catch(() => {
          // Jangan hard logout di background refresh untuk menghindari UX tersendat.
        });
      return;
    }

    // Jika user belum ada, fetch profile diperlukan untuk sesi awal.
    profileRequest()
      .then((res) => {
        setUser(res.data);
        markProfileCachedNow();
      })
      .catch(() => {
        clearProfileCacheMark();
        clearSession();
        router.replace("/login");
      });
  }, [hydrated, user, setUser, clearSession, router]);

  // Jangan block penuh saat profile user belum ada.
  // Selama token ada, biarkan shell/layout tetap render dan profile di-refresh di background.
  if (!hydrated || !getStoredToken()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Memuat sesi…
      </div>
    );
  }

  return <>{children}</>;
}
