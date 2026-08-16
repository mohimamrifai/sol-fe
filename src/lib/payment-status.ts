const LABELS: Record<string, string> = {
  success: "Success",
  settlement: "Settlement",
  pending: "Pending",
  capture: "Pending",
  authorize: "Pending",
  deny: "Denied",
  cancel: "Cancelled",
  cancelled: "Cancelled",
  expire: "Expired",
  expired: "Expired",
  failure: "Failed",
  failed: "Failed",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  refunded: "Refunded",
  partial_refund: "Partial Refund",
  chargeback: "Chargeback",
};

/** Normalizes Midtrans/Laravel payment status to badge key. */
export function paymentStatusLabelFromApi(status: string): string {
  const k = status.toLowerCase();
  return LABELS[k] ?? status;
}

export function paymentStatusBadgeClass(status: string): string {
  const k = status.toLowerCase();
  switch (k) {
    case "success":
    case "settlement":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "pending":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "capture":
      return "border-cyan-200/90 bg-cyan-50 text-cyan-900 dark:border-cyan-800/60 dark:bg-cyan-950/45 dark:text-cyan-200";
    case "authorize":
      return "border-violet-200/90 bg-violet-50 text-violet-900 dark:border-violet-800/60 dark:bg-violet-950/45 dark:text-violet-200";
    case "deny":
      return "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-200";
    case "cancel":
      return "border-orange-200/90 bg-orange-50 text-orange-950 dark:border-orange-800/60 dark:bg-orange-950/45 dark:text-orange-200";
    case "expire":
    case "expired":
      return "border-stone-200/90 bg-stone-100 text-stone-800 dark:border-stone-600 dark:bg-stone-800/55 dark:text-stone-200";
    case "failure":
    case "failed":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300";
    case "unpaid":
      return "border-slate-200/90 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200";
    case "partially_paid":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "paid":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "overdue":
      return "border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/60 dark:bg-rose-950/45 dark:text-rose-200";
    case "refunded":
    case "refund":
      return "border-teal-200/90 bg-teal-50 text-teal-900 dark:border-teal-800/60 dark:bg-teal-950/45 dark:text-teal-200";
    case "partial_refund":
      return "border-indigo-200/90 bg-indigo-50 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/45 dark:text-indigo-200";
    case "chargeback":
      return "border-fuchsia-200/90 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/45 dark:text-fuchsia-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
