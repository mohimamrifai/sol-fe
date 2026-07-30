import { apiUrl } from "@/lib/api-config";

export interface MasterOption {
  value: string;
  label: string;
}

export interface BusinessEntityType extends MasterOption {
  value: "PT" | "CV" | "UD" | "Koperasi" | "Yayasan" | "Firma" | "Perorangan" | "Lainnya";
}

export interface BusinessCategory extends MasterOption {
  value: "trading" | "manufacturing" | "retail" | "distributor" | "e_commerce" | "logistics" | "others";
}

export interface MonthlyShipmentEstimate extends MasterOption {
  value: "<10" | "10-50" | "50-100" | ">100";
}

async function fetchMaster<T>(path: string): Promise<T[]> {
  const res = await fetch(apiUrl(path), {
    headers: { Accept: "application/json" },
    cache: "force-cache",
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`);
  }
  const json = (await res.json()) as { data: T[] };
  return json.data;
}

export const fetchBusinessEntityTypes = () =>
  fetchMaster<BusinessEntityType>("/public/master/business-entity-types");

export const fetchBusinessCategories = () =>
  fetchMaster<BusinessCategory>("/public/master/business-categories");

export const fetchMonthlyShipmentEstimates = () =>
  fetchMaster<MonthlyShipmentEstimate>(
    "/public/master/monthly-shipment-estimates",
  );
