"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { useAddressRegionOptions } from "@/hooks/use-address-region-options";
import { getAllCountries, DEFAULT_COUNTRY } from "@/lib/countries";
import { cn } from "@/lib/utils";

export type AddressRegionValue = {
  country?: string;
  province: string;
  city: string;
  district?: string;
  postal_code?: string;
};

type AddressRegionLabels = {
  country?: string;
  province?: string;
  state?: string;
  city?: string;
  district?: string;
  postalCode?: string;
};

type ControlledAddressRegionFieldsProps = {
  value: AddressRegionValue;
  onChange: (patch: Partial<AddressRegionValue>) => void;
  disabled?: boolean;
  showCountry?: boolean;
  showDistrict?: boolean;
  showPostalCode?: boolean;
  className?: string;
  comboboxClassName?: string;
  idPrefix?: string;
  labels?: AddressRegionLabels;
};

export function ControlledAddressRegionFields({
  value,
  onChange,
  disabled = false,
  showCountry = false,
  showDistrict = false,
  showPostalCode = true,
  className,
  comboboxClassName = "h-9",
  idPrefix = "addr",
  labels,
}: ControlledAddressRegionFieldsProps) {
  const t = useTranslations("AdminCommon.addressRegion");
  const tc = useTranslations("Company.form");

  const country = value.country ?? DEFAULT_COUNTRY;
  const province = value.province ?? "";
  const city = value.city ?? "";
  const district = value.district ?? "";
  const postalCode = value.postal_code ?? "";

  const {
    isIndonesia,
    provinceOptions,
    cityOptions,
    districtOptions,
    loadingProvince,
    loadingCity,
    loadingDistrict,
  } = useAddressRegionOptions(country, province, city);

  const label = {
    country: labels?.country ?? tc("country"),
    province: labels?.province ?? (isIndonesia ? tc("province") : (labels?.state ?? tc("province"))),
    city: labels?.city ?? tc("city"),
    district: labels?.district ?? tc("district"),
    postalCode: labels?.postalCode ?? tc("postalCode"),
  };

  const handleCountryChange = (next: string) => {
    onChange({ country: next, province: "", city: "", district: "" });
  };

  const handleProvinceChange = (next: string) => {
    onChange({ province: next, city: "", district: "" });
  };

  const handleCityChange = (next: string) => {
    onChange({ city: next, district: "" });
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      {showCountry ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-country`}>{label.country}</Label>
          <SearchableCombobox
            value={country}
            onChange={handleCountryChange}
            options={getAllCountries().map((c) => ({ value: c.name, label: c.name }))}
            placeholder={t("selectCountry")}
            searchPlaceholder={t("searchCountry")}
            disabled={disabled}
            className={comboboxClassName}
          />
        </div>
      ) : null}

      <div className={cn("space-y-2", showCountry && "md:col-start-2")}>
        <Label htmlFor={`${idPrefix}-province`}>{isIndonesia ? label.province : t("state")}</Label>
        <SearchableCombobox
          value={province}
          onChange={handleProvinceChange}
          options={provinceOptions}
          placeholder={country ? t("selectProvince") : t("selectCountryFirst")}
          searchPlaceholder={t("searchProvince")}
          loading={loadingProvince}
          disabled={disabled || !country || loadingProvince}
          className={comboboxClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-city`}>{label.city}</Label>
        <SearchableCombobox
          value={city}
          onChange={handleCityChange}
          options={cityOptions}
          placeholder={province ? t("selectCity") : t("selectProvinceFirst")}
          searchPlaceholder={t("searchCity")}
          loading={loadingCity}
          disabled={disabled || !province || loadingCity}
          allowFreeInput
          className={comboboxClassName}
        />
      </div>

      {showDistrict ? (
        isIndonesia ? (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-district`}>{label.district}</Label>
            <SearchableCombobox
              value={district}
              onChange={(next) => onChange({ district: next })}
              options={districtOptions}
              placeholder={city ? t("selectDistrict") : t("selectCityFirst")}
              searchPlaceholder={t("searchDistrict")}
              loading={loadingDistrict}
              disabled={disabled || !city || loadingDistrict}
              allowFreeInput
              className={comboboxClassName}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-district`}>{label.district}</Label>
            <Input
              id={`${idPrefix}-district`}
              value={district}
              onChange={(e) => onChange({ district: e.target.value })}
              disabled={disabled}
              className={comboboxClassName}
              placeholder={label.district}
            />
          </div>
        )
      ) : null}

      {showPostalCode ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-postal`}>{label.postalCode}</Label>
          <Input
            id={`${idPrefix}-postal`}
            value={postalCode}
            onChange={(e) => onChange({ postal_code: e.target.value.replace(/\D/g, "") })}
            disabled={disabled}
            className={comboboxClassName}
            inputMode="numeric"
            placeholder="00000"
          />
        </div>
      ) : null}
    </div>
  );
}
