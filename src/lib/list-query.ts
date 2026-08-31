import type { LaravelPaginated } from "./types-api";

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
  /** Invoices list — invoice date lower bound (YYYY-MM-DD) */
  invoiceDateFrom?: string;
  /** Invoices list — invoice date upper bound (YYYY-MM-DD) */
  invoiceDateTo?: string;
  /** Invoices list — due date lower bound (YYYY-MM-DD) */
  dueDateFrom?: string;
  /** Invoices list — due date upper bound (YYYY-MM-DD) */
  dueDateTo?: string;
  /** Payments list — payment method filter */
  paymentMethod?: string;
  /** Payments list — payment date lower bound (YYYY-MM-DD) */
  paymentDateFrom?: string;
  /** Payments list — payment date upper bound (YYYY-MM-DD) */
  paymentDateTo?: string;
  /** Payments list — invoice id filter */
  invoiceId?: number;
  /** Payments list — invoice AR status (unpaid, partially_paid, paid, overdue) */
  invoiceStatus?: string;
  /** Payments list — view mode (payments | ar) */
  view?: string;
  /** Payments list — Midtrans link status (expired) */
  linkStatus?: string;
  /** Locations list — province filter */
  province?: string;
  /** Locations list — city filter */
  city?: string;
  /** Users list — location access filter (id) */
  locationId?: number;
  /** Shipments list — only non-completed/cancelled (`1`) */
  active?: string;
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
  const idf = params?.invoiceDateFrom?.trim();
  if (idf) q.set("date_from", idf);
  const idt = params?.invoiceDateTo?.trim();
  if (idt) q.set("date_to", idt);
  const ddf = params?.dueDateFrom?.trim();
  if (ddf) q.set("due_from", ddf);
  const ddt = params?.dueDateTo?.trim();
  if (ddt) q.set("due_to", ddt);
  const pm = params?.paymentMethod?.trim();
  if (pm) q.set("payment_method", pm);
  const pdf = params?.paymentDateFrom?.trim();
  if (pdf) q.set("payment_date_from", pdf);
  const pdt = params?.paymentDateTo?.trim();
  if (pdt) q.set("payment_date_to", pdt);
  if (params?.invoiceId != null) q.set("invoice_id", String(params.invoiceId));
  const invSt = params?.invoiceStatus?.trim();
  if (invSt) q.set("invoice_status", invSt);
  const vw = params?.view?.trim();
  if (vw) q.set("view", vw);
  const ls = params?.linkStatus?.trim();
  if (ls) q.set("link_status", ls);
  const pv = params?.province?.trim();
  if (pv) q.set("province", pv);
  const ct = params?.city?.trim();
  if (ct) q.set("city", ct);
  if (params?.locationId != null) q.set("location_id", String(params.locationId));
  const active = params?.active?.trim();
  if (active) q.set("active", active);
  const str = q.toString();
  return str ? `?${str}` : "";
}

export function rowNumber(page: number, perPage: number, index: number): number {
  return (page - 1) * perPage + index + 1;
}

/** Laravel list endpoints commonly cap `per_page` at 100. */
export const API_MAX_PER_PAGE = 100;

export function capPerPage(perPage?: number): number {
  const n = perPage ?? API_MAX_PER_PAGE;
  return Math.min(Math.max(n, 1), API_MAX_PER_PAGE);
}

export function normalizeListParams(input?: number | ListQueryParams): ListQueryParams | undefined {
  if (input == null) return undefined;
  if (typeof input === "number") return { perPage: capPerPage(input) };
  return input?.perPage != null ? { ...input, perPage: capPerPage(input.perPage) } : input;
}

export async function fetchAllListPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<LaravelPaginated<T>>,
  perPage: number = API_MAX_PER_PAGE
): Promise<T[]> {
  const size = capPerPage(perPage);
  const first = await fetchPage(1, size);
  const rows = [...(first.data ?? [])];
  const lastPage = first.last_page ?? 1;
  for (let page = 2; page <= lastPage; page += 1) {
    const next = await fetchPage(page, size);
    rows.push(...(next.data ?? []));
  }
  return rows;
}
