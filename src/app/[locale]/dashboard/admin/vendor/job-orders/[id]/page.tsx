"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchAdminVendorJobOrder,
  sendAdminVendorJobOrder,
  updateAdminVendorJobOrder,
  uploadAdminVendorJobOrderDocument,
  verifyAdminVendorJobOrderCompletion,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { formatIdr, vehicleTypeLabel } from "@/lib/vendor-fsd-options";
import { useVendorJobOrderStatusLabel } from "@/hooks/use-admin-status-labels";
import { toast } from "sonner";

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDatetime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("id-ID");
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 font-medium">{value}</span>
    </div>
  );
}

export default function AdminVendorJobOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const locale = String(params?.locale ?? "id");
  const vendorJobOrderStatusLabel = useVendorJobOrderStatusLabel();

  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [vehicleRemark, setVehicleRemark] = useState("");
  const [additionalCost, setAdditionalCost] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupRemark, setPickupRemark] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryRemark, setDeliveryRemark] = useState("");
  const [uploading, setUploading] = useState(false);

  const syncForm = (d: Record<string, unknown>) => {
    setVehiclePlate(String(d.vehicle_plate ?? ""));
    setDriverName(String(d.driver_name ?? ""));
    setDriverMobile(String(d.driver_mobile ?? ""));
    setVehicleRemark(String(d.vehicle_remark ?? ""));
    setAdditionalCost(String(d.additional_cost ?? ""));
    setPickupDate(toDatetimeLocal(d.pickup_date as string));
    setPickupRemark(String(d.pickup_remark ?? ""));
    setDeliveryDate(toDatetimeLocal(d.delivery_date as string));
    setDeliveryRemark(String(d.delivery_remark ?? ""));
  };

  const refresh = async () => {
    const res = await fetchAdminVendorJobOrder(id);
    const d = (res as { data: Record<string, unknown> }).data;
    setDetail(d);
    syncForm(d);
  };

  useEffect(() => { void refresh().catch(() => setDetail(null)); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminVendorJobOrder(id, {
        vehicle_plate: vehiclePlate,
        driver_name: driverName,
        driver_mobile: driverMobile,
        vehicle_remark: vehicleRemark,
        additional_cost: additionalCost ? Number(additionalCost) : 0,
        pickup_date: pickupDate || null,
        pickup_remark: pickupRemark || null,
        delivery_date: deliveryDate || null,
        delivery_remark: deliveryRemark || null,
      });
      toast.success("Job Order diperbarui.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const send = async () => {
    setActionBusy(true);
    try {
      await sendAdminVendorJobOrder(id);
      toast.success("Job Order dikirim ke vendor.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengirim.");
    } finally {
      setActionBusy(false);
    }
  };

  const verifyCompletion = async () => {
    setActionBusy(true);
    try {
      await verifyAdminVendorJobOrderCompletion(id);
      toast.success("Penyelesaian Job Order diverifikasi.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal verifikasi.");
    } finally {
      setActionBusy(false);
    }
  };

  const uploadDocument = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("document_type", "supporting");
      await uploadAdminVendorJobOrderDocument(id, fd);
      toast.success("Dokumen diunggah.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal mengunggah.");
    } finally {
      setUploading(false);
    }
  };

  if (!detail) return <p className="text-sm text-muted-foreground">Memuat…</p>;

  const serviceType = String(detail.service_type ?? "");
  const isEditable = detail.is_editable !== false;
  const canSend = Boolean(detail.can_send);
  const canVerifyCompletion = Boolean(detail.can_verify_completion);
  const shipmentId = detail.shipment_id;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{String(detail.job_order_number)}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {String(detail.vendor ?? "—")} ·{" "}
              {shipmentId ? (
                <Link
                  className="text-primary underline"
                  href={`/${locale}/dashboard/admin/customer/shipments/${shipmentId}`}
                >
                  Shipment {String(detail.shipment_number ?? "—")}
                </Link>
              ) : (
                <>Shipment {String(detail.shipment_number ?? "—")}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Created: {detail.created_at ? new Date(String(detail.created_at)).toLocaleString("id-ID") : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{String(detail.status_label ?? vendorJobOrderStatusLabel(String(detail.status)))}</Badge>
            {canSend ? (
              <Button size="sm" disabled={actionBusy} onClick={() => void send()}>Send</Button>
            ) : null}
            {canVerifyCompletion ? (
              <Button size="sm" variant="secondary" disabled={actionBusy} onClick={() => void verifyCompletion()}>
                Verify Completion
              </Button>
            ) : null}
            {isEditable ? (
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Vendor Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Vendor" value={String(detail.vendor ?? "—")} />
          <ReadonlyField label="Vendor Code" value={String(detail.vendor_code ?? "—")} />
          <ReadonlyField label="Vendor PIC" value={String(detail.vendor_pic ?? "—")} />
          <ReadonlyField label="Mobile Number" value={String(detail.vendor_mobile ?? "—")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Shipment Information</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Shipment No" value={String(detail.shipment_number ?? "—")} />
          <ReadonlyField label="Consignment Note" value={String(detail.consignment_note ?? "—")} />
          <ReadonlyField label="Customer" value={String(detail.customer ?? "—")} />
          <ReadonlyField label="Origin" value={String(detail.origin ?? "—")} />
          <ReadonlyField label="Destination" value={String(detail.destination ?? "—")} />
          <ReadonlyField label="Shipment Coverage" value={String(detail.shipment_coverage ?? "—")} />
          <ReadonlyField label="Service" value={String(detail.service_label ?? "—")} />
        </CardContent>
      </Card>

      {serviceType === "pickup" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Job Detail — Pickup</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label="Pickup Address" value={String(detail.pickup_address ?? "—")} />
            <ReadonlyField label="Cargo Information" value={String(detail.pickup_cargo_info ?? "—")} />
            {isEditable ? (
              <>
                <div><Label>Pickup Date</Label><Input type="datetime-local" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></div>
                <div><Label>Remark</Label><Textarea value={pickupRemark} onChange={(e) => setPickupRemark(e.target.value)} rows={2} /></div>
              </>
            ) : (
              <>
                <ReadonlyField label="Pickup Date" value={formatDatetime(detail.pickup_date as string)} />
                <ReadonlyField label="Remark" value={String(detail.pickup_remark ?? "—")} />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {serviceType === "delivery" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Job Detail — Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <ReadonlyField label="Delivery Address" value={String(detail.delivery_address ?? "—")} />
            <ReadonlyField label="Cargo Information" value={String(detail.delivery_cargo_info ?? "—")} />
            {isEditable ? (
              <>
                <div><Label>Delivery Date</Label><Input type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
                <div><Label>Remark</Label><Textarea value={deliveryRemark} onChange={(e) => setDeliveryRemark(e.target.value)} rows={2} /></div>
              </>
            ) : (
              <>
                <ReadonlyField label="Delivery Date" value={formatDatetime(detail.delivery_date as string)} />
                <ReadonlyField label="Remark" value={String(detail.delivery_remark ?? "—")} />
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {serviceType === "rail" ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Job Detail — Rail</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ReadonlyField label="Origin Yard" value={String(detail.origin_yard ?? "—")} />
            <ReadonlyField label="Destination Yard" value={String(detail.destination_yard ?? "—")} />
            <ReadonlyField label="Train Schedule" value={String(detail.train_schedule ?? "—")} />
            <ReadonlyField label="Departure" value={formatDatetime(detail.departure_at as string)} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle className="text-base">Vehicle Assignment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ReadonlyField label="Vehicle Type" value={vehicleTypeLabel(String(detail.vehicle_type ?? ""))} />
          {isEditable ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Vehicle Plate</Label><Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} /></div>
              <div><Label>Driver Name</Label><Input value={driverName} onChange={(e) => setDriverName(e.target.value)} /></div>
              <div><Label>Driver Mobile</Label><Input value={driverMobile} onChange={(e) => setDriverMobile(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Remark</Label><Textarea value={vehicleRemark} onChange={(e) => setVehicleRemark(e.target.value)} rows={2} /></div>
            </div>
          ) : (
            <>
              <ReadonlyField label="Vehicle Plate" value={String(detail.vehicle_plate ?? "—")} />
              <ReadonlyField label="Driver Name" value={String(detail.driver_name ?? "—")} />
              <ReadonlyField label="Driver Mobile" value={String(detail.driver_mobile ?? "—")} />
              <ReadonlyField label="Remark" value={String(detail.vehicle_remark ?? "—")} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pricing Snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ReadonlyField label="Service" value={String(detail.service_label ?? "—")} />
          <ReadonlyField label="Vendor Rate" value={formatIdr(detail.vendor_rate as string)} />
          {isEditable ? (
            <div>
              <Label>Additional Cost</Label>
              <Input inputMode="decimal" value={additionalCost} onChange={(e) => setAdditionalCost(e.target.value)} />
            </div>
          ) : (
            <ReadonlyField label="Additional Cost" value={formatIdr(detail.additional_cost as string)} />
          )}
          <ReadonlyField label="Total Cost" value={formatIdr(detail.total_cost as string)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2 text-sm">
            {((detail.documents as Record<string, unknown>[]) ?? []).map((doc) => (
              <li key={String(doc.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                <span>{String(doc.original_name ?? doc.document_type ?? "Document")}</span>
                {doc.url ? (
                  <a className="text-primary underline text-xs" href={String(doc.url)} target="_blank" rel="noreferrer">Download</a>
                ) : null}
              </li>
            ))}
            {((detail.documents as unknown[]) ?? []).length === 0 ? (
              <li className="text-muted-foreground">Belum ada dokumen.</li>
            ) : null}
          </ul>
          {isEditable ? (
            <div>
              <Label>Upload Supporting Document</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadDocument(f);
                  e.target.value = "";
                }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {((detail.activities as Record<string, unknown>[]) ?? []).map((a, i) => (
              <li key={i}>
                {String(a.activity)}
                {a.created_by ? ` · ${String(a.created_by)}` : ""}
                {a.created_at ? ` · ${new Date(String(a.created_at)).toLocaleString("id-ID")}` : ""}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/admin/vendor/job-orders`)}>Kembali</Button>
    </div>
  );
}
