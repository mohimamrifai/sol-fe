"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { getAllProvinces, getCitiesForProvince } from "@/lib/id-regions";

export interface LocationFiltersValue {
  search: string;
  type: string;
  status: string;
  province: string;
  city: string;
}

export const LOCATION_FILTER_DEFAULTS: LocationFiltersValue = {
  search: "",
  type: "",
  status: "",
  province: "",
  city: "",
};

interface Props {
  value: LocationFiltersValue;
  onChange: (next: LocationFiltersValue) => void;
}

export function LocationFilters({ value, onChange }: Props) {
  const t = useTranslations("Locations");
  const [localSearch, setLocalSearch] = React.useState(value.search);
  const debounced = useDebouncedValue(localSearch, 300);

  React.useEffect(() => {
    if (debounced !== value.search) {
      onChange({ ...value, search: debounced });
    }
  }, [debounced, value, onChange]);

  React.useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  React.useEffect(() => {
    if (value.province && value.city) {
      onChange({ ...value, city: "" });
    }
  }, [value.province]);

  const [provinceOptions, setProvinceOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [cityOptions, setCityOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loadingProvince, setLoadingProvince] = React.useState(false);
  const [loadingCity, setLoadingCity] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingProvince(true);
    getAllProvinces()
      .then((list) => {
        if (cancelled) return;
        setProvinceOptions(list.map((p) => ({ value: p.name, label: p.name })));
      })
      .finally(() => !cancelled && setLoadingProvince(false));
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!value.province) {
      setCityOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingCity(true);
    (async () => {
      const provinces = await getAllProvinces();
      if (cancelled) return;
      const prov = provinces.find((p) => p.name === value.province);
      if (!prov) {
        setCityOptions([]);
        return;
      }
      const cities = await getCitiesForProvince(prov.id);
      if (cancelled) return;
      setCityOptions(cities.map((c) => ({ value: c.name, label: c.name })));
    })().finally(() => !cancelled && setLoadingCity(false));
    return () => {
      cancelled = true;
    };
  }, [value.province]);

  const isFiltered = !!(
    value.search || value.type || value.status || value.province || value.city
  );

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={t("filters.search")}
          className="h-10 pl-9"
        />
      </div>
      <Select
        value={value.type || "all"}
        onValueChange={(v) => onChange({ ...value, type: v === "all" ? "" : v ?? "" })}
      >
        <SelectTrigger className="h-10 w-full sm:w-44">
          <SelectValue placeholder={t("filters.type")} />
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
          <SelectItem value="head_office">{t("type.head_office")}</SelectItem>
          <SelectItem value="branch_office">{t("type.branch_office")}</SelectItem>
          <SelectItem value="warehouse">{t("type.warehouse")}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={value.status || "all"}
        onValueChange={(v) => onChange({ ...value, status: v === "all" ? "" : v ?? "" })}
      >
        <SelectTrigger className="h-10 w-full sm:w-36">
          <SelectValue placeholder={t("filters.status")} />
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem value="all">{t("filters.allStatus")}</SelectItem>
          <SelectItem value="active">{t("status.active")}</SelectItem>
          <SelectItem value="inactive">{t("status.inactive")}</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-full sm:w-44">
        <SearchableCombobox
          value={value.province}
          onChange={(v) => onChange({ ...value, province: v || "" })}
          options={provinceOptions}
          placeholder={loadingProvince ? t("filters.loading") : t("filters.province")}
          searchPlaceholder={t("filters.searchProvince")}
          loading={loadingProvince}
          allowFreeInput
        />
      </div>
      <div className="w-full sm:w-44">
        <SearchableCombobox
          value={value.city}
          onChange={(v) => onChange({ ...value, city: v || "" })}
          options={cityOptions}
          placeholder={!value.province ? t("filters.selectProvinceFirst") : loadingCity ? t("filters.loading") : t("filters.city")}
          searchPlaceholder={t("filters.searchCity")}
          loading={loadingCity}
          allowFreeInput
          disabled={!value.province}
        />
      </div>
      {isFiltered ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setLocalSearch("");
            onChange(LOCATION_FILTER_DEFAULTS);
          }}
          className="h-10 w-10"
          title="Clear"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
