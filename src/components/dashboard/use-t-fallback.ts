"use client";

import { useTranslations } from "next-intl";

/**
 * Returns a translator that takes a dynamic i18n key and falls back to
 * the supplied default text if the key is missing — useful for status
 * enums where backend values may introduce new keys without a code change.
 */
export function useTWithFallback() {
  const t = useTranslations();
  return (key: string, fallback: string): string => {
    try {
      // next-intl's t() returns the key string when the key is missing.
      // The cast keeps TypeScript happy without losing runtime safety.
      const translated = t(key as never);
      if (typeof translated === "string" && translated && translated !== key) {
        return translated;
      }
    } catch {
      // Key not found — fall through to fallback.
    }
    return fallback;
  };
}
