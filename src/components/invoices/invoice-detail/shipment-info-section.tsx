"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

export function ShipmentInfoSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section2");
  const s = invoice.shipment;

  const fields: Array<[string, string | null | undefined]> = [
    [t("shipmentNo"), s.shipment_no],
    [t("bookingNo"), s.booking_no],
    [t("cnNo"), s.cn_no],
    [t("route"), s.route],
    [t("serviceType"), s.service_type],
    [t("shipmentCoverage"), s.shipment_coverage],
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
      </CardContent>
    </Card>
  );
}
