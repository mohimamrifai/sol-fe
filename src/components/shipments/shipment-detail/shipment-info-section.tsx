"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { shipmentStatusBadgeClass, shipmentStatusCardLabelKey } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";

export interface ShipmentInfoData {
  company_name?: string;
  display_number?: string;
  shipment_number?: string;
  waybill_number?: string;
  booking_number?: string;
  service_type_name?: string;
  shipment_coverage?: string;
  origin_station?: string;
  destination_station?: string;
  etd?: string | null;
  eta?: string | null;
  high_level_status?: string;
}

interface Props {
  data: ShipmentInfoData;
}

function formatDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShipmentInfoSection({ data }: Props) {
  const t = useTranslations("Shipments.detail.section1");
  const tCard = useTranslations("Shipments.card");
  const tCoverage = useTranslations("Shipments.coverage");
  const status = data.high_level_status ?? "planning";
  const statusLabelKey = shipmentStatusCardLabelKey(status).split(".")[1] ?? "planning";

  const rows: [string, string | React.ReactNode][] = [
    [t("customer"), data.company_name ?? "—"],
    [t("shipmentNo"), data.display_number ?? data.shipment_number ?? "—"],
    [t("bookingNo"), data.booking_number ?? "—"],
    [t("consignmentNote"), data.waybill_number ?? "—"],
    [t("serviceType"), data.service_type_name ?? "—"],
    [t("shipmentCoverage"), data.shipment_coverage ? tCoverage(data.shipment_coverage) : "—"],
    [t("originStation"), data.origin_station ?? "—"],
    [t("destinationStation"), data.destination_station ?? "—"],
    [t("etd"), formatDate(data.etd)],
    [t("eta"), formatDate(data.eta)],
    [
      t("currentStatus"),
      <span
        key="status-badge"
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
          shipmentStatusBadgeClass(status)
        )}
      >
        {tCard(statusLabelKey)}
      </span>,
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
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map(([label, value], idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2"
            >
              <dt className="text-xs font-medium text-zinc-500">{label}</dt>
              <dd className="text-right text-sm text-zinc-900">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
