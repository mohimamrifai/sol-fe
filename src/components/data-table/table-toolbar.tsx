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
import { cn } from "@/lib/utils";

export type TableToolbarFilterOption = { value: string; label: string };

type TableToolbarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  filterLabel?: string;
  filterValue?: string;
  onFilterChange?: (v: string) => void;
  filterOptions?: TableToolbarFilterOption[];
  filter2Label?: string;
  filter2Value?: string;
  onFilter2Change?: (v: string) => void;
  filter2Options?: TableToolbarFilterOption[];
  className?: string;
};

export function TableToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterLabel = "Filter",
  filterValue = "all",
  onFilterChange,
  filterOptions = [],
  filter2Label = "Filter",
  filter2Value = "all",
  onFilter2Change,
  filter2Options = [],
  className,
}: TableToolbarProps) {
  const showFilter = filterOptions.length > 0 && onFilterChange != null;
  const showFilter2 = filter2Options.length > 0 && onFilter2Change != null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-sm">
        <Label htmlFor="table-search" className="text-xs text-muted-foreground">
          Cari
        </Label>
        <Input
          id="table-search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9"
        />
      </div>
      {showFilter ? (
        <div className="flex w-full flex-col gap-1.5 sm:w-52">
          <Label className="text-xs text-muted-foreground">{filterLabel}</Label>
          <Select
            value={filterValue}
            onValueChange={(v) => {
              if (v != null) onFilterChange?.(v);
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((o) => (
                <SelectItem key={o.value || "all"} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {showFilter2 ? (
        <div className="flex w-full flex-col gap-1.5 sm:w-52">
          <Label className="text-xs text-muted-foreground">{filter2Label}</Label>
          <Select
            value={filter2Value}
            onValueChange={(v) => {
              if (v != null) onFilter2Change?.(v);
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              {filter2Options.map((o) => (
                <SelectItem key={o.value || "all"} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
