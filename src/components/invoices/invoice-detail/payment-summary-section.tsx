"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { invoiceStatusBadgeClass } from "@/lib/invoice-status";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

function formatIdr(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function PaymentSummarySection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section5");
  const tStatus = useTranslations("Invoices.status");
  const ps = invoice.payment_summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("invoiceAmount")}
            </dt>
            <dd className="text-sm font-medium tabular-nums text-zinc-900">
              Rp {formatIdr(ps.invoice_amount)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("paidAmount")}
            </dt>
            <dd className="text-sm font-medium tabular-nums text-zinc-900">
              Rp {formatIdr(ps.paid_amount)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("outstandingAmount")}
            </dt>
            <dd className="text-sm font-medium tabular-nums text-zinc-900">
              Rp {formatIdr(ps.outstanding_amount)}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t("paymentStatus")}
            </dt>
            <dd className="text-sm">
              <Badge variant="outline" className={invoiceStatusBadgeClass(ps.payment_status)}>
                {tStatus(ps.payment_status)}
              </Badge>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
