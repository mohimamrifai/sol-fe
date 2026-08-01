const INV_LABELS: Record<string, string> = {
  draft: "Draft",
  issued: "Issued",
  partially_paid: "Partially Paid",
  unpaid: "Belum bayar",
  paid: "Lunas",
  overdue: "Jatuh tempo",
  cancelled: "Dibatalkan",
};

export function invoiceStatusLabelFromApi(status: string): string {
  const k = status.toLowerCase();
  return INV_LABELS[k] ?? status;
}

export function invoiceStatusBadgeClass(status: string): string {
  const key = status.toLowerCase();
  switch (key) {
    case "draft":
      return "border-zinc-200/90 bg-zinc-50 text-zinc-800 dark:border-zinc-800/60 dark:bg-zinc-950/45 dark:text-zinc-200";
    case "issued":
      return "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200";
    case "partially_paid":
      return "border-amber-200/90 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "paid":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "unpaid":
      return "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200";
    case "overdue":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300";
    case "cancelled":
      return "border-orange-200/90 bg-orange-50 text-orange-950 dark:border-orange-800/60 dark:bg-orange-950/45 dark:text-orange-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
