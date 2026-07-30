// Lightweight wrapper around the country-list npm package.
// English names; ~250 countries; ~16KB total.

import { getNames, getCode } from "country-list";

export interface CountryOption {
  /** ISO 3166-1 alpha-2 code (e.g. "ID", "MY") */
  code: string;
  /** English name from the country-list package */
  name: string;
}

/**
 * Return all countries sorted by English name.
 * Indonesia is the most common customer, but we keep the full list
 * so the form supports cross-border registration.
 */
export function getAllCountries(): CountryOption[] {
  const names = getNames();
  const out: CountryOption[] = [];
  for (const name of names) {
    const code = getCode(name);
    if (code) out.push({ code, name });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export const DEFAULT_COUNTRY = "Indonesia";
