"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import type { CustomerInvoiceDetail } from "@/lib/invoice-types";

interface Props {
  invoice: CustomerInvoiceDetail;
}

export function ShipmentInfoSection({ invoice }: Props) {
  const t = useTranslations("Invoices.detail.section2");
  const s = invoice.shipment;

  const fields: Array<[string, React.ReactNode]> = [
    [
      t("shipmentNo"),
      s.id && s.shipment_no ? (
        <Link
          href={`/dashboard/shipments/${s.id}` as never}
          className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          {s.shipment_no}
        </Link>
      ) : (
        (s.shipment_no && s.shipment_no !== "" ? s.shipment_no : "—")
      ),
    ],
    [
      t("bookingNo"),
      s.booking_id && s.booking_no ? (
        <Link
          href={`/dashboard/booking/${s.booking_id}` as never}
          className="font-medium text-sky-700 hover:text-sky-900 hover:underline"
        >
          {s.booking_no}
        </Link>
      ) : (
        (s.booking_no && s.booking_no !== "" ? s.booking_no : "—")
      ),
    ],
    [t("cnNo"), s.cn_no && s.cn_no !== "" ? s.cn_no : "—"],
    [t("route"), s.route && s.route !== "" ? s.route : "—"],
    [t("serviceType"), s.service_type && s.service_type !== "" ? s.service_type : "—"],
    [
      t("shipmentCoverage"),
      s.shipment_coverage && s.shipment_coverage !== "" ? s.shipment_coverage : "—",
    ],
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
              <dd className="text-sm text-zinc-900 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
