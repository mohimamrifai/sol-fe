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

export async function updateAdminContainer(containerId: number, body: Record<string, unknown>) {
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

export async function downloadAdminConsignmentNotePdf(shipmentId: number) {
  return apiFetchBlob(`/admin/shipments/${shipmentId}/consignment-note-pdf`, { method: "GET" });
}

export async function downloadAdminWaybillPdf(shipmentId: number) {
  return apiFetchBlob(`/admin/shipments/${shipmentId}/waybill-pdf`, { method: "GET" });
}
