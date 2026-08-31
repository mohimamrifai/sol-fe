import { fetchAllListPages, type ListQueryParams } from "../../list-query";
import { fetchAdminEligibleShipments } from "./billing";
import { fetchAdminCompanies } from "./companies";
import { fetchAdminContainers } from "./containers";
import {
  fetchAdminAdditionalCharges,
  fetchAdminRoutes,
  fetchAdminStations,
  fetchAdminTrainSchedules,
  fetchAdminYards,
} from "./master-fsd";
import {
  fetchAdminCargoCategories,
  fetchAdminContainerTypes,
  fetchAdminLocations,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
} from "./master";
import { fetchAdminShipments } from "./shipments";
import { fetchAdminUsers } from "./users";
import { fetchAdminVendors } from "./vendors";

type PageParams = Omit<ListQueryParams, "page" | "perPage">;

export function fetchAllAdminCompanies(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminCompanies({ ...params, page, perPage }));
}

export function fetchAllAdminLocations(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminLocations({ ...params, page, perPage }));
}

export function fetchAllAdminVendors(
  params?: PageParams & { business_entity?: string; vendor_type?: string }
) {
  return fetchAllListPages((page, perPage) => fetchAdminVendors({ ...params, page, perPage }));
}

export function fetchAllAdminUsers(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminUsers({ ...params, page, perPage }));
}

export function fetchAllAdminServiceTypes(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminServiceTypes({ ...params, page, perPage }));
}

export function fetchAllAdminTransportModes(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminTransportModes({ ...params, page, perPage }));
}

export function fetchAllAdminContainerTypes(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminContainerTypes({ ...params, page, perPage }));
}

export function fetchAllAdminContainers(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminContainers({ ...params, page, perPage }));
}

export function fetchAllAdminShipments(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminShipments({ ...params, page, perPage }));
}

export function fetchAllAdminYards(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminYards({ ...params, page, perPage }));
}

export function fetchAllAdminRoutes(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminRoutes({ ...params, page, perPage }));
}

export function fetchAllAdminStations(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminStations({ ...params, page, perPage }));
}

export function fetchAllAdminTrainSchedules(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminTrainSchedules({ ...params, page, perPage }));
}

export function fetchAllAdminCargoCategories(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminCargoCategories({ ...params, page, perPage }));
}

export function fetchAllAdminAdditionalCharges(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminAdditionalCharges({ ...params, page, perPage }));
}

export function fetchAllAdminEligibleShipments(params?: PageParams) {
  return fetchAllListPages((page, perPage) => fetchAdminEligibleShipments({ ...params, page, perPage }));
}
