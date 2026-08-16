"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";
import { PasswordInput } from "./password-input";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

export function StepAdminAccount() {
  const t = useRegisterT();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="admin_name"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.adminName")} <span className="text-red-500">*</span>
          </label>
          <Input
            id="admin_name"
            placeholder={t("field.adminNamePlaceholder")}
            className={fieldClass(!!errors.admin_name)}
            {...register("admin_name")}
          />
          <FieldError message={errors.admin_name?.message} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin_email"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.adminEmail")} <span className="text-red-500">*</span>
          </label>
          <Input
            id="admin_email"
            type="email"
            placeholder={t("field.adminEmailPlaceholder")}
            className={fieldClass(!!errors.admin_email)}
            {...register("admin_email")}
          />
          <p className="text-[11px] text-zinc-500">{t("field.adminEmailHint")}</p>
          <FieldError message={errors.admin_email?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin_phone"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          {t("field.adminPhone")} <span className="text-red-500">*</span>
        </label>
        <Input
          id="admin_phone"
          placeholder={t("field.adminPhonePlaceholder")}
          className={fieldClass(!!errors.admin_phone)}
          {...register("admin_phone")}
        />
        <FieldError message={errors.admin_phone?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput name="password" />
        <PasswordInput name="confirm_password" />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-zinc-50/40 p-3">
        <Controller
          control={control}
          name="terms_accepted"
          render={({ field }) => (
            <Checkbox
              id="terms_accepted"
              checked={!!field.value}
              onCheckedChange={(v) => field.onChange(v === true)}
            />
          )}
        />
        <label
          htmlFor="terms_accepted"
          className="flex items-start gap-2 text-xs leading-relaxed text-zinc-600"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          <span>
            {t("field.termsLabel")}{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline-offset-2 hover:underline"
            >
              {t("field.termsLink")}
            </Link>{" "}
            {t("field.termsPolicy")}
          </span>
        </label>
      </div>
      <FieldError message={errors.terms_accepted?.message} />
    </div>
  );
}
