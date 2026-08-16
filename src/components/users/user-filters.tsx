"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { fetchCustomerLocations } from "@/lib/customer-api";

export interface UserFiltersValue {
  search: string;
  role: string;
  status: string;
  location_id: number | "";
}

export const USER_FILTER_DEFAULTS: UserFiltersValue = {
  search: "",
  role: "",
  status: "",
  location_id: "",
};

interface Props {
  value: UserFiltersValue;
  onChange: (next: UserFiltersValue) => void;
}

export function UserFilters({ value, onChange }: Props) {
  const t = useTranslations("Users");
  const [localSearch, setLocalSearch] = React.useState(value.search);
  const debounced = useDebouncedValue(localSearch, 300);

  React.useEffect(() => {
    if (debounced !== value.search) onChange({ ...value, search: debounced });
  }, [debounced, value, onChange]);

  React.useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  const [locationOptions, setLocationOptions] = React.useState<Array<{ value: string; label: string }>>([]);
  const [loadingLocations, setLoadingLocations] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingLocations(true);
    fetchCustomerLocations({ status: "active", perPage: 500 })
      .then((res) => {
        if (cancelled) return;
        const rows = res?.data ?? [];
        setLocationOptions(
          rows.map((l) => ({ value: String(l.id), label: (l.name as string) ?? `Location #${l.id}` }))
        );
      })
      .finally(() => !cancelled && setLoadingLocations(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const isFiltered = !!(value.search || value.role || value.status || value.location_id);

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
        value={value.role || "all"}
        onValueChange={(v) => onChange({ ...value, role: v === "all" ? "" : v ?? "" })}
      >
        <SelectTrigger className="h-10 w-full sm:w-44">
          <SelectValue placeholder={t("filters.role")} />
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem value="all">{t("filters.allRoles")}</SelectItem>
          <SelectItem value="company_admin">{t("role.company_admin")}</SelectItem>
          <SelectItem value="ops_pic">{t("role.ops_pic")}</SelectItem>
          <SelectItem value="finance_pic">{t("role.finance_pic")}</SelectItem>
          <SelectItem value="viewer">{t("role.viewer")}</SelectItem>
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
          <SelectItem value="active">{t("userStatus.active")}</SelectItem>
          <SelectItem value="inactive">{t("userStatus.inactive")}</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-full sm:w-44">
        <SearchableCombobox
          value={value.location_id ? String(value.location_id) : ""}
          onChange={(v) => {
            const s = v || "";
            onChange({ ...value, location_id: s ? Number(s) : "" });
          }}
          options={locationOptions}
          placeholder={loadingLocations ? t("filters.loading") : t("filters.locationAccess")}
          searchPlaceholder={t("filters.searchLocation")}
          loading={loadingLocations}
        />
      </div>
      {isFiltered ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setLocalSearch("");
            onChange(USER_FILTER_DEFAULTS);
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
