"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (cb: () => void) => () => void;
};

function getPersistApi(): PersistApi | null {
  const maybe = useAuthStore as unknown as { persist?: PersistApi };
  return maybe.persist ?? null;
}

/**
 * true setelah zustand persist selesai baca localStorage.
 * Tanpa ini, render pertama setelah mount sering masih user === null
 * sehingga pengecekan role (mis. super_admin) salah.
 */
export function useAuthPersistHydrated() {
  const [hydrated, setHydrated] = useState(() => {
    const persistApi = getPersistApi();
    return persistApi ? persistApi.hasHydrated() : true;
  });

  useEffect(() => {
    const persistApi = getPersistApi();
    if (!persistApi || persistApi.hasHydrated()) return;
    const unsub = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}
