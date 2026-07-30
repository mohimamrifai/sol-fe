"use client";

import * as React from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { CountrySelect } from "./select-fields";
import { FieldError, fieldClass, useRegisterT } from "./types";
import type { RegisterFormValues } from "./types";

import { DEFAULT_COUNTRY } from "@/lib/countries";
import {
  getAllProvinces,
  getCitiesForProvince,
  getDistrictsForCity,
} from "@/lib/id-regions";
import {
  getStatesForCountry,
  getCitiesForCountryState,
} from "@/lib/world-regions";

/**
 * Cascading address inputs that automatically switch data source
 * based on the selected country:
 *  - Indonesia: daerah-indonesia (provinsi → kabupaten → kecamatan)
 *  - Other: country-state-city (state → city) + free-text district
 */
export function StepCompanyAddress() {
  const t = useRegisterT();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<RegisterFormValues>();

  const country = useWatch({ control, name: "country" }) ?? "";
  const province = useWatch({ control, name: "province" }) ?? "";
  const city = useWatch({ control, name: "city" }) ?? "";

  const isIndonesia = country === DEFAULT_COUNTRY;

  // ----- Region options -----
  const [provinceOptions, setProvinceOptions] = React.useState<
    Array<{ value: string; label: string }>
  >([]);
  const [cityOptions, setCityOptions] = React.useState<
    Array<{ value: string; label: string }>
  >([]);
  const [districtOptions, setDistrictOptions] = React.useState<
    Array<{ value: string; label: string }>
  >([]);

  const [loadingProvince, setLoadingProvince] = React.useState(false);
  const [loadingCity, setLoadingCity] = React.useState(false);
  const [loadingDistrict, setLoadingDistrict] = React.useState(false);

  // Province list — Indonesia (daerah-indonesia) vs other (country-state-city)
  React.useEffect(() => {
    let cancelled = false;
    if (!country) {
      setProvinceOptions([]);
      return;
    }
    if (isIndonesia) {
      setLoadingProvince(true);
      getAllProvinces()
        .then((list) => {
          if (cancelled) return;
          setProvinceOptions(
            list.map((p) => ({ value: p.name, label: p.name })),
          );
        })
        .finally(() => !cancelled && setLoadingProvince(false));
    } else {
      const list = getStatesForCountry(country);
      if (!cancelled) {
        setProvinceOptions(
          list.map((s) => ({ value: s.name, label: s.name })),
        );
      }
    }
    return () => {
      cancelled = true;
    };
  }, [country, isIndonesia]);

  // City list
  React.useEffect(() => {
    let cancelled = false;
    if (!country || !province) {
      setCityOptions([]);
      return;
    }
    if (isIndonesia) {
      // Need to map province name → province id
      setLoadingCity(true);
      getAllProvinces()
        .then(async (provinces) => {
          if (cancelled) return;
          const found = provinces.find((p) => p.name === province);
          if (!found) {
            setCityOptions([]);
            return;
          }
          const cities = await getCitiesForProvince(found.id);
          if (cancelled) return;
          setCityOptions(
            cities.map((c) => ({ value: c.name, label: c.name })),
          );
        })
        .finally(() => !cancelled && setLoadingCity(false));
    } else {
      const list = getCitiesForCountryState(country, province);
      if (!cancelled) {
        setCityOptions(list.map((c) => ({ value: c.name, label: c.name })));
      }
    }
    return () => {
      cancelled = true;
    };
  }, [country, province, isIndonesia]);

  // District list — only for Indonesia (others use free-text)
  React.useEffect(() => {
    let cancelled = false;
    if (!isIndonesia) {
      setDistrictOptions([]);
      return;
    }
    if (!province || !city) {
      setDistrictOptions([]);
      return;
    }
    setLoadingDistrict(true);
    (async () => {
      const provinces = await getAllProvinces();
      if (cancelled) return;
      const prov = provinces.find((p) => p.name === province);
      if (!prov) {
        setDistrictOptions([]);
        return;
      }
      const cities = await getCitiesForProvince(prov.id);
      if (cancelled) return;
      const cty = cities.find((c) => c.name === city);
      if (!cty) {
        setDistrictOptions([]);
        return;
      }
      const districts = await getDistrictsForCity(cty.id);
      if (cancelled) return;
      setDistrictOptions(
        districts.map((d) => ({ value: d.name, label: d.name })),
      );
    })().finally(() => !cancelled && setLoadingDistrict(false));

    return () => {
      cancelled = true;
    };
  }, [isIndonesia, province, city]);

  // Reset child selections on parent change
  React.useEffect(() => {
    setValue("province", "", { shouldValidate: false });
    setValue("city", "", { shouldValidate: false });
    setValue("district", "", { shouldValidate: false });
  }, [country, setValue]);
  React.useEffect(() => {
    setValue("city", "", { shouldValidate: false });
    setValue("district", "", { shouldValidate: false });
  }, [province, setValue]);
  React.useEffect(() => {
    setValue("district", "", { shouldValidate: false });
  }, [city, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CountrySelect control={control} errors={errors} />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {isIndonesia ? t("field.province") : t("field.state")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="province"
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={provinceOptions}
                placeholder={
                  country
                    ? isIndonesia
                      ? t("field.provincePlaceholder")
                      : t("field.statePlaceholder")
                    : t("field.selectCountryFirst")
                }
                searchPlaceholder={
                  isIndonesia ? t("field.provinceSearch") : t("field.stateSearch")
                }
                loadingText={t("field.loading")}
                emptyMessage={t("field.emptyMessage")}
                loading={loadingProvince}
                disabled={!country || loadingProvince}
                invalid={!!errors.province}
                aria-label={isIndonesia ? t("field.province") : t("field.state")}
              />
            )}
          />
          <FieldError message={errors.province?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("field.city")} <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <SearchableCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                options={cityOptions}
                placeholder={
                  province
                    ? t("field.cityPlaceholder")
                    : t("field.selectProvinceFirst")
                }
                searchPlaceholder={
                  isIndonesia ? t("field.citySearchId") : t("field.citySearchEn")
                }
                loadingText={t("field.loading")}
                emptyMessage={t("field.emptyMessage")}
                allowFreeInput
                loading={loadingCity}
                disabled={!province || loadingCity}
                invalid={!!errors.city}
                aria-label={t("field.city")}
              />
            )}
          />
          <FieldError message={errors.city?.message} />
        </div>

        {isIndonesia ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t("field.district")} <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="district"
              render={({ field }) => (
                <SearchableCombobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={districtOptions}
                  placeholder={
                    city ? t("field.districtPlaceholder") : t("field.selectCityFirst")
                  }
                  searchPlaceholder={t("field.districtSearch")}
                  loadingText={t("field.loading")}
                  emptyMessage={t("field.emptyMessage")}
                  allowFreeInput
                  loading={loadingDistrict}
                  disabled={!city || loadingDistrict}
                  invalid={!!errors.district}
                  aria-label={t("field.district")}
                />
              )}
            />
            <FieldError message={errors.district?.message} />
          </div>
        ) : (
          <div className="space-y-1.5">
            <label
              htmlFor="district"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
            >
              {t("field.districtSubRegion")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="district"
              render={({ field }) => (
                <Input
                  id="district"
                  placeholder={t("field.districtSubRegionPlaceholder")}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className={fieldClass(!!errors.district)}
                />
              )}
            />
            <FieldError message={errors.district?.message} />
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="postal_code"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            {t("field.postalCode")} <span className="text-red-500">*</span>
          </label>
          <Controller
            control={control}
            name="postal_code"
            render={({ field }) => (
              <Input
                id="postal_code"
                inputMode="numeric"
                maxLength={10}
                placeholder={t("field.postalCodePlaceholder")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className={fieldClass(!!errors.postal_code)}
              />
            )}
          />
          <FieldError message={errors.postal_code?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="address"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          {t("field.address")} <span className="text-red-500">*</span>
        </label>
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <Textarea
              id="address"
              placeholder={t("field.addressPlaceholder")}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className={[
                "min-h-24 rounded-lg border-zinc-200 bg-zinc-50/50 px-3 shadow-sm",
                "transition-all focus-visible:ring-2 focus-visible:ring-black",
                "focus-visible:border-transparent focus-visible:bg-white text-sm",
                errors.address
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "",
              ].join(" ")}
            />
          )}
        />
        <FieldError message={errors.address?.message} />
      </div>
    </div>
  );
}
