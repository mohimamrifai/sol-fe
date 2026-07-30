// Lazy-loaded wrapper around `daerah-indonesia` npm package.
//
// The package is ~3.4MB unpacked (3 JSON files) so we load it on
// first use rather than on the main bundle. Callers should `await`
// `loadDaerah()` once before reading from the lists.

type DaerahInstance = {
  getProvinsi: (id?: number | string) => Array<{ id: number; nama: string }> | { id: number; nama: string } | undefined;
  getKabupaten: (id?: number | string) => Array<{ id: number; nama: string }> | { id: number; nama: string } | undefined;
  getKecamatan: (id?: number | string) => Array<{ id: number; nama: string }> | { id: number; nama: string } | undefined;
};

let daerahCache: DaerahInstance | null = null;
let loadPromise: Promise<DaerahInstance> | null = null;

export async function loadDaerah(): Promise<DaerahInstance> {
  if (daerahCache) return daerahCache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const mod = (await import("daerah-indonesia")) as unknown as { default: DaerahInstance } | DaerahInstance;
    daerahCache = (mod as { default?: DaerahInstance }).default ?? (mod as DaerahInstance);
    return daerahCache!;
  })();
  return loadPromise;
}

export interface Province {
  id: number;
  name: string;
}

export interface City {
  id: number;
  provinceId: number;
  name: string;
}

export interface District {
  id: number;
  cityId: number;
  name: string;
}

export async function getAllProvinces(): Promise<Province[]> {
  const d = await loadDaerah();
  const list = d.getProvinsi() as Array<{ id: number; nama: string }>;
  return list.map((p) => ({ id: p.id, name: p.nama }));
}

export async function getCitiesForProvince(provinceId: number): Promise<City[]> {
  const d = await loadDaerah();
  const list = d.getKabupaten(provinceId) as Array<{ id: number; nama: string }>;
  return list.map((c) => ({ id: c.id, provinceId, name: c.nama }));
}

export async function getDistrictsForCity(cityId: number): Promise<District[]> {
  const d = await loadDaerah();
  const list = d.getKecamatan(cityId) as Array<{ id: number; nama: string }>;
  return list.map((k) => ({ id: k.id, cityId, name: k.nama }));
}
