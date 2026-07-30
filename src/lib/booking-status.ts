
const BOOKING_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  approved: "Disetujui",
  rejected: "Ditolak",
  // Legacy / fallback labels
  confirmed: "Terkonfirmasi",
  cancelled: "Dibatalkan",
};

export function bookingStatusLabelFromApi(status: string): string {
  const k = status.toLowerCase();
  return BOOKING_LABELS[k] ?? status;
}

export function bookingStatusBadgeClass(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  switch (key) {
    case "draft":
      return "border-slate-200/90 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-200";
    case "submitted":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "approved":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "rejected":
      return "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-200";
    case "cancelled":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-800/45 dark:text-red-200";
    case "confirmed":
      return "border-violet-200/90 bg-violet-50 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/45 dark:text-violet-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

// The 4 active lifecycle statuses. UI selects, status filters and stat cards
// must only ever iterate this list.
export const BOOKING_STATUS_KEYS = ["draft", "submitted", "approved", "rejected"] as const;
export type BookingStatusKey = (typeof BOOKING_STATUS_KEYS)[number];

// Stat card meta. Re-used by the dashboard, the bookings list page and the
// new booking detail page.
export const BOOKING_STATUS_META: Record<
  BookingStatusKey,
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
    description: "Menunggu review internal.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  approved: {
    label: BOOKING_LABELS.approved,
    description: "Disetujui dan siap diproses menjadi Shipment.",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  rejected: {
    label: BOOKING_LABELS.rejected,
    description: "Ditolak. Periksa alasan untuk detail.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
  },
};

export const SHIPMENT_COVERAGE_LABELS: Record<string, string> = {
  port_to_port: "Port to Port",
  door_to_port: "Door to Port",
  port_to_door: "Port to Door",
  door_to_door: "Door to Door",
};
