"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PaymentDetail } from "@/lib/payment-types";

interface Props {
  payment: PaymentDetail;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-900 tabular-nums">{value}</div>
    </div>
  );
}

export function InvoiceInfoSection({ payment }: Props) {
  const t = useTranslations("Payments.detail.section1");
  const invoice = payment.invoice;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label={t("invoiceNo")} value={invoice.invoice_number} />
          <Field label={t("invoiceDate")} value={formatDate(invoice.invoice_date)} />
          <Field label={t("dueDate")} value={formatDate(invoice.due_date)} />
          <Field label={t("invoiceAmount")} value={`Rp ${formatIdr(invoice.invoice_amount)}`} />
          <Field label={t("paidAmount")} value={`Rp ${formatIdr(invoice.paid_amount)}`} />
          <Field
            label={t("outstandingAmount")}
            value={
              <span className="font-semibold text-rose-700">
                Rp {formatIdr(invoice.outstanding_amount)}
              </span>
            }
          />
          <Field label={t("currency")} value={invoice.currency} />
        </div>
      </CardContent>
    </Card>
  );
}
