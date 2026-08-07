import { apiFetch } from "../api-client";

export type VendorMyProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  user_type: "vendor";
  roles: string[];
  permissions: string[];
  feature_access: string[] | null;
  last_login_at: string | null;
  created_at: string | null;
  profile_photo_path: string | null;
  profile_photo_url: string | null;
  company: {
    id: number;
    name: string;
    type: "vendor";
    company_code: string;
  } | null;
};

export function fetchVendorMyProfile() {
  return apiFetch<{ data: VendorMyProfile }>("/vendor/my-profile");
}

export function updateVendorMyProfile(payload: { name?: string; phone?: string }) {
  return apiFetch<{ message: string; data: VendorMyProfile }>("/vendor/my-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function uploadVendorProfilePhoto(file: File) {
  const fd = new FormData();
  fd.append("photo", file);
  return apiFetch<{ message: string; profile_photo_path: string; profile_photo_url: string }>(
    "/vendor/my-profile/photo",
    { method: "POST", body: fd }
  );
}

export function deleteVendorProfilePhoto() {
  return apiFetch<{ message: string }>("/vendor/my-profile/photo", { method: "DELETE" });
}

export function changeVendorPassword(payload: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}) {
  return apiFetch<{ message: string }>("/vendor/my-profile/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchVendorMyProfileActivities() {
  return apiFetch<{
    data: Array<{ id: number; event_key: string; description: string; occurred_at: string }>;
  }>("/vendor/my-profile/activities");
}
