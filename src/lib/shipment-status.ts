/** Nilai status dari API Laravel (shipments.status) */
export const SHIPMENT_STATUS_KEYS = [
  "created",
  "survey_completed",
  "cargo_received",
  "stuffing_container",
  "container_sealed",
  "departed",
  "arrived",
  "unloading",
  "ready_for_pickup",
  "completed",
  "cancelled",
] as const;

const LABELS: Record<string, string> = {
  created: "Dibuat",
  survey_completed: "Survey selesai",
  cargo_received: "Kargo diterima",
  stuffing_container: "Stuffing kontainer",
  container_sealed: "Kontainer disegel",
  departed: "Berangkat",
  arrived: "Tiba",
  unloading: "Bongkar muat",
  ready_for_pickup: "Siap diambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export function shipmentStatusLabel(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return LABELS[key] ?? status;
}

export function shipmentStatusBadgeClass(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  switch (key) {
    case "created":
      return "border-slate-200/90 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/55 dark:text-slate-200";
    case "survey_completed":
      return "border-indigo-200/90 bg-indigo-50 text-indigo-900 dark:border-indigo-800/60 dark:bg-indigo-950/45 dark:text-indigo-200";
    case "cargo_received":
      return "border-amber-200/90 bg-amber-50 text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/45 dark:text-amber-200";
    case "stuffing_container":
      return "border-orange-200/90 bg-orange-50 text-orange-900 dark:border-orange-800/60 dark:bg-orange-950/45 dark:text-orange-200";
    case "container_sealed":
      return "border-yellow-200/90 bg-yellow-50 text-yellow-950 dark:border-yellow-800/60 dark:bg-yellow-950/45 dark:text-yellow-200";
    case "departed":
      return "border-sky-200/90 bg-sky-50 text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/45 dark:text-sky-200";
    case "arrived":
      return "border-cyan-200/90 bg-cyan-50 text-cyan-900 dark:border-cyan-800/60 dark:bg-cyan-950/45 dark:text-cyan-200";
    case "unloading":
      return "border-blue-200/90 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/45 dark:text-blue-200";
    case "ready_for_pickup":
      return "border-teal-200/90 bg-teal-50 text-teal-900 dark:border-teal-800/60 dark:bg-teal-950/45 dark:text-teal-200";
    case "completed":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/45 dark:text-emerald-300";
    case "cancelled":
      return "border-red-200/90 bg-red-50 text-red-800 dark:border-red-800/60 dark:bg-red-950/45 dark:text-red-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}
