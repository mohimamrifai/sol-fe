"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Check, Loader2, XCircle, AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { checkCompanyCodeRequest } from "@/lib/auth-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

type CodeState = "idle" | "checking" | "available" | "taken" | "invalid";

/**
 * Customer Code input with:
 *  - uppercase, A–Z only, 3 chars
 *  - live uniqueness check (debounced 350ms)
 *  - auto-suggest from company_name initials
 */
export function CustomerCodeInput() {
  const t = useRegisterT();
  const {
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    watch,
  } = useFormContext<RegisterFormValues>();

  const companyCode = watch("company_code") ?? "";
  const companyName = watch("company_name") ?? "";

  const [codeState, setCodeState] = React.useState<CodeState>("idle");
  const debouncedCode = useDebouncedValue(companyCode, 350);

  // Live uniqueness check
  React.useEffect(() => {
    const code = (debouncedCode ?? "").trim().toUpperCase();
    if (!code) {
      setCodeState("idle");
      return;
    }
    if (!/^[A-Z]{3}$/.test(code)) {
      setCodeState("invalid");
      return;
    }
    let cancelled = false;
    setCodeState("checking");
    checkCompanyCodeRequest(code)
      .then((res) => {
        if (cancelled) return;
        if (res.exists) {
          setCodeState("taken");
          setError("company_code", {
            type: "server",
            message: t("field.customerCodeTaken"),
          });
        } else {
          setCodeState("available");
          clearErrors("company_code");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCodeState("idle");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedCode, clearErrors, setError, t]);

  // Auto-suggest from initials of company_name
  React.useEffect(() => {
    if (!companyName) return;
    const name = companyName
      .toUpperCase()
      .replace(/[^A-Z\s]/g, " ")
      .trim();
    const tokens = name.split(/\s+/).filter(Boolean);
    let code = "";
    for (const tk of tokens) {
      const ch = tk[0];
      if (ch && /[A-Z]/.test(ch)) {
        code += ch;
        if (code.length >= 3) break;
      }
    }
    if (code.length < 3) {
      const letters = name.replace(/[^A-Z]/g, "");
      code = (code + letters).slice(0, 3);
    }
    if (code.length === 3 && !companyCode) {
      setValue("company_code", code, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName, setValue]);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="company_code"
        className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
      >
        {t("field.customerCode")} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Controller
          control={control}
          name="company_code"
          render={({ field }) => (
            <Input
              id="company_code"
              placeholder={t("field.customerCodePlaceholder")}
              maxLength={3}
              value={field.value ?? ""}
              onChange={(e) => {
                const v = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 3);
                e.target.value = v;
                field.onChange(v);
              }}
              onBlur={field.onBlur}
              className={
                fieldClass(!!errors.company_code) + " uppercase tracking-widest pr-9"
              }
            />
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
          {codeState === "checking" ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : codeState === "available" ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : codeState === "taken" ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>
      {codeState === "taken" ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-red-500">
          <AlertCircle className="h-3 w-3" /> {t("field.customerCodeTaken")}
        </p>
      ) : codeState === "available" ? (
        <p className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
          <Check className="h-3 w-3" /> {t("field.customerCodeAvailable")}
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500">{t("field.customerCodeHint")}</p>
      )}
    </div>
  );
}
