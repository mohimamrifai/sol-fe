"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/vendor/date-range-picker";

type Props = { onChange: (filters: Record<string, unknown>) => void };

export function VendorInvoiceFilters({ onChange }: Props) {
  const tCommon = useTranslations("Vendor.common");
  const tFilter = useTranslations("Vendor.invoices.filters");
  const tStat = useTranslations("Vendor.invoices.stats");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  useEffect(() => {
    const handle = setTimeout(
      () => onChange({ search, status, from, to, due_from: dueFrom, due_to: dueTo }),
      300,
    );
    return () => clearTimeout(handle);
  }, [search, status, from, to, dueFrom, dueTo, onChange]);

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tFilter("search")}
            className="h-10 pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="h-10 w-full min-w-40">
            <SelectValue placeholder={tFilter("status")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            <SelectItem value="draft">{tStat("draft")}</SelectItem>
            <SelectItem value="submitted">{tStat("submitted")}</SelectItem>
            <SelectItem value="approved">{tStat("approved")}</SelectItem>
            <SelectItem value="rejected">{tStat("rejected")}</SelectItem>
            <SelectItem value="paid">{tStat("paid")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-zinc-500">{tFilter("invoiceDate")}</span>
          <DateRangePicker from={from} to={to} onChange={({ from: f, to: tt }) => { setFrom(f); setTo(tt); }} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-zinc-500">{tFilter("dueDate")}</span>
          <DateRangePicker from={dueFrom} to={dueTo} onChange={({ from: f, to: tt }) => { setDueFrom(f); setDueTo(tt); }} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4 lg:flex lg:justify-end">
          <Button
            variant="outline"
            className="h-10 w-full md:w-auto"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setFrom("");
              setTo("");
              setDueFrom("");
              setDueTo("");
            }}
          >
            <X className="mr-1 h-4 w-4" /> {tCommon("reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
