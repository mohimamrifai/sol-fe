import { apiFetch, apiFetchBlob } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminShipments(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/shipments${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function fetchAdminShipment(id: number) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/shipments/${id}`, { method: "GET" });
}

export async function updateAdminShipment(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/shipments/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function updateAdminShipmentTracking(id: number, formData: FormData) {
  return apiFetch(`/admin/shipments/${id}/tracking`, { method: "POST", body: formData });
}

export async function addAdminShipmentContainer(shipmentId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/shipments/${shipmentId}/containers`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminShipmentContainer(containerId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/containers/${containerId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function addAdminContainerRack(containerId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/containers/${containerId}/racks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminRack(rackId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/racks/${rackId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminRack(rackId: number) {
  return apiFetch(`/admin/racks/${rackId}`, { method: "DELETE" });
}

export async function addAdminShipmentItem(shipmentId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/shipments/${shipmentId}/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminShipmentItem(itemId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/shipment-items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminShipmentItem(itemId: number) {
  return apiFetch(`/admin/shipment-items/${itemId}`, { method: "DELETE" });
}

export async function fetchAdminShipmentOptions() {
  return apiFetch<{ data: { vehicle_types: string[]; tracking_statuses: string[] } }>(
    `/admin/shipments/options`,
    { method: "GET" }
  );
}

export async function generateAdminConsignmentNote(id: number) {
  return apiFetch<{ data: { waybill_number: string } }>(
    `/admin/shipments/${id}/generate-consignment-note`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function downloadAdminConsignmentNotePdf(shipmentId: number) {
  return apiFetchBlob(`/admin/shipments/${shipmentId}/consignment-note-pdf`, { method: "GET" });
}

export async function viewAdminConsignmentNotePdf(shipmentId: number) {
  return apiFetchBlob(`/admin/shipments/${shipmentId}/consignment-note-pdf?view=1`, { method: "GET" });
}

export async function downloadAdminWaybillPdf(shipmentId: number) {
  return apiFetchBlob(`/admin/shipments/${shipmentId}/waybill-pdf`, { method: "GET" });
}

export async function fetchAdminShipmentStats() {
  return apiFetch<{ data: Record<string, number> }>(`/admin/shipments/stats`, { method: "GET" });
}

export async function readyAdminShipmentForDeparture(id: number) {
  return apiFetch(`/admin/shipments/${id}/ready-for-departure`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function cancelAdminShipment(id: number, reason: string) {
  return apiFetch(`/admin/shipments/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAdminAvailableContainers(
  shipmentId: number,
  params?: { ownership?: string; container_type_id?: number; search?: string }
) {
  const qs = new URLSearchParams();
  if (params?.ownership) qs.set("ownership", params.ownership);
  if (params?.container_type_id) qs.set("container_type_id", String(params.container_type_id));
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return apiFetch<{ data: Array<Record<string, unknown>> }>(
    `/admin/shipments/${shipmentId}/available-containers${q ? `?${q}` : ""}`,
    { method: "GET" }
  );
}

export async function assignAdminContainerSlot(
  shipmentId: number,
  containerId: number,
  body: Record<string, unknown>
) {
  return apiFetch(`/admin/shipments/${shipmentId}/containers/${containerId}/assign`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function registerAdminVendorContainer(shipmentId: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/shipments/${shipmentId}/register-vendor-container`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadAdminShipmentDocument(shipmentId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch(`/admin/shipments/${shipmentId}/documents`, { method: "POST", body: formData });
}

export async function downloadAdminShipmentDocument(
  shipmentId: number,
  documentId: number,
  filename?: string
) {
  const blob = await apiFetchBlob(`/admin/shipments/${shipmentId}/documents/${documentId}`, {
    method: "GET",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `shipment-document-${documentId}`;
  a.click();
  URL.revokeObjectURL(url);
}
