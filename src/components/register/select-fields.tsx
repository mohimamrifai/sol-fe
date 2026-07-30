"use client";

import * as React from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

import { SearchableCombobox } from "@/components/searchable-combobox";
import {
  fetchBusinessEntityTypes,
  fetchBusinessCategories,
  fetchMonthlyShipmentEstimates,
} from "@/lib/api/master-metadata";
import { getAllCountries } from "@/lib/countries";

import { FieldError, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

/* ──────────────────────────────────────────────────────────────────────
 *  Business Entity select — fetches options from BE
 * ──────────────────────────────────────────────────────────────────── */
interface BusinessEntitySelectProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}

export function BusinessEntitySelect({ control, errors }: BusinessEntitySelectProps) {
  const t = useRegisterT();
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["master", "business-entity-types"],
    queryFn: fetchBusinessEntityTypes,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("field.businessEntity")} <span className="text-red-500">*</span>
      </label>
      <Controller
        control={control}
        name="business_entity_type"
        render={({ field }) => (
          <SearchableCombobox
            value={field.value ?? ""}
            onChange={field.onChange}
            options={options as Array<{ value: string; label: string }>}
            placeholder={t("field.businessEntityPlaceholder")}
            searchPlaceholder={t("field.businessEntitySearch")}
            loadingText={t("field.loading")}
            emptyMessage={t("field.emptyMessage")}
            loading={isLoading}
            invalid={!!errors.business_entity_type}
            aria-label={t("field.businessEntity")}
          />
        )}
      />
      <FieldError message={errors.business_entity_type?.message} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 *  Business Category select — fetches options from BE
 * ──────────────────────────────────────────────────────────────────── */
interface BusinessCategorySelectProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}

export function BusinessCategorySelect({ control, errors }: BusinessCategorySelectProps) {
  const t = useRegisterT();
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["master", "business-categories"],
    queryFn: fetchBusinessCategories,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("field.businessCategory")} <span className="text-red-500">*</span>
      </label>
      <Controller
        control={control}
        name="business_category"
        render={({ field }) => (
          <SearchableCombobox
            value={field.value ?? ""}
            onChange={field.onChange}
            options={options as Array<{ value: string; label: string }>}
            placeholder={t("field.businessCategoryPlaceholder")}
            searchPlaceholder={t("field.businessCategorySearch")}
            loadingText={t("field.loading")}
            emptyMessage={t("field.emptyMessage")}
            loading={isLoading}
            invalid={!!errors.business_category}
            aria-label={t("field.businessCategory")}
          />
        )}
      />
      <FieldError message={errors.business_category?.message} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 *  Monthly Shipment Estimate select — fetches options from BE
 * ──────────────────────────────────────────────────────────────────── */
interface MonthlyShipmentEstimateSelectProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}

export function MonthlyShipmentEstimateSelect({
  control,
  errors,
}: MonthlyShipmentEstimateSelectProps) {
  const t = useRegisterT();
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["master", "monthly-shipment-estimates"],
    queryFn: fetchMonthlyShipmentEstimates,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("field.monthlyShipmentEstimate")}{" "}
        <span className="font-normal normal-case text-zinc-400">
          {t("field.monthlyShipmentEstimateHint")}
        </span>{" "}
        <span className="text-red-500">*</span>
      </label>
      <Controller
        control={control}
        name="monthly_shipment_estimate"
        render={({ field }) => (
          <SearchableCombobox
            value={field.value ?? ""}
            onChange={field.onChange}
            options={options as Array<{ value: string; label: string }>}
            placeholder={t("field.monthlyShipmentEstimatePlaceholder")}
            searchPlaceholder={t("field.monthlyShipmentEstimateSearch")}
            loadingText={t("field.loading")}
            emptyMessage={t("field.emptyMessage")}
            loading={isLoading}
            invalid={!!errors.monthly_shipment_estimate}
            aria-label={t("field.monthlyShipmentEstimate")}
          />
        )}
      />
      <FieldError message={errors.monthly_shipment_estimate?.message} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 *  Country select — full world list from country-list npm package
 * ──────────────────────────────────────────────────────────────────── */
interface CountrySelectProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
}

export function CountrySelect({ control, errors }: CountrySelectProps) {
  const t = useRegisterT();
  const options = React.useMemo(
    () => getAllCountries().map((c) => ({ value: c.name, label: c.name })),
    [],
  );

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("field.country")} <span className="text-red-500">*</span>
      </label>
      <Controller
        control={control}
        name="country"
        render={({ field }) => (
          <SearchableCombobox
            value={field.value ?? ""}
            onChange={field.onChange}
            options={options}
            placeholder={t("field.countryPlaceholder")}
            searchPlaceholder={t("field.countrySearch")}
            loadingText={t("field.loading")}
            emptyMessage={t("field.emptyMessage")}
            invalid={!!errors.country}
            aria-label={t("field.country")}
          />
        )}
      />
      <FieldError message={errors.country?.message} />
    </div>
  );
}
