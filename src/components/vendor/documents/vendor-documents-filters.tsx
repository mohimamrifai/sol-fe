"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DateRangePicker } from "@/components/vendor/date-range-picker";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

type Props = {
  onChange: (filters: Record<string, unknown>) => void;
};

export function VendorDocumentFilters({ onChange }: Props) {
  const t = useTranslations("Vendor.documents.filters");
  const tCommon = useTranslations("Vendor.common");
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [serviceTypeId, setServiceTypeId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: serviceTypes } = useQuery({
    queryKey: ["vendor", "master", "service-types"],
    queryFn: () =>
      apiFetch<{ data: Array<{ id: number; name: string }> }>("/vendor/master/service-types"),
  });

  useEffect(() => {
    const handle = setTimeout(
      () =>
        onChange({
          search,
          document_type: documentType === "all" ? undefined : documentType,
          service_type_id: serviceTypeId === "all" ? undefined : serviceTypeId,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        }),
      300,
    );
    return () => clearTimeout(handle);
  }, [search, documentType, serviceTypeId, dateFrom, dateTo, onChange]);

  return (
    <Card>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="h-10 pl-9"
          />
        </div>
        <Select value={documentType} onValueChange={(v) => v && setDocumentType(v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("documentType")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            <SelectItem value="job_order">{t("types.jobOrder")}</SelectItem>
            <SelectItem value="consignment_note">{t("types.consignmentNote")}</SelectItem>
            <SelectItem value="delivery_order">{t("types.deliveryOrder")}</SelectItem>
            <SelectItem value="proof_of_delivery">{t("types.proofOfDelivery")}</SelectItem>
            <SelectItem value="supporting_document">{t("types.supporting")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serviceTypeId} onValueChange={(v) => v && setServiceTypeId(v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("serviceType")} />
          </SelectTrigger>
          <SelectContent side="bottom">
            <SelectItem value="all">{tCommon("all")}</SelectItem>
            {(serviceTypes?.data ?? []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onChange={({ from, to }) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
        <Button
          variant="outline"
          className="h-10 lg:col-span-5 lg:ml-auto lg:w-auto"
          onClick={() => {
            setSearch("");
            setDocumentType("all");
            setServiceTypeId("all");
            setDateFrom("");
            setDateTo("");
          }}
        >
          <X className="mr-2 h-4 w-4" />
          {tCommon("reset")}
        </Button>
      </CardContent>
    </Card>
  );
}
