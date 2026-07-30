"use client";

import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { BusinessCategorySelect, MonthlyShipmentEstimateSelect } from "./select-fields";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

export function StepOperationalInfo() {
  const t = useRegisterT();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();

  const businessCategory = useWatch({ control, name: "business_category" });

  return (
    <div className="space-y-4">
      <BusinessCategorySelect control={control} errors={errors} />

      {businessCategory === "others" ? (
        <div className="space-y-1.5">
          <label
            htmlFor="business_category_other"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.businessCategoryOther")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="business_category_other"
            placeholder={t("field.businessCategoryOtherPlaceholder")}
            className={fieldClass(!!errors.business_category_other)}
            {...register("business_category_other")}
          />
          <FieldError message={errors.business_category_other?.message} />
        </div>
      ) : null}

      <MonthlyShipmentEstimateSelect control={control} errors={errors} />
    </div>
  );
}
