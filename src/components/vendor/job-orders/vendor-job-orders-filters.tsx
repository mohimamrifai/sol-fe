"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FiltersState = {
  search: string;
  status: string;
  service_type_id: string;
  from: string;
  to: string;
};

type Props = {
  onChange: (filters: FiltersState) => void;
  serviceTypes: Array<{ id: number; name: string }>;
};

export function VendorJobOrdersFilters({ onChange, serviceTypes }: Props) {
  const t = useTranslations("Vendor.jobOrders.filters");
  const tc = useTranslations("Vendor.common");
  const tStat = useTranslations("Vendor.jobOrders.stats");
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    status: "all",
    service_type_id: "all",
    from: "",
    to: "",
  });

  useEffect(() => {
    const handle = setTimeout(() => onChange(filters), 300);
    return () => clearTimeout(handle);
  }, [filters, onChange]);

  const handleReset = () =>
    setFilters({ search: "", status: "all", service_type_id: "all", from: "", to: "" });

  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            placeholder={t("search")}
            className="h-10 pl-9"
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => v && setFilters((p) => ({ ...p, status: v }))}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tc("all")}</SelectItem>
            <SelectItem value="pending_acceptance">{tStat("pending_acceptance")}</SelectItem>
            <SelectItem value="accepted">{tStat("accepted")}</SelectItem>
            <SelectItem value="in_progress">{tStat("in_progress")}</SelectItem>
            <SelectItem value="waiting_verification">{tStat("waiting_verification")}</SelectItem>
            <SelectItem value="completed">{tStat("completed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.service_type_id}
          onValueChange={(v) => v && setFilters((p) => ({ ...p, service_type_id: v }))}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("serviceType")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tc("all")}</SelectItem>
            {serviceTypes.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleReset} className="h-10">
          <X className="mr-2 h-4 w-4" /> {tc("reset")}
        </Button>
      </CardContent>
    </Card>
  );
}
