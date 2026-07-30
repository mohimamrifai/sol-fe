declare module "country-list" {
  /**
   * Return a sorted array of all country names.
   */
  export function getNames(): string[];

  /**
   * Return a sorted array of all ISO 3166-1 alpha-2 codes.
   */
  export function getCodes(): string[];

  /**
   * Return the ISO 3166-1 alpha-2 code for a given country name.
   */
  export function getCode(name: string): string | undefined;

  /**
   * Return the country name for a given ISO 3166-1 alpha-2 code.
   */
  export function getName(code: string): string | undefined;

  /**
   * Return the full data object (code -> name).
   */
  export const data: Record<string, string>;
  export const codes: Record<string, string>;
  export const names: Record<string, string>;
}

declare module "daerah-indonesia" {
  interface DaerahEntry {
    id: number;
    nama: string;
  }

  interface Daerah {
    getProvinsi(id?: number | string): DaerahEntry[] | DaerahEntry | undefined;
    getKabupaten(id?: number | string): DaerahEntry[] | DaerahEntry | undefined;
    getKecamatan(id?: number | string): DaerahEntry[] | DaerahEntry | undefined;
    getKelurahan(id?: number | string): DaerahEntry[] | DaerahEntry | undefined;
  }

  const daerah: Daerah;
  export default daerah;
}
