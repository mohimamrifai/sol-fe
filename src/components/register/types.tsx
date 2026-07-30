// Shared types, constants, and i18n context for the registration form.
// All components in this folder consume the same shape and read their
// UI strings from a single `t` function injected by `RegisterStepper`.

import { createContext, useContext } from "react";
import type { RegisterSchema } from "@/lib/validations/auth";
export { createRegisterSchema } from "@/lib/validations/auth";

export type RegisterFormValues = RegisterSchema;

/* ──────────────────────────────────────────────────────────────────────
 *  i18n context — page-level useTranslations("Register") is threaded
 *  into step components via this context, so every field, button, and
 *  validation message is fully translated.
 * ──────────────────────────────────────────────────────────────────── */
export type RegisterT = (key: string, vars?: Record<string, unknown>) => string;

const RegisterTContext = createContext<RegisterT | null>(null);

export const RegisterTProvider = RegisterTContext.Provider;

export function useRegisterT(): RegisterT {
  const t = useContext(RegisterTContext);
  if (!t) {
    throw new Error(
      "useRegisterT must be used inside <RegisterStepper> (which provides the translation function).",
    );
  }
  return t;
}

/**
 * Re-export the schema factory for convenience. Page-level wires the
 * real translation function; the form type stays consistent.
 */

export type StepKey =
  | "company-info"
  | "company-address"
  | "operational-info"
  | "admin-account";

export interface StepDescriptor {
  key: StepKey;
  step: number;
  iconName: "building" | "map" | "globe" | "user";
}

export const STEPS: StepDescriptor[] = [
  { key: "company-info", step: 1, iconName: "building" },
  { key: "company-address", step: 2, iconName: "map" },
  { key: "operational-info", step: 3, iconName: "globe" },
  { key: "admin-account", step: 4, iconName: "user" },
];

/**
 * Field-level error message renderer; used in every step.
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] font-medium text-red-500">
      <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
      {message}
    </p>
  );
}

/**
 * Standard input/select field class — matches the height of the
 * SearchableCombobox (h-10) and the existing Input style.
 */
export const fieldClass = (hasError: boolean) =>
  [
    "h-10 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm",
    "transition-all focus-visible:ring-2 focus-visible:ring-black",
    "focus-visible:border-transparent focus-visible:bg-white text-sm",
    hasError ? "border-red-500 focus-visible:ring-red-500" : "",
  ].join(" ");
