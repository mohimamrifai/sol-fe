"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableCombobox } from "@/components/searchable-combobox";
import { cn } from "@/lib/utils";
import type { ListMasterOption } from "@/hooks/use-admin-list-masters";

export type FilterSelectField = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export type FilterDateField = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

type AdminListFiltersProps = {
  selects?: FilterSelectField[];
  dates?: FilterDateField[];
  className?: string;
  defaultSearchPlaceholder?: string;
};

export function AdminListFilters({
  selects = [],
  dates = [],
  className,
  defaultSearchPlaceholder = "Cari…",
}: AdminListFiltersProps) {
  if (selects.length === 0 && dates.length === 0) return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {selects.map((field) => (
        <div key={field.id} className={cn("flex flex-col gap-1.5", field.className)}>
          <Label htmlFor={field.id} className="text-xs text-muted-foreground">
            {field.label}
          </Label>
          {field.searchable ? (
            <SearchableCombobox
              value={field.value}
              onChange={field.onChange}
              options={field.options}
              placeholder={field.options.find((o) => o.value === field.value)?.label ?? field.label}
              searchPlaceholder={field.searchPlaceholder ?? defaultSearchPlaceholder}
              className="h-9"
              aria-label={field.label}
            />
          ) : (
            <Select value={field.value} onValueChange={(v) => v != null && field.onChange(v)}>
              <SelectTrigger id={field.id} className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((o) => (
                  <SelectItem key={o.value || "all"} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      {dates.map((field) => (
        <div key={field.id} className={cn("flex flex-col gap-1.5", field.className)}>
          <Label htmlFor={field.id} className="text-xs text-muted-foreground">
            {field.label}
          </Label>
          <Input
            id={field.id}
            type="date"
            className="h-9"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function masterSelectOptions(
  items: ListMasterOption[],
  allLabel: string
): Array<{ value: string; label: string }> {
  return [
    { value: "all", label: allLabel },
    ...items.map((item) => ({ value: String(item.id), label: item.label })),
  ];
}

export function paramFromFilter(value: string): number | undefined {
  if (!value || value === "all") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function stringParamFromFilter(value: string): string | undefined {
  if (!value || value === "all") return undefined;
  return value;
}

export function dateParamFromFilter(value: string): string | undefined {
  const v = value.trim();
  return v || undefined;
}
