import { apiFetch } from "../api-client";

export type VendorUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  status: "active" | "inactive";
  user_type: "vendor";
  company_id: number;
  roles: string[];
  primary_role: string;
  primary_role_label: string;
  last_login_at: string | null;
  created_at: string;
  is_current_user?: boolean;
  is_last_company_admin?: boolean;
};

export type VendorUserStats = {
  total: number;
  active: number;
  inactive: number;
};

export type VendorUserListResponse = {
  data: VendorUser[];
  meta: { total: number; per_page: number; current_page: number; last_page: number };
};

export function fetchVendorUserStats() {
  return apiFetch<{ data: VendorUserStats }>("/vendor/users/stats");
}

export function fetchVendorUsers(params: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  }
  const qs = q.toString();
  return apiFetch<VendorUserListResponse>(`/vendor/users${qs ? `?${qs}` : ""}`);
}

export function fetchVendorUser(id: number) {
  return apiFetch<{ data: VendorUser & { activities: Array<unknown> } }>(`/vendor/users/${id}`);
}

export function createVendorUser(payload: Record<string, unknown>) {
  return apiFetch<{ message: string; data: VendorUser; temporary_password: string }>(
    "/vendor/users",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function updateVendorUser(id: number, payload: Record<string, unknown>) {
  return apiFetch<{ message: string; data: VendorUser }>(`/vendor/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changeVendorUserRole(id: number, role: string) {
  return apiFetch<{ message: string; data: VendorUser }>(`/vendor/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function changeVendorUserStatus(id: number, status: "active" | "inactive") {
  return apiFetch<{ message: string; data: VendorUser }>(`/vendor/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function resetVendorUserPassword(id: number) {
  return apiFetch<{ message: string; temporary_password: string }>(
    `/vendor/users/${id}/reset-password`,
    { method: "POST", body: JSON.stringify({}) }
  );
}
