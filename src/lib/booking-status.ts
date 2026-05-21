const BOOKING_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  confirmed: "Terkonfirmasi",
  approved: "Disetujui",
  rejected: "Ditolak",
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
    case "confirmed":
      return "border-violet-200/90 bg-violet-50 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/45 dark:text-violet-200";
    case "approved":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "rejected":
      return "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-200";
    case "cancelled":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
export const BOOKING_STATUS_KEYS = ["draft", "submitted", "confirmed", "approved", "rejected", "cancelled"];
