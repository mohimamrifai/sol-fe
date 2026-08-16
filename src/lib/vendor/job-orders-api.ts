import { apiFetch } from "../api-client";

export type VendorJobStatus =
  | "pending_acceptance"
  | "accepted"
  | "in_progress"
  | "waiting_verification"
  | "completed"
  | "rejected";

export type JobOrder = {
  id: number;
  shipment_no: string;
  shipment_number: string;
  jo_number: string;
  customer?: {
    id: number;
    name: string;
    company_code?: string;
  };
  service_type?: {
    id: number;
    code: string;
    name: string;
  };
  origin_location?: {
    id: number;
    code: string;
    name: string;
  };
  destination_location?: {
    id: number;
    code: string;
    name: string;
  };
  assigned_date: string;
  due_date: string;
  estimated_departure: string;
  estimated_arrival: string;
  status: string;
  vendor_status: VendorJobStatus;
  vendor_status_label: string;
  accepted_at: string | null;
  completion_submitted_at: string | null;
  completion_verified_at: string | null;
  completion_remark: string | null;
  shipment_coverage: string;
  is_dangerous_goods: boolean;
  temperature: string | null;
  notes: string | null;
};

export type JobOrderListItem = Pick<
  JobOrder,
  | "id"
  | "shipment_number"
  | "jo_number"
  | "customer"
  | "service_type"
  | "origin_location"
  | "destination_location"
  | "assigned_date"
  | "due_date"
  | "vendor_status"
  | "vendor_status_label"
>;

export type JobOrderListResponse = {
  data: JobOrder[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
};

export type JobOrderStats = {
  pending_acceptance: number;
  accepted: number;
  in_progress: number;
  waiting_verification: number;
  completed: number;
};

export type JobOrderDetail = JobOrder & {
  priority?: string;
  assigned_by?: string | null;
  job_description?: string | null;
  work_location?: string | null;
  job_details?: {
    containers?: Array<{ container_no?: string; container_type?: string }>;
    cargo_description?: string;
    pickup_location?: string;
    delivery_location?: string;
    special_instruction?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
    driver_name?: string;
  };
  internal_documents?: Array<{
    id: number;
    name: string;
    document_type: string;
    mime_type: string;
    size: number;
    file_url: string;
    uploaded_by: string | null;
    uploaded_at: string;
  }>;
  progress_updates: Array<{
    id: number;
    progress_notes: string | null;
    completion_remark: string | null;
    submitted_by: string | null;
    submitted_at: string;
    attachments: Array<{
      id: number;
      file_path: string;
      file_url: string;
      original_name: string;
      mime_type: string;
      size: number;
    }>;
  }>;
  supporting_documents: Array<{
    id: number;
    name: string;
    mime_type: string;
    size: number;
    file_url: string;
    uploaded_by: string | null;
    uploaded_at: string;
  }>;
  timeline: Array<{
    event: string;
    activity?: string;
    description: string;
    status?: string;
    status_label?: string;
    updated_by?: string;
    occurred_at: string;
  }>;
  activities: Array<{
    id: number;
    event_key: string;
    description: string;
    actor_name: string | null;
    occurred_at: string;
  }>;
};

export function fetchJobOrderStats() {
  return apiFetch<{ data: JobOrderStats }>("/vendor/job-orders/stats");
}

export function fetchJobOrders(params: Record<string, unknown> = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  }
  const qs = q.toString();
  return apiFetch<JobOrderListResponse>(`/vendor/job-orders${qs ? `?${qs}` : ""}`);
}

export function fetchJobOrder(id: number) {
  return apiFetch<{ data: JobOrderDetail }>(`/vendor/job-orders/${id}`);
}

export function acceptJobOrder(id: number) {
  return apiFetch<{ message: string; data: JobOrder }>(`/vendor/job-orders/${id}/accept`, {
    method: "POST",
  });
}

export function rejectJobOrder(id: number, rejectionReason?: string) {
  return apiFetch<{ message: string; data: JobOrder }>(`/vendor/job-orders/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: rejectionReason ?? null }),
    headers: { "Content-Type": "application/json" },
  });
}

export function submitProgress(id: number, payload: FormData) {
  return apiFetch<{ message: string; data: unknown }>(`/vendor/job-orders/${id}/progress`, {
    method: "POST",
    body: payload,
  });
}

export function submitCompletion(id: number, payload: FormData) {
  return apiFetch<{ message: string; data: JobOrder }>(`/vendor/job-orders/${id}/submit-completion`, {
    method: "POST",
    body: payload,
  });
}

export function fetchJobOrderActivities(id: number) {
  return apiFetch<{ data: Array<{ id: number; event_key: string; description: string; actor_name?: string; occurred_at: string }> }>(
    `/vendor/job-orders/${id}/activities`
  );
}
