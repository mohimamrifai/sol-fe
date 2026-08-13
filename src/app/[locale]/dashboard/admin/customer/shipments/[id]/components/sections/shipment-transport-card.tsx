"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminVendors, updateAdminShipment } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import { toast } from "sonner";

type VendorOption = { id: number; name: string; code?: string };

const VEHICLE_TYPES = ["pickup", "box", "fuso", "trailer", "wing_box"];

type Props = {
  shipmentId: number;
  coverage: string;
  data: Record<string, unknown>;
  canEdit: boolean;
  onSaved: () => void;
};

function showOrigin(coverage: string): boolean {
  return coverage === "door_to_port" || coverage === "door_to_door";
}

function showDestination(coverage: string): boolean {
  return coverage === "port_to_door" || coverage === "door_to_door";
}

function coverageLabel(coverage: string): string {
  const map: Record<string, string> = {
    port_to_port: "Port to Port",
    door_to_port: "Door to Port",
    port_to_door: "Port to Door",
    door_to_door: "Door to Door",
  };
  return map[coverage] ?? coverage.replace(/_/g, " ");
}

function vendorLabel(v: VendorOption) {
  return v.code ? `${v.name} (${v.code})` : v.name;
}

function pickVendorName(data: Record<string, unknown>, key: string): string {
  const rel = data[key] as { name?: string } | undefined;
  return rel?.name ?? "—";
}

export function ShipmentTransportCard({ shipmentId, coverage, data, canEdit, onSaved }: Props) {
  const t = useTranslations("AdminShipments");
  const tc = useTranslations("AdminCommon");

  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [pickupVendorId, setPickupVendorId] = useState("");
  const [pickupVehicleType, setPickupVehicleType] = useState("");
  const [pickupPlate, setPickupPlate] = useState("");
  const [pickupDriver, setPickupDriver] = useState("");
  const [pickupMobile, setPickupMobile] = useState("");
  const [pickupPic, setPickupPic] = useState("");
  const [pickupScheduled, setPickupScheduled] = useState("");
  const [pickupRemark, setPickupRemark] = useState("");

  const [deliveryVendorId, setDeliveryVendorId] = useState("");
  const [deliveryVehicleType, setDeliveryVehicleType] = useState("");
  const [deliveryPlate, setDeliveryPlate] = useState("");
  const [deliveryDriver, setDeliveryDriver] = useState("");
  const [deliveryMobile, setDeliveryMobile] = useState("");
  const [deliveryPic, setDeliveryPic] = useState("");
  const [deliveryScheduled, setDeliveryScheduled] = useState("");
  const [deliveryRemark, setDeliveryRemark] = useState("");

  useEffect(() => {
    void fetchAdminVendors({ perPage: 200 })
      .then((res) => {
        const rows = (res.data as Record<string, unknown>[]) ?? [];
        setVendors(rows.map((r) => ({ id: Number(r.id), name: String(r.name ?? ""), code: r.code ? String(r.code) : undefined })));
      })
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    setPickupVendorId(data.pickup_vendor_id != null ? String(data.pickup_vendor_id) : "");
    setPickupVehicleType(String(data.pickup_vehicle_type ?? ""));
    setPickupPlate(String(data.pickup_vehicle_plate ?? ""));
    setPickupDriver(String(data.pickup_driver_name ?? ""));
    setPickupMobile(String(data.pickup_driver_mobile ?? ""));
    setPickupPic(String(data.pickup_vendor_pic ?? ""));
    setPickupScheduled(data.pickup_scheduled_at ? String(data.pickup_scheduled_at).slice(0, 16) : "");
    setPickupRemark(String(data.pickup_remark ?? ""));

    setDeliveryVendorId(data.delivery_vendor_id != null ? String(data.delivery_vendor_id) : "");
    setDeliveryVehicleType(String(data.delivery_vehicle_type ?? ""));
    setDeliveryPlate(String(data.delivery_vehicle_plate ?? ""));
    setDeliveryDriver(String(data.delivery_driver_name ?? ""));
    setDeliveryMobile(String(data.delivery_driver_mobile ?? ""));
    setDeliveryPic(String(data.delivery_vendor_pic ?? ""));
    setDeliveryScheduled(data.delivery_scheduled_at ? String(data.delivery_scheduled_at).slice(0, 16) : "");
    setDeliveryRemark(String(data.delivery_remark ?? ""));
  }, [data]);

  if (coverage === "port_to_port") {
    return null;
  }

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (showOrigin(coverage)) {
        body.pickup_vendor_id = pickupVendorId ? Number(pickupVendorId) : null;
        body.pickup_vehicle_type = pickupVehicleType || null;
        body.pickup_vehicle_plate = pickupPlate.trim() || null;
        body.pickup_driver_name = pickupDriver.trim() || null;
        body.pickup_driver_mobile = pickupMobile.trim() || null;
        body.pickup_vendor_pic = pickupPic.trim() || null;
        body.pickup_scheduled_at = pickupScheduled || null;
        body.pickup_remark = pickupRemark.trim() || null;
      }
      if (showDestination(coverage)) {
        body.delivery_vendor_id = deliveryVendorId ? Number(deliveryVendorId) : null;
        body.delivery_vehicle_type = deliveryVehicleType || null;
        body.delivery_vehicle_plate = deliveryPlate.trim() || null;
        body.delivery_driver_name = deliveryDriver.trim() || null;
        body.delivery_driver_mobile = deliveryMobile.trim() || null;
        body.delivery_vendor_pic = deliveryPic.trim() || null;
        body.delivery_scheduled_at = deliveryScheduled || null;
        body.delivery_remark = deliveryRemark.trim() || null;
      }
      await updateAdminShipment(shipmentId, body);
      toast.success(t("transport.saved"));
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : t("transport.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const renderTransportSection = (
    kind: "origin" | "destination",
    vendorId: string,
    setVendorId: (v: string) => void,
    vehicleType: string,
    setVehicleType: (v: string) => void,
    plate: string,
    setPlate: (v: string) => void,
    driver: string,
    setDriver: (v: string) => void,
    mobile: string,
    setMobile: (v: string) => void,
    pic: string,
    setPic: (v: string) => void,
    scheduled: string,
    setScheduled: (v: string) => void,
    remark: string,
    setRemark: (v: string) => void,
    vendorRelKey: string
  ) => (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {kind === "origin" ? t("transport.originTitle") : t("transport.destinationTitle")}
      </p>
      {!canEdit && vendorId ? (
        <p className="text-sm">{pickVendorName(data, vendorRelKey)}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("transport.vendor")}</Label>
          {canEdit ? (
            <Select value={vendorId || "none"} onValueChange={(v) => setVendorId(!v || v === "none" ? "" : v)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={t("transport.selectVendor")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{vendorLabel(v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">{pickVendorName(data, vendorRelKey)}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("transport.vehicleType")}</Label>
          {canEdit ? (
            <Select value={vehicleType || "none"} onValueChange={(v) => setVehicleType(!v || v === "none" ? "" : v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {VEHICLE_TYPES.map((vt) => (
                  <SelectItem key={vt} value={vt}>{vt.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm">{vehicleType || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("transport.plateNumber")}</Label>
          {canEdit ? (
            <Input className="h-9" value={plate} onChange={(e) => setPlate(e.target.value)} />
          ) : (
            <p className="text-sm">{plate || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{kind === "origin" ? t("transport.pickupDateTime") : t("transport.deliveryDateTime")}</Label>
          {canEdit ? (
            <Input className="h-9" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
          ) : (
            <p className="text-sm">{scheduled || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("transport.driverName")}</Label>
          {canEdit ? (
            <Input className="h-9" value={driver} onChange={(e) => setDriver(e.target.value)} />
          ) : (
            <p className="text-sm">{driver || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("transport.driverMobile")}</Label>
          {canEdit ? (
            <Input className="h-9" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          ) : (
            <p className="text-sm">{mobile || "—"}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("transport.vendorPic")}</Label>
          {canEdit ? (
            <Input className="h-9" value={pic} onChange={(e) => setPic(e.target.value)} />
          ) : (
            <p className="text-sm">{pic || "—"}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("transport.remark")}</Label>
          {canEdit ? (
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{remark || "—"}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("transport.title")}</CardTitle>
        <p className="text-xs text-muted-foreground">{coverageLabel(coverage)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {showOrigin(coverage)
          ? renderTransportSection(
              "origin",
              pickupVendorId,
              setPickupVendorId,
              pickupVehicleType,
              setPickupVehicleType,
              pickupPlate,
              setPickupPlate,
              pickupDriver,
              setPickupDriver,
              pickupMobile,
              setPickupMobile,
              pickupPic,
              setPickupPic,
              pickupScheduled,
              setPickupScheduled,
              pickupRemark,
              setPickupRemark,
              "pickup_vendor"
            )
          : null}
        {showDestination(coverage)
          ? renderTransportSection(
              "destination",
              deliveryVendorId,
              setDeliveryVendorId,
              deliveryVehicleType,
              setDeliveryVehicleType,
              deliveryPlate,
              setDeliveryPlate,
              deliveryDriver,
              setDeliveryDriver,
              deliveryMobile,
              setDeliveryMobile,
              deliveryPic,
              setDeliveryPic,
              deliveryScheduled,
              setDeliveryScheduled,
              deliveryRemark,
              setDeliveryRemark,
              "delivery_vendor"
            )
          : null}
        {canEdit ? (
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? tc("actions.saving") : tc("actions.save")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
