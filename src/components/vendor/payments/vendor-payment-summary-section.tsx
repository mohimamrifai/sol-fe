"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVendorPayment } from "@/hooks/use-vendor-payments";

const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

type Props = { paymentId: number };

export function VendorPaymentSummarySection({ paymentId }: Props) {
  const t = useTranslations("Vendor.payments.detail.sections");
  const { data, isLoading } = useVendorPayment(paymentId);
  const p = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("summary")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!p) return null;

  const invoiceTotal = p.invoice?.total_amount ?? p.vendor_invoice?.total_amount ?? 0;
  const paidSoFar = (p.history ?? []).reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
  const outstanding = Math.max(0, invoiceTotal - paidSoFar);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-zinc-600" />
          {t("summary")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <Field label="Invoice Total" value={CURRENCY.format(invoiceTotal)} />
          <Field label="This Payment" value={CURRENCY.format(p.amount)} />
          <Field label="Paid So Far" value={CURRENCY.format(paidSoFar)} />
          <Field label="Outstanding" value={CURRENCY.format(outstanding)} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input value={value} readOnly className="h-10 bg-zinc-50/50" />
    </div>
  );
}
