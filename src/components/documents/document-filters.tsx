"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Filter, RotateCcw, Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  DOCUMENT_FILTER_TYPES,
  type DocumentFilterTypeKey,
  type DocumentShipmentOption,
} from "@/lib/document-types";

export interface DocumentFiltersValue {
  search: string;
  type: DocumentFilterTypeKey | "";
  shipmentId: number | null;
  dateFrom: string;
  dateTo: string;
}

export const DOCUMENT_FILTER_DEFAULTS: DocumentFiltersValue = {
  search: "",
  type: "",
  shipmentId: null,
  dateFrom: "",
  dateTo: "",
};

interface Props {
  value: DocumentFiltersValue;
  onChange: (next: DocumentFiltersValue) => void;
  shipmentOptions: DocumentShipmentOption[];
}

export function DocumentFilters({ value, onChange, shipmentOptions }: Props) {
  const t = useTranslations("Documents.filter");
  const tFilterType = useTranslations("Documents.filterType");

  const debouncedSearch = useDebouncedValue(value.search, 300);
  const lastAppliedSearch = React.useRef(debouncedSearch);

  React.useEffect(() => {
    if (lastAppliedSearch.current !== debouncedSearch) {
      lastAppliedSearch.current = debouncedSearch;
      onChange({ ...value, search: debouncedSearch });
    }
  }, [debouncedSearch, onChange, value]);

  const update = <K extends keyof DocumentFiltersValue>(
    key: K,
    val: DocumentFiltersValue[K]
  ) => onChange({ ...value, [key]: val });

  const reset = () => {
    lastAppliedSearch.current = "";
    onChange(DOCUMENT_FILTER_DEFAULTS);
  };

  const isFiltered =
    value.search !== "" ||
    value.type !== "" ||
    value.shipmentId != null ||
    value.dateFrom !== "" ||
    value.dateTo !== "";

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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={value.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("type")}</Label>
          <SearchableCombobox
            value={value.type}
            onChange={(v) => update("type", v as DocumentFilterTypeKey | "")}
            options={[
              { value: "", label: t("allTypes") },
              ...DOCUMENT_FILTER_TYPES.map((key) => ({
                value: key,
                label: tFilterType(key),
              })),
            ]}
            placeholder={t("allTypes")}
            emptyMessage={t("allTypes")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("shipment")}</Label>
          <SearchableCombobox
            value={value.shipmentId ? String(value.shipmentId) : ""}
            onChange={(v) => update("shipmentId", v ? Number(v) : null)}
            options={[
              { value: "", label: t("allShipments") },
              ...shipmentOptions.map((o) => ({ value: String(o.id), label: o.label })),
            ]}
            placeholder={t("shipmentPlaceholder")}
            emptyMessage={t("shipmentPlaceholder")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("dateFrom")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.dateFrom}
              onChange={(e) => update("dateFrom", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
          <Label className="text-xs text-zinc-600">{t("dateTo")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.dateTo}
              min={value.dateFrom || undefined}
              onChange={(e) => update("dateTo", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
