"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "2-digit" });
}

export function InvoiceInfoSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section1");

  const fields: Array<[string, string | null | undefined]> = [
    [t("invoiceNumber"), invoice.invoice_number],
    [t("customer"), invoice.customer],
    [t("invoiceDate"), formatDate(invoice.invoice_date)],
    [t("dueDate"), formatDate(invoice.due_date)],
    [t("currency"), invoice.currency],
    [t("paymentTerms"), invoice.payment_terms],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="space-y-1">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {label}
              </dt>
              <dd className="text-sm text-zinc-900 break-words">{value && value !== "" ? value : "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {t("remark")}
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {invoice.remark ? invoice.remark : "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
