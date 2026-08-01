"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Calendar, Filter, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { InvoiceStatusKey } from "@/lib/invoice-types";

export interface InvoiceFiltersValue {
  search: string;
  status: InvoiceStatusKey | "";
  invoiceDateFrom: string;
  invoiceDateTo: string;
  dueDateFrom: string;
  dueDateTo: string;
}

export const INVOICE_FILTER_DEFAULTS: InvoiceFiltersValue = {
  search: "",
  status: "",
  invoiceDateFrom: "",
  invoiceDateTo: "",
  dueDateFrom: "",
  dueDateTo: "",
};

const STATUS_KEYS: InvoiceStatusKey[] = [
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
];

interface Props {
  value: InvoiceFiltersValue;
  onChange: (next: InvoiceFiltersValue) => void;
}

export function InvoiceFilters({ value, onChange }: Props) {
  const t = useTranslations("Invoices.filter");
  const tStatus = useTranslations("Invoices.status");

  const debouncedSearch = useDebouncedValue(value.search, 300);
  const lastAppliedSearch = React.useRef(debouncedSearch);

  React.useEffect(() => {
    if (lastAppliedSearch.current !== debouncedSearch) {
      lastAppliedSearch.current = debouncedSearch;
      onChange({ ...value, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  const update = <K extends keyof InvoiceFiltersValue>(key: K, val: InvoiceFiltersValue[K]) =>
    onChange({ ...value, [key]: val });

  const reset = () => {
    lastAppliedSearch.current = "";
    onChange(INVOICE_FILTER_DEFAULTS);
  };

  const isFiltered =
    value.search !== "" ||
    value.status !== "" ||
    value.invoiceDateFrom !== "" ||
    value.invoiceDateTo !== "" ||
    value.dueDateFrom !== "" ||
    value.dueDateTo !== "";

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
        <div className="space-y-1.5 lg:col-span-2">
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
          <Label className="text-xs text-zinc-600">{t("status")}</Label>
          <SearchableCombobox
            value={value.status}
            onChange={(v) => update("status", v as InvoiceStatusKey | "")}
            options={[
              { value: "", label: t("allStatus") },
              ...STATUS_KEYS.map((k) => ({ value: k, label: tStatus(k) })),
            ]}
            placeholder={t("allStatus")}
            emptyMessage={t("allStatus")}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("invoiceDateFrom")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.invoiceDateFrom}
              onChange={(e) => update("invoiceDateFrom", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("invoiceDateTo")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.invoiceDateTo}
              min={value.invoiceDateFrom || undefined}
              onChange={(e) => update("invoiceDateTo", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("dueDateFrom")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.dueDateFrom}
              onChange={(e) => update("dueDateFrom", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-zinc-600">{t("dueDateTo")}</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              type="date"
              value={value.dueDateTo}
              min={value.dueDateFrom || undefined}
              onChange={(e) => update("dueDateTo", e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
