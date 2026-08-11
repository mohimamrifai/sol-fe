
const BOOKING_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Confirmed",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  converted: "Converted to Shipment",
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
