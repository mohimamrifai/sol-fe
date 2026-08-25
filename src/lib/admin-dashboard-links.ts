const SHIPMENT_FSD_FILTER: Record<string, string> = {
  planning: "created",
  ready_operation: "survey_completed",
  pickup: "cargo_received",
  gate_in_origin: "stuffing_container",
  loading: "container_sealed",
  train_departure: "train_departed",
  train_arrival: "train_arrived",
  gate_out_destination: "container_unloading",
  delivery: "ready_for_pickup",
  proof_of_delivery: "proof_of_delivery",
  completed: "completed",
};

const BOOKING_FSD_FILTER: Record<string, string> = {
  draft: "draft",
  submitted: "submitted",
  under_review: "under_review",
  approved: "confirmed",
  rejected: "rejected",
};

const CONTAINER_STATUS_FILTER: Record<string, string> = {
  available: "available",
  reserved: "reserved",
  inTransit: "in_transit",
  maintenance: "maintenance",
  inactive: "inactive",
};

function monthRange(date = new Date()): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function adminDashboardBookingLink(statusKey: string): string {
  const status = BOOKING_FSD_FILTER[statusKey] ?? statusKey;
  return `/dashboard/admin/customer/bookings?status=${encodeURIComponent(status)}`;
}

export function adminDashboardShipmentLink(statusKey: string): string {
  const status = SHIPMENT_FSD_FILTER[statusKey] ?? statusKey;
  return `/dashboard/admin/customer/shipments?status=${encodeURIComponent(status)}`;
}

export function adminDashboardSummaryLink(key: string, businessDate?: string): string {
  const today = businessDate ?? new Date().toISOString().slice(0, 10);
  const month = monthRange(businessDate ? new Date(businessDate) : new Date());

  switch (key) {
    case "totalCustomers":
      return "/dashboard/admin/customer/customers?status=active";
    case "activeShipments":
      return "/dashboard/admin/customer/shipments?active=1";
    case "bookingsToday":
      return `/dashboard/admin/customer/bookings?date_from=${today}&date_to=${today}`;
    case "revenueThisMonth":
      return `/dashboard/admin/customer/invoices?issued_from=${month.from}&issued_to=${month.to}`;
    case "outstandingReceivable":
      return "/dashboard/admin/customer/invoices?status=issued";
    case "outstandingPayable":
      return "/dashboard/admin/vendor/invoices?status=ready_for_payment";
    default:
      return "/dashboard";
  }
}

export function adminDashboardOperationsLink(key: string, businessDate?: string): string {
  const today = businessDate ?? new Date().toISOString().slice(0, 10);
  switch (key) {
    case "pickupToday":
      return `/dashboard/admin/operations/pickup?date=${today}`;
    case "trainDepartureToday":
      return `/dashboard/admin/operations/train-departure?date=${today}`;
    case "trainArrivalToday":
      return `/dashboard/admin/operations/train-arrival?date=${today}`;
    case "deliveryToday":
      return `/dashboard/admin/operations/delivery?date=${today}`;
    case "podWaitingUpload":
      return "/dashboard/admin/operations/proof-of-delivery?status=waiting_pod";
    default:
      return "/dashboard";
  }
}

export function adminDashboardFinanceLink(
  key: string,
  range?: { dateFrom?: string; dateTo?: string }
): string {
  const from = range?.dateFrom ?? "";
  const to = range?.dateTo ?? "";

  switch (key) {
    case "customerInvoice":
      return `/dashboard/admin/customer/invoices?issued_from=${from}&issued_to=${to}`;
    case "customerPayment":
      return from && to
        ? `/dashboard/admin/customer/payments?date_from=${from}&date_to=${to}`
        : "/dashboard/admin/customer/payments";
    case "outstandingCustomer":
      return "/dashboard/admin/customer/invoices?status=issued";
    case "vendorInvoice":
      return `/dashboard/admin/vendor/invoices?date_from=${from}&date_to=${to}`;
    case "vendorPayment":
      return `/dashboard/admin/vendor/payments?date_from=${from}&date_to=${to}`;
    case "outstandingVendor":
      return "/dashboard/admin/vendor/invoices?status=ready_for_payment";
    default:
      return "/dashboard";
  }
}

export function adminDashboardContainerLink(statusKey: string): string {
  const status = CONTAINER_STATUS_FILTER[statusKey] ?? statusKey;
  return `/dashboard/admin/container/containers?status=${encodeURIComponent(status)}`;
}
