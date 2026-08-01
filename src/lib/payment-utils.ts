import type { PaymentMethod } from "@/lib/payment-types";

const KNOWN_METHODS: PaymentMethod[] = ["midtrans", "transfer", "giro", "cash", "virtual_account"];

export function paymentMethodKey(value: string | null | undefined): PaymentMethod | null {
  if (!value) return null;
  const k = value.toLowerCase() as PaymentMethod;
  return KNOWN_METHODS.includes(k) ? k : null;
}
