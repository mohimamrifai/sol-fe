"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { bookingStatusBadgeClass, bookingStatusLabelFromApi } from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import type { BookingDetail } from "./types";

type Props = {
  data: BookingDetail | null;
  loading?: boolean;
};

type Breakdown = {
  freight?: number;
  pickup?: number;
  delivery?: number;
  discount?: number;
  additional_services?: number;
  total?: number;
};

const TIMELINE_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "confirmed", label: "Confirmed", statuses: ["approved", "confirmed"] },
  { key: "converted", label: "Converted to Shipment" },
] as const;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function coverageLabel(v?: string): string {
  if (!v) return "—";
  return v.replace(/_/g, " ");
}

function stepIndex(data: BookingDetail): number {
  const st = (data.status ?? "").toLowerCase();
  const converted =
    data.shipment_exists === true ||
    data.has_shipment === true ||
    typeof data.shipment_id === "number";

  if (converted) return 3;
  if (st === "approved" || st === "confirmed") return 2;
  if (st === "under_review" || st === "submitted") return 1;
  if (st === "draft") return 0;
  return -1;
}

export function BookingDetailView({ data, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat detail booking…</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">Data booking tidak ditemukan.</p>;
  }

  const origin = data.origin_location?.name ?? data.originLocation?.name ?? "—";
  const destination = data.destination_location?.name ?? data.destinationLocation?.name ?? "—";
  const service = data.service_type?.name ?? data.serviceType?.name ?? data.service_type?.code ?? "—";
  const breakdown = (data as BookingDetail & { price_breakdown?: Breakdown }).price_breakdown;
  const currentStep = stepIndex(data);

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
        {data.shipment_id || data.shipment_exists || data.has_shipment ? (
          <Badge variant="outline">Converted to Shipment</Badge>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status Timeline</CardTitle>
          <CardDescription>Draft → Submitted → Confirmed → Converted to Shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {TIMELINE_STEPS.map((step, idx) => {
              const done = currentStep >= idx;
              const active = currentStep === idx;
              return (
                <li key={step.key} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                      done ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-muted-foreground/30 text-muted-foreground",
                      active && "ring-2 ring-emerald-500/30"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className={cn(done ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                  {idx < TIMELINE_STEPS.length - 1 ? (
                    <span className="hidden text-muted-foreground sm:inline">→</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

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
              <span className="text-muted-foreground">Coverage:</span> {coverageLabel(data.shipment_coverage)}
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
          <CardTitle className="text-base">Internal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Sales PIC:</span>{" "}
            {(data as BookingDetail & { user?: { name?: string } }).user?.name ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Booking Date:</span>{" "}
            {data.created_at ? String(data.created_at).slice(0, 10) : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Pickup Date:</span>{" "}
            {(data as BookingDetail & { pickup_date?: string }).pickup_date?.slice(0, 10) ??
              data.departure_date?.slice(0, 10) ??
              "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Pickup Time:</span>{" "}
            {(data as BookingDetail & { pickup_time?: string }).pickup_time ?? "—"}
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Pickup Notes:</span>{" "}
            {(data as BookingDetail & { pickup_notes?: string }).pickup_notes ?? "—"}
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Internal Notes:</span> {data.notes ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Confirmed By:</span>{" "}
            {(data as BookingDetail & { approved_by_user?: { name?: string } }).approved_by_user?.name ??
              (data as BookingDetail & { approvedByUser?: { name?: string } }).approvedByUser?.name ??
              "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Confirmed Date:</span>{" "}
            {(data as BookingDetail & { approved_at?: string }).approved_at
              ? String((data as BookingDetail & { approved_at?: string }).approved_at).slice(0, 16).replace("T", " ")
              : "—"}
          </p>
          {(data.shipment_id || data.shipment_exists || data.has_shipment) ? (
            <>
              <p>
                <span className="text-muted-foreground">Converted By:</span>{" "}
                {(data as BookingDetail & { shipment?: { created_by_user?: { name?: string } } }).shipment?.created_by_user?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Converted Date:</span>{" "}
                {(data as BookingDetail & { shipment?: { created_at?: string } }).shipment?.created_at
                  ? String((data as BookingDetail & { shipment?: { created_at?: string } }).shipment?.created_at).slice(0, 16).replace("T", " ")
                  : "—"}
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {breakdown ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Freight</span>
                <span>{fmtIdr(breakdown.freight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup</span>
                <span>{fmtIdr(breakdown.pickup)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{fmtIdr(breakdown.delivery)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>{fmtIdr(breakdown.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Services</span>
                <span>{fmtIdr(breakdown.additional_services)}</span>
              </div>
              <Separator />
            </>
          ) : data.estimated_price == null ? (
            <p className="text-muted-foreground">Waiting for cost estimation.</p>
          ) : null}
          <div className="flex justify-between font-medium">
            <span>Total Estimation</span>
            <span>{data.estimated_price != null ? fmtIdr(breakdown?.total ?? data.estimated_price) : "—"}</span>
          </div>
        </CardContent>
      </Card>

      {Array.isArray((data as BookingDetail & { packages?: unknown[] }).packages) &&
      (data as BookingDetail & { packages?: unknown[] }).packages!.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Package Details (LCL)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Qty</th>
                  <th className="py-2 pr-2">Weight (kg)</th>
                  <th className="py-2">Dims (cm)</th>
                </tr>
              </thead>
              <tbody>
                {((data as BookingDetail & { packages?: Array<Record<string, unknown>> }).packages ?? []).map(
                  (pkg, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-2">{String(pkg.description ?? "—")}</td>
                      <td className="py-2 pr-2">{String(pkg.package_type ?? "—")}</td>
                      <td className="py-2 pr-2 tabular-nums">{String(pkg.piece_count ?? "—")}</td>
                      <td className="py-2 pr-2 tabular-nums">{String(pkg.weight_kg ?? "—")}</td>
                      <td className="py-2 tabular-nums">
                        {[pkg.length, pkg.width, pkg.height].filter(Boolean).join(" × ") || "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray((data as BookingDetail & { containers?: unknown[] }).containers) &&
      (data as BookingDetail & { containers?: unknown[] }).containers!.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Container Details (FCL)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">Qty</th>
                  <th className="py-2 pr-2">Weight (kg)</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {((data as BookingDetail & { containers?: Array<Record<string, unknown>> }).containers ?? []).map(
                  (ctr, i) => {
                    const ct = (ctr.container_type ?? ctr.containerType) as { name?: string; size?: string } | undefined;
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          {ct ? `${ct.name ?? ""} (${ct.size ?? ""})`.trim() : String(ctr.container_type_id ?? "—")}
                        </td>
                        <td className="py-2 pr-2 tabular-nums">{String(ctr.quantity ?? "—")}</td>
                        <td className="py-2 pr-2 tabular-nums">{String(ctr.gross_weight_kg ?? "—")}</td>
                        <td className="py-2">{String(ctr.cargo_description ?? "—")}</td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray((data as BookingDetail & { attachments?: unknown[] }).attachments) &&
      (data as BookingDetail & { attachments?: unknown[] }).attachments!.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {((data as BookingDetail & { attachments?: Array<Record<string, unknown>> }).attachments ?? []).map(
                (att, i) => (
                  <li key={i} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                    <span>{String(att.original_filename ?? att.file_name ?? att.document_type ?? "File")}</span>
                    <span className="text-muted-foreground">{String(att.document_type ?? "—")}</span>
                  </li>
                )
              )}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
