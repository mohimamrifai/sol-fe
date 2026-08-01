/** Query params for Laravel paginated list endpoints */
export type ListQueryParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  companyId?: number;
  trainId?: number;
  /** Location `type` (port, city, hub, warehouse) */
  type?: string;
  transportModeId?: number;
  /** Additional service `category` */
  category?: string;
  /** User list filter */
  userType?: string;
  role?: string;
  /** Bookings list — service type filter */
  serviceTypeId?: number;
  /** Shipments list — service type bucket (LCL/FCL) */
  serviceType?: string;
  /** Bookings/Shipments list — shipment coverage filter (port_to_port, etc.) */
  shipmentCoverage?: string;
  /** Bookings list — booking date lower bound (YYYY-MM-DD) */
  dateFrom?: string;
  /** Bookings list — booking date upper bound (YYYY-MM-DD) */
  dateTo?: string;
  /** Shipments list — origin location id */
  originLocationId?: number;
  /** Shipments list — destination location id */
  destinationLocationId?: number;
  /** Shipments list — shipment date lower bound (YYYY-MM-DD) */
  shipmentDateFrom?: string;
  /** Shipments list — shipment date upper bound (YYYY-MM-DD) */
  shipmentDateTo?: string;
  /** Documents list — bucket filter (booking|shipment|billing) */
  documentBucket?: string;
  /** Documents list — shipment id filter */
  shipmentId?: number;
  /** Documents list — upload date lower bound (YYYY-MM-DD) */
  uploadDateFrom?: string;
  /** Documents list — upload date upper bound (YYYY-MM-DD) */
  uploadDateTo?: string;
};

export function buildListQuery(params?: ListQueryParams): string {
  const q = new URLSearchParams();
  if (params?.page != null && params.page > 0) q.set("page", String(params.page));
  if (params?.perPage != null && params.perPage > 0) q.set("per_page", String(params.perPage));
  const s = params?.search?.trim();
  if (s) q.set("search", s);
  const st = params?.status?.trim();
  if (st) q.set("status", st);
  if (params?.companyId != null) q.set("company_id", String(params.companyId));
  if (params?.trainId != null) q.set("train_id", String(params.trainId));
  const ty = params?.type?.trim();
  if (ty) q.set("type", ty);
  if (params?.transportModeId != null) q.set("transport_mode_id", String(params.transportModeId));
  const cat = params?.category?.trim();
  if (cat) q.set("category", cat);
  const ut = params?.userType?.trim();
  if (ut) q.set("user_type", ut);
  const rl = params?.role?.trim();
  if (rl) q.set("role", rl);
  if (params?.serviceTypeId != null) q.set("service_type_id", String(params.serviceTypeId));
  const st2 = params?.serviceType?.trim();
  if (st2) q.set("service_type", st2);
  const cov = params?.shipmentCoverage?.trim();
  if (cov) q.set("shipment_coverage", cov);
  const df = params?.dateFrom?.trim();
  if (df) q.set("date_from", df);
  const dt = params?.dateTo?.trim();
  if (dt) q.set("date_to", dt);
  if (params?.originLocationId != null) q.set("origin_location_id", String(params.originLocationId));
  if (params?.destinationLocationId != null) q.set("destination_location_id", String(params.destinationLocationId));
  const sdf = params?.shipmentDateFrom?.trim();
  if (sdf) q.set("shipment_date_from", sdf);
  const sdt = params?.shipmentDateTo?.trim();
  if (sdt) q.set("shipment_date_to", sdt);
  const db = params?.documentBucket?.trim();
  if (db) q.set("type", db);
  if (params?.shipmentId != null) q.set("shipment_id", String(params.shipmentId));
  const udf = params?.uploadDateFrom?.trim();
  if (udf) q.set("date_from", udf);
  const udt = params?.uploadDateTo?.trim();
  if (udt) q.set("date_to", udt);
  const str = q.toString();
  return str ? `?${str}` : "";
}

export function rowNumber(page: number, perPage: number, index: number): number {
  return (page - 1) * perPage + index + 1;
}

export function normalizeListParams(input?: number | ListQueryParams): ListQueryParams | undefined {
  if (input == null) return undefined;
  if (typeof input === "number") return { perPage: input };
  return input;
}
