import { apiFetch } from "../../api-client";
import { buildListQuery, normalizeListParams, type ListQueryParams } from "../../list-query";
import type { LaravelPaginated } from "../../types-api";

export async function fetchAdminLocations(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/locations${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminLocation(body: Record<string, unknown>) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/locations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminLocation(id: number, body: Record<string, unknown>) {
  return apiFetch<{ data: Record<string, unknown> }>(`/admin/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminLocation(id: number) {
  return apiFetch(`/admin/locations/${id}`, { method: "DELETE" });
}

export async function fetchAdminTransportModes(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/transport-modes${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminTransportMode(body: Record<string, unknown>) {
  return apiFetch(`/admin/transport-modes`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminTransportMode(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/transport-modes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminTransportMode(id: number) {
  return apiFetch(`/admin/transport-modes/${id}`, { method: "DELETE" });
}

export async function fetchAdminServiceTypes(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/service-types${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminServiceType(body: Record<string, unknown>) {
  return apiFetch(`/admin/service-types`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminServiceType(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/service-types/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminServiceType(id: number) {
  return apiFetch(`/admin/service-types/${id}`, { method: "DELETE" });
}

export async function fetchAdminContainerTypes(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/container-types${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminContainerType(body: Record<string, unknown>) {
  return apiFetch(`/admin/container-types`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminContainerType(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/container-types/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminContainerType(id: number) {
  return apiFetch(`/admin/container-types/${id}`, { method: "DELETE" });
}

export async function fetchAdminAdditionalServices(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/additional-services${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminAdditionalService(body: Record<string, unknown>) {
  return apiFetch(`/admin/additional-services`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminAdditionalService(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/additional-services/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminAdditionalService(id: number) {
  return apiFetch(`/admin/additional-services/${id}`, { method: "DELETE" });
}

export async function fetchAdminTrains(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(`/admin/trains${buildListQuery(params)}`, {
    method: "GET",
  });
}

export async function createAdminTrain(body: Record<string, unknown>) {
  return apiFetch(`/admin/trains`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminTrain(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/trains/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminTrain(id: number) {
  return apiFetch(`/admin/trains/${id}`, { method: "DELETE" });
}

export async function fetchAdminTrainCars(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/train-cars${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminTrainCar(body: Record<string, unknown>) {
  return apiFetch(`/admin/train-cars`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminTrainCar(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/train-cars/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminTrainCar(id: number) {
  return apiFetch(`/admin/train-cars/${id}`, { method: "DELETE" });
}

export async function fetchAdminCargoCategories(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/cargo-categories${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminCargoCategory(body: Record<string, unknown>) {
  return apiFetch(`/admin/cargo-categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCargoCategory(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/cargo-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCargoCategory(id: number) {
  return apiFetch(`/admin/cargo-categories/${id}`, { method: "DELETE" });
}

export async function fetchAdminDgClasses(input?: number | ListQueryParams) {
  const params = normalizeListParams(input);
  return apiFetch<LaravelPaginated<Record<string, unknown>>>(
    `/admin/dg-classes${buildListQuery(params)}`,
    { method: "GET" }
  );
}

export async function createAdminDgClass(body: Record<string, unknown>) {
  return apiFetch(`/admin/dg-classes`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateAdminDgClass(id: number, body: Record<string, unknown>) {
  return apiFetch(`/admin/dg-classes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteAdminDgClass(id: number) {
  return apiFetch(`/admin/dg-classes/${id}`, { method: "DELETE" });
}
