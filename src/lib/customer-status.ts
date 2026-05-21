const LABELS: Record<string, string> = {
  active: "Aktif",
  pending: "Menunggu",
  inactive: "Nonaktif",
};

export function customerStatusLabelFromApi(status: string): string {
  const k = status.toLowerCase();
  return LABELS[k] ?? status;
}

export function customerStatusBadgeClass(status: string): string {
  const k = status.toLowerCase();
  switch (k) {
    case "active":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "pending":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "inactive":
      return "border-zinc-200/90 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800/55 dark:text-zinc-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
