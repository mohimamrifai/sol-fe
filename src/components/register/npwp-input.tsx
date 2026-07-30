"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { formatNpwp } from "@/lib/npwp";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

/**
 * NPWP input with auto-formatting to "99.999.999.9-999.999".
 * Accepts 15 (without KPP code) or 16 (with KPP code) digits.
 */
export function NpwpInput() {
  const t = useRegisterT();
  const { control, setValue, formState: { errors }, watch } =
    useFormContext<RegisterFormValues>();

  // Auto-format on every change
  React.useEffect(() => {
    const sub = watch((values, info) => {
      if (info.name === "npwp") {
        const formatted = formatNpwp(values.npwp ?? "");
        if (formatted !== values.npwp) {
          setValue("npwp", formatted, {
            shouldValidate: false,
            shouldDirty: true,
          });
        }
      }
    });
    return () => sub.unsubscribe();
  }, [watch, setValue]);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="npwp"
        className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
      >
        {t("field.npwp")} <span className="text-red-500">*</span>
      </label>
      <Controller
        control={control}
        name="npwp"
        render={({ field }) => (
          <Input
            id="npwp"
            placeholder={t("field.npwpPlaceholder")}
            inputMode="numeric"
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className={fieldClass(!!errors.npwp)}
          />
        )}
      />
      <p className="text-[11px] text-zinc-500">{t("field.npwpHint")}</p>
      <FieldError message={errors.npwp?.message} />
    </div>
  );
}
