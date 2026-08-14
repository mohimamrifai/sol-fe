export const ADMIN_OPERATION_SLUGS = [
  "pickup",
  "gate-in-origin",
  "loading",
  "train-departure",
  "train-arrival",
  "gate-out-destination",
  "delivery",
  "proof-of-delivery",
] as const;

export type AdminOperationSlug = (typeof ADMIN_OPERATION_SLUGS)[number];

export const ADMIN_OPERATION_TYPE_MAP: Record<AdminOperationSlug, string> = {
  pickup: "pickup",
  "gate-in-origin": "gate_in_origin",
  loading: "loading",
  "train-departure": "train_departure",
  "train-arrival": "train_arrival",
  "gate-out-destination": "gate_out_destination",
  delivery: "delivery",
  "proof-of-delivery": "proof_of_delivery",
};

export function adminOperationApiType(slug: string): string | null {
  return ADMIN_OPERATION_TYPE_MAP[slug as AdminOperationSlug] ?? null;
}

export function isAdminOperationSlug(slug: string): slug is AdminOperationSlug {
  return slug in ADMIN_OPERATION_TYPE_MAP;
}
