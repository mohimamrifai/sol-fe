"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { useVendorInvoice } from "@/hooks/use-vendor-invoices";

const CURRENCY = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

type Props = { invoiceId: number };

export function VendorInvoiceBillingSection({ invoiceId }: Props) {
  const t = useTranslations("Vendor.invoices.detail.sections");
  const { data, isLoading } = useVendorInvoice(invoiceId);
  const inv = data?.data;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t("billing")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </CardContent>
      </Card>
    );
  }
  if (!inv) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4 text-zinc-600" />
          {t("billing")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <Field label="Invoice Date" value={inv.invoice_date} />
          <Field label="Due Date" value={inv.due_date} />
          <Field label="Submitted At" value={inv.submitted_at ? new Date(inv.submitted_at).toLocaleDateString("id-ID") : "—"} />
          <Field label="Invoice Amount" value={CURRENCY.format(inv.invoice_amount)} />
          <Field label="Tax Amount" value={CURRENCY.format(inv.tax_amount)} />
          <Field label="Total Amount" value={CURRENCY.format(inv.total_amount)} />
          <Field label="Paid Amount" value={CURRENCY.format(inv.paid_amount)} />
          <Field label="Outstanding" value={CURRENCY.format(inv.outstanding_amount)} />
          <Field label="Notes" value={inv.notes ?? "—"} wide />
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 md:col-span-3" : ""}>
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input value={value} readOnly className="h-10 bg-zinc-50/50" />
    </div>
  );
}
