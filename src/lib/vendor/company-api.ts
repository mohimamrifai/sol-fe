import { apiFetch } from "../api-client";

export type VendorCompany = {
  id: number;
  type: "customer" | "vendor";
  name: string;
  business_entity_type: string | null;
  company_code: string;
  npwp: string | null;
  nib: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  district: string | null;
  postal_code: string | null;
  service_categories: string[];
  business_category: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  pic_name: string | null;
  pic_email: string | null;
  pic_mobile: string | null;
  status: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
};

export type VendorCompanyActivity = {
  id: number;
  event_key: string;
  description: string;
  actor_name: string | null;
  occurred_at: string;
};

export function fetchVendorCompany() {
  return apiFetch<{ data: VendorCompany }>("/vendor/company");
}

export function updateVendorCompany(payload: Partial<VendorCompany>) {
  return apiFetch<{ message: string; data: VendorCompany }>("/vendor/company", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchVendorCompanyActivities() {
  return apiFetch<{ data: VendorCompanyActivity[] }>("/vendor/company/activities");
}
