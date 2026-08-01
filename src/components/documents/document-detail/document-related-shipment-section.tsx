"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { shipmentStatusKey } from "@/lib/shipment-status";
import { fetchCustomerShipment } from "@/lib/customer-api";
import type { DocumentDetail } from "@/lib/document-types";

interface Props {
  document: DocumentDetail;
}

interface ShipmentDetailShape {
  id: number;
  display_number?: string | null;
  shipment_number?: string | null;
  shipment_no?: string | null;
  high_level_status?: string;
  shipment_coverage?: string | null;
  service_type?: { code?: string; name?: string } | null;
  origin_location?: { name?: string; code?: string } | null;
  destination_location?: { name?: string; code?: string } | null;
  booking?: { booking_number?: string | null } | null;
}

export function DocumentRelatedShipmentSection({ document }: Props) {
  const t = useTranslations("Documents.detail.section3");
  const tCard = useTranslations("Shipments.card");
  const tService = useTranslations("Shipments.serviceType");
  const tCoverage = useTranslations("Shipments.coverage");
  const shipmentId = document.related_shipment?.id ?? document.shipment_id ?? null;

  const query = useQuery({
    queryKey: ["customer", "shipment", "detail", "from-document", String(shipmentId ?? "")],
    queryFn: async () => {
      if (!shipmentId) return null;
      const res = await fetchCustomerShipment(shipmentId);
      return res.data as unknown as ShipmentDetailShape;
    },
    enabled: !!shipmentId,
  });

  const shipment = query.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-zinc-900">
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!shipmentId ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("noShipment")}</p>
        ) : query.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : !shipment ? (
          <p className="py-6 text-center text-sm text-zinc-500">{t("noShipment")}</p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={t("shipmentNo")}
              value={shipment.display_number ?? shipment.shipment_number ?? "—"}
            />
            <Field
              label={t("bookingNo")}
              value={shipment.booking?.booking_number ?? document.booking_no ?? "—"}
            />
            <Field
              label={t("route")}
              value={`${shipment.origin_location?.name ?? "—"} → ${shipment.destination_location?.name ?? "—"}`}
            />
            <Field
              label={t("serviceType")}
              value={
                shipment.service_type?.code
                  ? tService(shipment.service_type.code as "LCL" | "FCL")
                  : (shipment.service_type?.name ?? "—")
              }
            />
            <Field
              label={t("shipmentStatus")}
              value={tCard(shipmentStatusKey(shipment.high_level_status ?? "planning"))}
            />
            {shipment.shipment_coverage ? (
              <Field
                label="Coverage"
                value={tCoverage(shipment.shipment_coverage as "port_to_port")}
              />
            ) : null}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900">{value}</dd>
    </div>
  );
}
