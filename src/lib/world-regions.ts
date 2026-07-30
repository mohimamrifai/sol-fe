// Lightweight wrapper around `country-state-city` for non-Indonesia regions.
//
// We use country-list for the 250 country names (16KB) and only fall
// back to country-state-city for the state/city hierarchy of countries
// outside Indonesia. Indonesia itself still uses `daerah-indonesia`
// (lazy-loaded) for accurate province → kabupaten → kecamatan data.

import * as CSC from "country-state-city";

export interface WorldState {
  name: string;
  isoCode: string;
  countryCode: string;
}

export interface WorldCity {
  name: string;
  countryCode: string;
  stateCode: string;
}

/**
 * Look up ISO 3166-1 alpha-2 code for an English country name.
 * Returns undefined if not found.
 */
export function getCountryIsoCode(name: string): string | undefined {
  if (!name) return undefined;
  const c = CSC.Country.getCountryByCode(name.toUpperCase());
  if (c) return c.isoCode;
  // Fallback: scan all countries
  const all = CSC.Country.getAllCountries();
  const match = all.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.isoCode;
}

/**
 * Return all states/provinces for a country (by English name).
 * Empty array if the country has no state subdivision in the dataset.
 */
export function getStatesForCountry(countryName: string): WorldState[] {
  const iso = getCountryIsoCode(countryName);
  if (!iso) return [];
  const states = CSC.State.getStatesOfCountry(iso);
  return states.map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
    countryCode: s.countryCode,
  }));
}

/**
 * Return all cities for a (country, state) pair.
 * Falls back to all cities in the country when stateCode is empty.
 */
export function getCitiesForCountryState(
  countryName: string,
  stateName: string,
): WorldCity[] {
  const iso = getCountryIsoCode(countryName);
  if (!iso) return [];
  let cities: ReturnType<typeof CSC.City.getCitiesOfState>;
  if (stateName) {
    const state = CSC.State.getStateByCodeAndCountry(stateName, iso);
    if (!state) {
      // Some datasets use state name instead of code.
      const allStates = CSC.State.getStatesOfCountry(iso);
      const matched = allStates.find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase(),
      );
      if (matched) {
        cities = CSC.City.getCitiesOfState(iso, matched.isoCode);
      } else {
        cities = [];
      }
    } else {
      cities = CSC.City.getCitiesOfState(iso, state.isoCode);
    }
  } else {
    cities = CSC.City.getCitiesOfCountry(iso) ?? [];
  }
  return cities.map((c) => ({
    name: c.name,
    countryCode: c.countryCode,
    stateCode: c.stateCode,
  }));
}
