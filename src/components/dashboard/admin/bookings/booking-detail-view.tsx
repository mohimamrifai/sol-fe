"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  bookingStatusBadgeClass,
  bookingStatusLabelFromApi,
  resolveBookingDisplayStatus,
} from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import type { BookingDetail } from "./types";
import { useTranslations } from "next-intl";

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
  { key: "draft", labelKey: "stats.draft" },
  { key: "submitted", labelKey: "filters.submitted" },
  { key: "confirmed", labelKey: "filters.confirmed", statuses: ["approved", "confirmed"] },
  { key: "converted", labelKey: "stats.converted" },
] as const;

function fmtIdr(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtPickupTime(value: unknown): string {
  if (value == null || String(value).trim() === "") return "—";
  const raw = String(value);
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

function partyLine(label: string, value: string): React.ReactNode {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span> {value || "—"}
    </p>
  );
}

function packageVolumeCbm(pkg: Record<string, unknown>): number {
  const stored = Number(pkg.volume_cbm);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const l = Number(pkg.length) || 0;
  const w = Number(pkg.width) || 0;
  const h = Number(pkg.height) || 0;
  const qty = Number(pkg.piece_count) || 1;
  if (!l || !w || !h) return 0;
  return ((l * w * h) / 1_000_000) * qty;
}

function packageChargeableWeight(pkg: Record<string, unknown>): number {
  const l = Number(pkg.length) || 0;
  const w = Number(pkg.width) || 0;
  const h = Number(pkg.height) || 0;
  const qty = Number(pkg.piece_count) || 1;
  const actual = Number(pkg.weight_kg) || 0;
  const volumeWeight = l && w && h ? ((l * w * h) / 5000) * qty : 0;
  return Math.max(actual, volumeWeight);
}

/**
 * FSD Customer/bookings.md §7 shows the actor inline, e.g. "Booking dibuat oleh Demo Company Admin".
 */
function activityText(act: Record<string, unknown>): string {
  const text = String(act.description ?? act.event ?? act.title ?? "—");
  const actor = act.actor as { name?: string } | null | undefined;
  const actorName = String(actor?.name ?? act.actor_name ?? "").trim();
  if (!actorName || text.includes(actorName)) return text;

  return `${text.replace(/\.$/, "")} oleh ${actorName}`;
}

function attachmentHref(att: Record<string, unknown>): string | null {
  const path = String(att.file_path ?? "");
  if (!path) return null;
  return `/storage/${path}`;
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
  const t = useTranslations("AdminBookings");
  const td = useTranslations("AdminBookings.detailPage");
  const tCoverage = useTranslations("AdminBookings.coverageOptions");

  if (loading) {
    return <p className="text-sm text-muted-foreground">{td("loading")}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted-foreground">{t("toasts.loadFailed")}</p>;
  }

  const origin = data.origin_location?.name ?? data.originLocation?.name ?? "—";
  const destination = data.destination_location?.name ?? data.destinationLocation?.name ?? "—";
  const service = data.service_type?.name ?? data.serviceType?.name ?? data.service_type?.code ?? "—";
  const breakdown = (data as BookingDetail & { price_breakdown?: Breakdown }).price_breakdown;
  const currentStep = stepIndex(data);
  const displayStatus = resolveBookingDisplayStatus(data);
  const customerLocation =
    (data as BookingDetail & { shipper_location?: { name?: string }; shipperLocation?: { name?: string } }).shipper_location?.name ??
    (data as BookingDetail & { shipperLocation?: { name?: string } }).shipperLocation?.name ??
    "—";

  const coverageLabel = (v?: string | null) => {
    if (!v) return "—";
    if ((["port_to_port", "door_to_port", "port_to_door", "door_to_door"] as const).includes(v as "port_to_port")) {
      return tCoverage(v as "port_to_port");
    }
    return v.replace(/_/g, " ");
  };

  const shipperSnap = (data as BookingDetail & { shipper_snapshot?: Record<string, unknown> }).shipper_snapshot;
  const consigneeSnap = (data as BookingDetail & { consignee_snapshot?: Record<string, unknown> }).consignee_snapshot;
  const deliveryNotes = String((data as BookingDetail & { delivery_notes?: string }).delivery_notes ?? "");
  const activities = data.activities ?? [];
  const attachmentRows = ((data as BookingDetail & { attachments?: Array<Record<string, unknown>> }).attachments ?? []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/20 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{t("columns.bookingNo")}</p>
          <p className="text-lg font-semibold">{data.booking_number}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t("columns.status")}</p>
          <Badge variant="outline" className={bookingStatusBadgeClass(displayStatus)}>
            {bookingStatusLabelFromApi(displayStatus)}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{td("bookingDate")}</p>
          <p className="text-sm font-medium">{data.created_at ? String(data.created_at).slice(0, 10) : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{td("customerLocation")}</p>
          <p className="text-sm font-medium">{customerLocation}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{td("routeTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{t("columns.customer")}:</span> {data.company?.name ?? "—"}</p>
          <p><span className="text-muted-foreground">{t("columns.route")}:</span> {origin} → {destination}</p>
          <p><span className="text-muted-foreground">{t("columns.service")}:</span> {service}</p>
          <p><span className="text-muted-foreground">{t("columns.coverage")}:</span> {coverageLabel(data.shipment_coverage)}</p>
          <p><span className="text-muted-foreground">{td("pickupDate")}:</span> {(data as BookingDetail & { pickup_date?: string }).pickup_date?.slice(0, 10) ?? "—"}</p>
          <p><span className="text-muted-foreground">{td("pickupTime")}:</span> {fmtPickupTime((data as BookingDetail & { pickup_time?: string }).pickup_time)}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">{td("pickupNotes")}:</span> {(data as BookingDetail & { pickup_notes?: string }).pickup_notes ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{td("partiesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-medium">{td("shipperLabel")}</p>
            {partyLine(td("companyName"), data.shipper_name ?? "")}
            {partyLine(td("picName"), String(shipperSnap?.pic_name ?? ""))}
            {partyLine(td("picEmail"), String(shipperSnap?.pic_email ?? ""))}
            {partyLine(td("picMobile"), String(shipperSnap?.pic_mobile ?? data.shipper_phone ?? ""))}
            {partyLine(td("address"), data.shipper_address ?? "")}
          </div>
          <div>
            <p className="font-medium">{td("consigneeLabel")}</p>
            {partyLine(td("companyName"), data.consignee_name ?? "")}
            {partyLine(td("picName"), String(consigneeSnap?.pic_name ?? ""))}
            {partyLine(td("picEmail"), String(consigneeSnap?.pic_email ?? ""))}
            {partyLine(td("picMobile"), String(consigneeSnap?.pic_mobile ?? data.consignee_phone ?? ""))}
            {partyLine(td("address"), data.consignee_address ?? "")}
            {deliveryNotes ? (
              <p className="text-muted-foreground"><span className="font-medium text-foreground">{td("deliveryNotes")}:</span> {deliveryNotes}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {Array.isArray((data as BookingDetail & { packages?: unknown[] }).packages) &&
      (data as BookingDetail & { packages?: unknown[] }).packages!.length > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{td("packagesTitle")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">{td("packageDescription")}</th>
                  <th className="py-2 pr-2">{td("packageType")}</th>
                  <th className="py-2 pr-2">{td("packageQty")}</th>
                  <th className="py-2 pr-2">{td("packageWeight")}</th>
                  <th className="py-2 pr-2">{td("packageVolume")}</th>
                  <th className="py-2">{td("packageChargeable")}</th>
                </tr>
              </thead>
              <tbody>
                {((data as BookingDetail & { packages?: Array<Record<string, unknown>> }).packages ?? []).map((pkg, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-2">{String(pkg.description ?? "—")}</td>
                    <td className="py-2 pr-2">{String(pkg.package_type ?? "—")}</td>
                    <td className="py-2 pr-2 tabular-nums">{String(pkg.piece_count ?? "—")}</td>
                    <td className="py-2 pr-2 tabular-nums">{String(pkg.weight_kg ?? "—")}</td>
                    <td className="py-2 pr-2 tabular-nums">{packageVolumeCbm(pkg).toFixed(2)}</td>
                    <td className="py-2 tabular-nums">{packageChargeableWeight(pkg).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray((data as BookingDetail & { containers?: unknown[] }).containers) &&
      (data as BookingDetail & { containers?: unknown[] }).containers!.length > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{td("containersTitle")}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">{td("containerType")}</th>
                  <th className="py-2 pr-2">{td("containerQty")}</th>
                  <th className="py-2 pr-2">{td("containerWeight")}</th>
                  <th className="py-2 pr-2">{td("containerDescription")}</th>
                  <th className="py-2 pr-2">{td("containerCategory")}</th>
                  <th className="py-2">{td("containerRemark")}</th>
                </tr>
              </thead>
              <tbody>
                {((data as BookingDetail & { containers?: Array<Record<string, unknown>> }).containers ?? []).map((ctr, i) => {
                  const ct = (ctr.container_type ?? ctr.containerType) as { name?: string; size?: string } | undefined;
                  const cat = (ctr.cargo_category ?? ctr.cargoCategory) as { name?: string } | undefined;
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-2">{ct ? `${ct.name ?? ""} (${ct.size ?? ""})`.trim() : String(ctr.container_type_id ?? "—")}</td>
                      <td className="py-2 pr-2 tabular-nums">{String(ctr.quantity ?? "—")}</td>
                      <td className="py-2 pr-2 tabular-nums">{String(ctr.gross_weight_kg ?? "—")}</td>
                      <td className="py-2 pr-2">{String(ctr.cargo_description ?? "—")}</td>
                      <td className="py-2 pr-2">{cat?.name ?? String(ctr.cargo_category_id ?? "—")}</td>
                      <td className="py-2">{String(ctr.remark ?? "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {attachmentRows.length > 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{td("attachmentsTitle")}</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {attachmentRows.map((att, i) => {
                const href = attachmentHref(att);
                const label = String(att.original_name ?? att.original_filename ?? att.document_type ?? "File");
                return (
                  <li key={i} className="flex justify-between gap-4 border-b pb-2 last:border-0">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {label}
                      </a>
                    ) : (
                      <span>{label}</span>
                    )}
                    <span className="text-muted-foreground">{String(att.document_type ?? "—")}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{td("costTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {breakdown ? (
            <>
              <div className="flex justify-between"><span className="text-muted-foreground">{td("freight")}</span><span>{fmtIdr(breakdown.freight)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{td("pickup")}</span><span>{fmtIdr(breakdown.pickup)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{td("delivery")}</span><span>{fmtIdr(breakdown.delivery)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{td("discount")}</span><span>{fmtIdr(breakdown.discount)}</span></div>
              <Separator />
            </>
          ) : data.estimated_price == null ? (
            <p className="text-muted-foreground">{td("waitingEstimation")}</p>
          ) : null}
          <div className="flex justify-between font-medium">
            <span>{td("totalEstimation")}</span>
            <span>{data.estimated_price != null ? fmtIdr(breakdown?.total ?? data.estimated_price) : "—"}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">{td("costDisclaimer")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{td("timelineTitle")}</CardTitle>
          <CardDescription>{td("timelineDesc")}</CardDescription>
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
                    {t(step.labelKey as "stats.draft")}
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

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{td("activityTitle")}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {activities.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">{td("activityTime")}</th>
                  <th className="py-2">{td("activityLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {act.occurred_at
                        ? String(act.occurred_at).slice(0, 16).replace("T", " ")
                        : act.created_at
                          ? String(act.created_at).slice(0, 16).replace("T", " ")
                          : "—"}
                    </td>
                    <td className="py-2">{activityText(act)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">{td("activityEmpty")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{td("internalTitle")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">{td("salesPic")}:</span> {data.company?.salesPic?.name ?? data.company?.sales_pic?.name ?? "—"}</p>
          <p className="sm:col-span-2"><span className="text-muted-foreground">{td("internalNotes")}:</span> {data.notes ?? "—"}</p>
          <p><span className="text-muted-foreground">{td("confirmedBy")}:</span> {(data as BookingDetail & { approved_by_user?: { name?: string } }).approved_by_user?.name ?? (data as BookingDetail & { approvedByUser?: { name?: string } }).approvedByUser?.name ?? "—"}</p>
          <p><span className="text-muted-foreground">{td("confirmedDate")}:</span> {(data as BookingDetail & { approved_at?: string }).approved_at ? String((data as BookingDetail & { approved_at?: string }).approved_at).slice(0, 16).replace("T", " ") : "—"}</p>
          {(data.shipment_id || data.shipment_exists || data.has_shipment) ? (
            <>
              <p><span className="text-muted-foreground">{td("convertedBy")}:</span> {(data as BookingDetail & { shipment?: { created_by_user?: { name?: string } } }).shipment?.created_by_user?.name ?? "—"}</p>
              <p><span className="text-muted-foreground">{td("convertedDate")}:</span> {(data as BookingDetail & { shipment?: { created_at?: string } }).shipment?.created_at ? String((data as BookingDetail & { shipment?: { created_at?: string } }).shipment?.created_at).slice(0, 16).replace("T", " ") : "—"}</p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
