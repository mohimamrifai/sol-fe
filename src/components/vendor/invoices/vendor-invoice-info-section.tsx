"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { useVendorInvoice } from "@/hooks/use-vendor-invoices";
import { Badge } from "@/components/ui/badge";

type Props = { invoiceId: number };

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 border-zinc-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function VendorInvoiceInfoSection({ invoiceId }: Props) {
  const t = useTranslations("Vendor.invoices.detail.sections");
  const { data, isLoading } = useVendorInvoice(invoiceId);
  const inv = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("info")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!inv) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-zinc-600" />
          {t("info")}
        </CardTitle>
        <Badge className={`${STATUS_BADGE[inv.status] ?? ""} border text-xs`}>{inv.status_label}</Badge>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Field label="Invoice Number" value={inv.invoice_number} mono />
          <Field label="Job Order" value={inv.job_order?.shipment_number ?? "—"} mono />
          <Field label="Reviewed By" value={inv.reviewed_by ?? "—"} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input value={value} readOnly className={`h-10 bg-zinc-50/50 ${mono ? "font-mono text-xs" : ""}`} />
    </div>
  );
}
