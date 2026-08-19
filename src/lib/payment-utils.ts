import type { PaymentMethod } from "@/lib/payment-types";

const KNOWN_METHODS: PaymentMethod[] = ["midtrans", "transfer", "giro", "cash", "virtual_account"];

const METHOD_ALIASES: Record<string, PaymentMethod> = {
  bank_transfer: "transfer",
  wire_transfer: "transfer",
  manual_transfer: "transfer",
};

const DEFAULT_METHOD_LABELS: Record<PaymentMethod, string> = {
  midtrans: "Midtrans",
  transfer: "Transfer Bank",
  giro: "Giro",
  cash: "Tunai",
  virtual_account: "Virtual Account",
};

const PAYMENT_STATUS_TOKENS = new Set([
  "pending",
  "success",
  "failed",
  "expired",
  "cancelled",
  "settlement",
  "capture",
  "deny",
]);

function normalizeMethodValue(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, "_");
}

export function paymentMethodKey(value: string | null | undefined): PaymentMethod | null {
  if (!value) return null;
  const normalized = normalizeMethodValue(value);
  if (METHOD_ALIASES[normalized]) return METHOD_ALIASES[normalized];
  const k = normalized as PaymentMethod;
  return KNOWN_METHODS.includes(k) ? k : null;
}

export function paymentMethodLabel(
  value: string | null | undefined,
  translate?: (key: PaymentMethod) => string
): string {
  const key = paymentMethodKey(value);
  if (key) {
    return translate ? translate(key) : DEFAULT_METHOD_LABELS[key];
  }

  const raw = String(value ?? "").trim();
  if (!raw) return "—";

  return raw
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Prefer canonical `method` field; ignore Midtrans status tokens in legacy `payment_type`. */
export function resolvePaymentMethodLabel(
  payment: {
    method?: string | null;
    payment_method?: string | null;
    payment_type?: string | null;
  },
  translate?: (key: PaymentMethod) => string
): string {
  const method = payment.method ?? payment.payment_method;
  if (method) return paymentMethodLabel(method, translate);

  const legacyType = String(payment.payment_type ?? "").trim();
  if (!legacyType) return "—";
  if (PAYMENT_STATUS_TOKENS.has(normalizeMethodValue(legacyType))) {
    return paymentMethodLabel("midtrans", translate);
  }

  return paymentMethodLabel(legacyType, translate);
}
