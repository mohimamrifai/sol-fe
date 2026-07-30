import { apiFetch } from "./api-client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  user_type: "internal" | "customer";
  company_id?: number | null;
  company?: unknown;
  roles: string[];
  permissions?: string[];
}

export async function loginRequest(email: string, password: string) {
  return apiFetch<{ message: string; data: { user: AuthUser; token: string } }>(
    "/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      token: null,
    }
  );
}

export async function profileRequest() {
  return apiFetch<{ data: AuthUser }>("/profile", { method: "GET" });
}

export async function logoutRequest() {
  return apiFetch<{ message: string }>("/logout", { method: "POST" });
}

export interface RegisterCompanyPayload {
  // Section 1
  business_entity_type: string;
  business_entity_other?: string;
  company_name: string;
  company_code: string;
  npwp: string;
  company_email: string;
  company_phone: string;
  website?: string;
  // Section 2
  country: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  address: string;
  // Section 3
  business_category: string;
  business_category_other?: string;
  monthly_shipment_estimate: string;
  // Section 4
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  password: string;
  password_confirmation: string;
  terms_accepted: boolean;
}

export async function registerCompanyRequest(payload: RegisterCompanyPayload) {
  return apiFetch<{ message: string; data: unknown }>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
    token: null,
  });
}

export async function checkCompanyCodeRequest(code: string) {
  const params = new URLSearchParams({ code });
  return apiFetch<{ code: string; exists: boolean; message: string }>(
    `/register/check-company-code?${params.toString()}`,
    { method: "GET", token: null },
  );
}

export async function forgotPasswordRequest(email: string) {
  return apiFetch<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    token: null,
  });
}

export async function resetPasswordRequest(payload: Record<string, string>) {
  return apiFetch<{ message: string }>("/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
    token: null,
  });
}
