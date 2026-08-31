
const BOOKING_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Confirmed",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  converted: "Converted to Shipment",
};

/** Admin UI label for backend booking status (`approved` → Confirmed per FSD). Prefer `useBookingStatusLabel()` in components. */
export function bookingStatusLabelFromApi(status: string): string {
  const k = status.toLowerCase();
  return BOOKING_LABELS[k] ?? status;
}

/**
 * FSD Customer/bookings.md — Dashboard status list treats "Converted to Shipment" as its
 * own status, but the backend keeps the booking row at `approved`/`confirmed` and signals
 * conversion through the linked shipment.
 */
export function resolveBookingDisplayStatus(booking: {
  status?: string | null;
  shipment_exists?: boolean;
  has_shipment?: boolean;
  shipment_id?: number | string | null;
}): string {
  const status = String(booking.status ?? "").toLowerCase();
  const normalizedStatus = status === "under_review" ? "submitted" : status;
  const converted =
    booking.shipment_exists === true ||
    booking.has_shipment === true ||
    booking.shipment_id != null;

  return converted ? "converted" : normalizedStatus;
}

/** FSD admin: Draft, Submitted, and Confirmed stay editable until convert to shipment. */
export function canAdminEditBooking(booking: {
  status?: string | null;
  shipment_exists?: boolean;
  has_shipment?: boolean;
  shipment_id?: number | string | null;
}): boolean {
  const st = String(booking.status ?? "").toLowerCase();
  if (st === "rejected" || st === "cancelled") return false;
  const converted =
    booking.shipment_exists === true ||
    booking.has_shipment === true ||
    booking.shipment_id != null;
  if (converted) return false;
  return st === "draft" || st === "submitted" || st === "approved" || st === "confirmed" || st === "under_review";
}

export function bookingStatusBadgeClass(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  switch (key) {
    case "draft":
      return "border-slate-200/90 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-200";
    case "submitted":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "under_review":
      return "border-orange-200/90 bg-orange-50 text-orange-900 dark:border-orange-800/60 dark:bg-orange-950/45 dark:text-orange-200";
    case "approved":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "rejected":
      return "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-200";
    case "cancelled":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-800/45 dark:text-red-200";
    case "confirmed":
      return "border-violet-200/90 bg-violet-50 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/45 dark:text-violet-200";
    case "converted":
      return "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Customer portal lifecycle keys (legacy) */
export const BOOKING_STATUS_KEYS = ["draft", "submitted", "approved", "rejected"] as const;
export type BookingStatusKey = (typeof BOOKING_STATUS_KEYS)[number];

/** FSD dashboard cards: Draft, Submitted, Confirmed */
export const BOOKING_FSD_STAT_KEYS = ["draft", "submitted", "confirmed"] as const;
export type BookingFsdStatKey = (typeof BOOKING_FSD_STAT_KEYS)[number];

export const BOOKING_FSD_STAT_META: Record<
  BookingFsdStatKey,
  { label: string; description: string; iconBg: string; iconColor: string }
> = {
  draft: {
    label: BOOKING_LABELS.draft,
    description: "Booking belum disubmit.",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
  },
  submitted: {
    label: BOOKING_LABELS.submitted,
    description: "Menunggu konfirmasi internal.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  confirmed: {
    label: BOOKING_LABELS.confirmed,
    description: "Dikonfirmasi, siap dikonversi ke shipment.",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
};

/** Map backend `approved` to FSD "Confirmed" stat bucket */
export function bookingFsdStatCount(
  stats: Record<string, number> | undefined,
  key: BookingFsdStatKey
): number {
  if (!stats) return 0;
  if (key === "confirmed") return Number(stats.confirmed ?? stats.approved ?? 0);
  return Number(stats[key] ?? 0);
}

export const SHIPMENT_COVERAGE_LABELS: Record<string, string> = {
  port_to_port: "Port to Port",
  door_to_port: "Door to Port",
  port_to_door: "Port to Door",
  door_to_door: "Door to Door",
};
