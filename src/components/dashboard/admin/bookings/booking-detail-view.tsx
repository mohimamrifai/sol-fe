"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import type { BookingDetail } from "./types";

type Props = {
  data: BookingDetail | null;
  loading?: boolean;
};

export function BookingDetailView({ data, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat detail booking…</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Data booking tidak ditemukan.</p>;
  }

  const origin = data.origin_location?.name ?? "—";
  const destination = data.destination_location?.name ?? "—";
  const service = data.service_type?.name ?? data.service_type?.code ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Booking No</p>
          <p className="text-lg font-semibold">{data.booking_number}</p>
        </div>
        <Badge variant="outline" className={bookingStatusBadgeClass(data.status)}>
          {bookingStatusLabelFromApi(data.status)}
        </Badge>
        {data.shipment_id || data.shipment_exists ? (
          <Badge variant="outline">Converted to Shipment</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipment Route</CardTitle>
            <CardDescription>Origin → Destination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Customer:</span> {data.company?.name ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Route:</span> {origin} → {destination}
            </p>
            <p>
              <span className="text-muted-foreground">Service:</span> {service}
            </p>
            <p>
              <span className="text-muted-foreground">Coverage:</span>{" "}
              {data.shipment_coverage?.replace(/_/g, " ") ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Booking Date:</span>{" "}
              {data.created_at ? String(data.created_at).slice(0, 10) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shipper & Consignee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Shipper</p>
              <p>{data.shipper_name ?? "—"}</p>
              <p className="text-muted-foreground">{data.shipper_address ?? ""}</p>
              <p className="text-muted-foreground">{data.shipper_phone ?? ""}</p>
            </div>
            <div>
              <p className="font-medium">Consignee</p>
              <p>{data.consignee_name ?? "—"}</p>
              <p className="text-muted-foreground">{data.consignee_address ?? ""}</p>
              <p className="text-muted-foreground">{data.consignee_phone ?? ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {data.estimated_price != null
            ? `Total Estimation: ${String(data.estimated_price)}`
            : "Waiting for cost estimation."}
        </CardContent>
      </Card>

      {data.activities?.length ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.activities.map((act, i) => (
                <li key={i} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                  <span>{String(act.description ?? act.event ?? "—")}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {act.created_at ? String(act.created_at).slice(0, 16).replace("T", " ") : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
