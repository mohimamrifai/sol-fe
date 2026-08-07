"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorPayment } from "@/hooks/use-vendor-payments";

type Props = { paymentId: number };

export function VendorPaymentInfoSection({ paymentId }: Props) {
  const t = useTranslations("Vendor.payments.detail.sections");
  const tF = useTranslations("Vendor.payments.detail.fields");
  const { data, isLoading } = useVendorPayment(paymentId);
  const p = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("info")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!p) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 text-zinc-600" />
          {t("info")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Field label={tF("paymentNo")} value={p.payment_number} mono />
          <Field label={tF("invoiceNo")} value={p.invoice?.invoice_number ?? p.vendor_invoice?.invoice_number ?? "—"} mono />
          <Field label={tF("paymentDate")} value={p.payment_date} />
          <Field label={tF("method")} value={p.payment_method_label} />
          <Field label={tF("referenceNo")} value={p.reference_no ?? "—"} mono />
          <Field label={tF("paidBy")} value={p.paid_by ?? "—"} />
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
