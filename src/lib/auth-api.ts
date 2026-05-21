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

export async function registerCompanyRequest(payload: {
  company_entity_type: string;
  company_name: string;
  company_code?: string;
  npwp?: string;
  nib?: string;
  company_address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  company_phone?: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}) {
  return apiFetch<{ message: string; data: unknown }>("/register", {
    method: "POST",
    body: JSON.stringify(payload),
    token: null,
  });
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
