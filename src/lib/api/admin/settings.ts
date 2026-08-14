import { apiFetch } from "../../api-client";

export type SystemSettingField = {
  key: string;
  group: string;
  type: string;
  label: string;
  default?: unknown;
  options?: string[] | Record<string, string>;
  secret?: boolean;
};

export async function fetchAdminProfile() {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/settings/profile`);
}

export async function updateAdminProfile(body: Record<string, unknown>) {
  return apiFetch(`/profile`, { method: "PUT", body: JSON.stringify(body) });
}

export async function changeAdminPassword(body: Record<string, unknown>) {
  return apiFetch(`/admin/settings/change-password`, { method: "POST", body: JSON.stringify(body) });
}

export async function fetchAdminNumberingFormats() {
  return apiFetch<{ data: Record<string, unknown>[] }>(`/admin/settings/numbering-formats`);
}

export async function fetchAdminNumberingFormat(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/settings/numbering-formats/${id}`);
}

export async function previewAdminNumberingFormat(body: Record<string, unknown>) {
  return apiFetch<{ preview: string }>(`/admin/settings/numbering-formats/preview`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminNumberingFormat(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/settings/numbering-formats/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function fetchAdminSystemSettings() {
  return apiFetch<{
    data: {
      schema: SystemSettingField[];
      values: Record<string, unknown>;
      activity_log?: Array<Record<string, unknown>>;
    };
  }>(`/admin/settings/system`);
}

export async function updateAdminSystemSettings(body: Record<string, unknown>) {
  return apiFetch(`/admin/settings/system`, { method: "PUT", body: JSON.stringify(body) });
}

export async function testAdminSystemEmail(recipient: string) {
  return apiFetch(`/admin/settings/system/test-email`, {
    method: "POST",
    body: JSON.stringify({ recipient }),
  });
}

export async function fetchAdminActivityLogs(module: string, subjectId?: number) {
  const params = new URLSearchParams({ module });
  if (subjectId != null) params.set("subject_id", String(subjectId));
  return apiFetch<{ data: Array<Record<string, unknown>> }>(`/admin/settings/activity-logs?${params.toString()}`);
}
