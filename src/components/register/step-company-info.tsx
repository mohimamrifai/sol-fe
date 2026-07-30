"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { BusinessEntitySelect } from "./select-fields";
import { CustomerCodeInput } from "./customer-code-input";
import { NpwpInput } from "./npwp-input";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

export function StepCompanyInfo() {
  const t = useRegisterT();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();

  const businessEntity = useWatch({ control, name: "business_entity_type" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BusinessEntitySelect control={control} errors={errors} />

        {businessEntity === "Lainnya" ? (
          <div className="space-y-1.5">
            <label
              htmlFor="business_entity_other"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              {t("field.businessEntityOther")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="business_entity_other"
              placeholder={t("field.businessEntityOtherPlaceholder")}
              className={fieldClass(!!errors.business_entity_other)}
              {...register("business_entity_other")}
            />
            <FieldError message={errors.business_entity_other?.message} />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="company_name"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.companyName")} <span className="text-red-500">*</span>
          </label>
          <Input
            id="company_name"
            placeholder={t("field.companyNamePlaceholder")}
            className={fieldClass(!!errors.company_name)}
            {...register("company_name")}
          />
          <FieldError message={errors.company_name?.message} />
        </div>

        <CustomerCodeInput />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NpwpInput />

        <div className="space-y-1.5">
          <label
            htmlFor="company_phone"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.companyPhone")} <span className="text-red-500">*</span>
          </label>
          <Input
            id="company_phone"
            placeholder={t("field.companyPhonePlaceholder")}
            className={fieldClass(!!errors.company_phone)}
            {...register("company_phone")}
          />
          <FieldError message={errors.company_phone?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="company_email"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.companyEmail")} <span className="text-red-500">*</span>
          </label>
          <Input
            id="company_email"
            type="email"
            placeholder={t("field.companyEmailPlaceholder")}
            className={fieldClass(!!errors.company_email)}
            {...register("company_email")}
          />
          <FieldError message={errors.company_email?.message} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="website"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.companyWebsite")}{" "}
            <span className="font-normal normal-case text-zinc-400">
              {t("field.companyWebsiteOptional")}
            </span>
          </label>
          <Input
            id="website"
            type="url"
            placeholder={t("field.companyWebsitePlaceholder")}
            className={fieldClass(!!errors.website)}
            {...register("website")}
          />
          <FieldError message={errors.website?.message} />
        </div>
      </div>
    </div>
  );
}
