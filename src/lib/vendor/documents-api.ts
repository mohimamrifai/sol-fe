import { apiFetch } from "../api-client";

export type VendorDocumentItem = {
  id: string;
  name: string;
  type: string;
  type_label: string;
  document_type?: string;
  document_type_label?: string;
  mime_type?: string;
  size: number;
  shipment_id: number;
  shipment_number: string;
  jo_number: string;
  uploaded_by: string;
  uploaded_at: string;
  upload_date?: string;
};

export type VendorDocumentListResponse = {
  data: VendorDocumentItem[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export type VendorDocumentDetail = VendorDocumentItem & {
  format?: string;
  file_url?: string | null;
  customer_name?: string;
  activities?: Array<{
    id: number;
    description: string;
    actor_name: string | null;
    occurred_at: string;
  }>;
};

export type VendorDocumentStats = {
  job_order: number;
  consignment_note: number;
  delivery_order: number;
  proof_of_delivery: number;
  supporting: number;
};

export function fetchVendorDocuments(params: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  }
  const qs = q.toString();
  return apiFetch<VendorDocumentListResponse>(`/vendor/documents${qs ? `?${qs}` : ""}`);
}

export function fetchVendorDocument(id: string) {
  return apiFetch<{ data: VendorDocumentDetail }>(`/vendor/documents/${encodeURIComponent(id)}`);
}

export function fetchVendorDocumentStats() {
  return apiFetch<{ data: VendorDocumentStats }>("/vendor/documents/stats");
}

export function getVendorDocumentDownloadUrl(id: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base}/api/vendor/documents/${encodeURIComponent(id)}/download`;
}
