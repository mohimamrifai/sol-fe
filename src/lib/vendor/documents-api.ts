import { apiFetch } from "../api-client";

export type VendorDocumentItem = {
  id: number;
  name: string;
  type: string;
  type_label: string;
  mime_type: string;
  size: number;
  shipment_id: number;
  shipment_number: string;
  jo_number: string;
  uploaded_by: string;
  uploaded_at: string;
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

export type VendorDocumentDetail = {
  id: number;
  name: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
  shipment_id: number;
  shipment_number: string;
  jo_number: string;
  customer_name: string;
  file_url: string;
};

export type VendorDocumentStats = {
  job_order: number;
  consignment_note: number;
  delivery_order: number;
  proof_of_completion: number;
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

export function fetchVendorDocument(id: number) {
  return apiFetch<{ data: VendorDocumentDetail }>(`/vendor/documents/${id}`);
}

export function fetchVendorDocumentStats() {
  return apiFetch<{ data: VendorDocumentStats }>("/vendor/documents/stats");
}

export function getVendorDocumentDownloadUrl(id: number): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/vendor/documents/${id}/download`;
}
