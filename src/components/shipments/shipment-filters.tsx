"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Filter, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { SHIPMENT_STATUS_KEYS, shipmentStatusCardLabelKey } from "@/lib/shipment-status";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface ShipmentFiltersValue {
  search: string;
  status: string;
  serviceType: string;
  shipmentCoverage: string;
  originLocationId: number | null;
  destinationLocationId: number | null;
  shipmentDateFrom: string;
  shipmentDateTo: string;
}

const DEFAULT_FILTERS: ShipmentFiltersValue = {
  search: "",
  status: "",
  serviceType: "",
  shipmentCoverage: "",
  originLocationId: null,
  destinationLocationId: null,
  shipmentDateFrom: "",
  shipmentDateTo: "",
};

const COVERAGE_KEYS = ["port_to_port", "door_to_port", "port_to_door", "door_to_door"] as const;
const SERVICE_KEYS = ["LCL", "FCL"] as const;

export const SHIPMENT_FILTER_DEFAULTS = DEFAULT_FILTERS;

interface LocationOption { id: number; name: string; code: string }
interface Props {
  value: ShipmentFiltersValue;
  onChange: (next: ShipmentFiltersValue) => void;
  originOptions: LocationOption[];
  destinationOptions: LocationOption[];
}

export function ShipmentFilters({ value, onChange, originOptions, destinationOptions }: Props) {
  const t = useTranslations("Shipments.filter");
  const tStatus = useTranslations("Shipments.card");
  const tCoverage = useTranslations("Shipments.coverage");
  const tService = useTranslations("Shipments.serviceType");

  const debouncedSearch = useDebouncedValue(value.search, 300);
  const lastAppliedSearch = React.useRef(debouncedSearch);

  React.useEffect(() => {
    if (lastAppliedSearch.current !== debouncedSearch) {
      lastAppliedSearch.current = debouncedSearch;
      onChange({ ...value, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const update = <K extends keyof ShipmentFiltersValue>(
    key: K,
    val: ShipmentFiltersValue[K]
  ) => onChange({ ...value, [key]: val });

  const reset = () => {
    lastAppliedSearch.current = "";
    onChange(DEFAULT_FILTERS);
  };

  const isFiltered = SHIPMENT_STATUS_KEYS.some((k) => k === value.status)
    || value.serviceType !== ""
    || value.shipmentCoverage !== ""
    || value.originLocationId != null
    || value.destinationLocationId != null
    || value.shipmentDateFrom !== ""
    || value.shipmentDateTo !== ""
    || value.search !== "";

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600">
          <Filter className="h-3.5 w-3.5" />
          {t("title")}
        </div>
        {isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="h-8 gap-1 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            {t("clear")}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("searchLabel")}</Label>
          <Input
            value={value.search}
            onChange={(e) => update("search", e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("status")}</Label>
          <SearchableCombobox
            value={value.status}
            onChange={(v) => update("status", v)}
            options={[
              { value: "", label: t("allStatus") },
              ...SHIPMENT_STATUS_KEYS.map((k) => ({
                value: k,
                label: tStatus(shipmentStatusCardLabelKey(k).split(".")[1] ?? ""),
              })),
            ]}
            placeholder={t("allStatus")}
            emptyMessage={t("allStatus")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("serviceType")}</Label>
          <SearchableCombobox
            value={value.serviceType}
            onChange={(v) => update("serviceType", v)}
            options={[
              { value: "", label: t("allServiceTypes") },
              ...SERVICE_KEYS.map((k) => ({ value: k, label: tService(k) })),
            ]}
            placeholder={t("allServiceTypes")}
            emptyMessage={t("allServiceTypes")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("shipmentCoverage")}</Label>
          <SearchableCombobox
            value={value.shipmentCoverage}
            onChange={(v) => update("shipmentCoverage", v)}
            options={[
              { value: "", label: t("allCoverages") },
              ...COVERAGE_KEYS.map((k) => ({ value: k, label: tCoverage(k) })),
            ]}
            placeholder={t("allCoverages")}
            emptyMessage={t("allCoverages")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("originStation")}</Label>
          <SearchableCombobox
            value={value.originLocationId ? String(value.originLocationId) : ""}
            onChange={(v) => update("originLocationId", v ? Number(v) : null)}
            options={[
              { value: "", label: t("originStationPlaceholder") },
              ...originOptions.map((o) => ({
                value: String(o.id),
                label: o.code ? `${o.code} — ${o.name}` : o.name,
              })),
            ]}
            placeholder={t("originStationPlaceholder")}
            emptyMessage={t("originStationPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("destinationStation")}</Label>
          <SearchableCombobox
            value={value.destinationLocationId ? String(value.destinationLocationId) : ""}
            onChange={(v) => update("destinationLocationId", v ? Number(v) : null)}
            options={[
              { value: "", label: t("destinationStationPlaceholder") },
              ...destinationOptions.map((o) => ({
                value: String(o.id),
                label: o.code ? `${o.code} — ${o.name}` : o.name,
              })),
            ]}
            placeholder={t("destinationStationPlaceholder")}
            emptyMessage={t("destinationStationPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("dateFrom")}</Label>
          <Input
            type="date"
            value={value.shipmentDateFrom}
            onChange={(e) => update("shipmentDateFrom", e.target.value)}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("dateTo")}</Label>
          <Input
            type="date"
            value={value.shipmentDateTo}
            min={value.shipmentDateFrom || undefined}
            onChange={(e) => update("shipmentDateTo", e.target.value)}
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
}
