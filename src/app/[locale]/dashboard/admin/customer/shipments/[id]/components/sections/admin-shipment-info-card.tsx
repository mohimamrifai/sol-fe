"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateAdminShipment } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Props = {
  shipmentId: number;
  data: Record<string, unknown>;
  canEdit: boolean;
  onSaved: () => void;
};

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatReadonlyDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminShipmentInfoCard({ shipmentId, data, canEdit, onSaved }: Props) {
  const t = useTranslations("AdminShipments");
  const coverage = String(data.shipment_coverage ?? "");
  const hasDoorPickup = coverage === "door_to_port" || coverage === "door_to_door";

  const origin = (data.origin_location ?? data.originLocation) as { name?: string; code?: string } | undefined;
  const destination = (data.destination_location ?? data.destinationLocation) as
    | { name?: string; code?: string }
    | undefined;
  const serviceType = (data.service_type ?? data.serviceType) as { name?: string; code?: string } | undefined;

  const [pickupDate, setPickupDate] = useState("");
  const [plannedDeparture, setPlannedDeparture] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPickupDate(toInputDateTime(String(data.pickup_scheduled_at ?? "")));
    setPlannedDeparture(toInputDateTime(String(data.estimated_departure ?? "")));
    setEstimatedArrival(toInputDateTime(String(data.estimated_arrival ?? "")));
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        estimated_departure: plannedDeparture ? new Date(plannedDeparture).toISOString() : null,
        estimated_arrival: estimatedArrival ? new Date(estimatedArrival).toISOString() : null,
      };
      if (hasDoorPickup) {
        body.pickup_scheduled_at = pickupDate ? new Date(pickupDate).toISOString() : null;
      }
      await updateAdminShipment(shipmentId, body);
      toast.success("Informasi shipment disimpan.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan informasi shipment.");
    } finally {
      setSaving(false);
    }
  };

  const coverageLabel = coverage
    ? t(`coverageOptions.${coverage}` as Parameters<typeof t>[0])
    : "—";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shipment Information</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <ReadonlyField label="Origin Station" value={origin?.name ?? origin?.code ?? "—"} />
        <ReadonlyField label="Destination Station" value={destination?.name ?? destination?.code ?? "—"} />
        <ReadonlyField label="Service Type" value={serviceType?.name ?? serviceType?.code ?? "—"} />
        <ReadonlyField label="Shipment Coverage" value={coverageLabel} />

        {hasDoorPickup ? (
          <div className="space-y-2">
            <Label>Pickup Date</Label>
            {canEdit ? (
              <Input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="h-9"
              />
            ) : (
              <p className="text-sm">{formatReadonlyDate(String(data.pickup_scheduled_at ?? ""))}</p>
            )}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Planned Departure</Label>
          {canEdit ? (
            <Input
              type="datetime-local"
              value={plannedDeparture}
              onChange={(e) => setPlannedDeparture(e.target.value)}
              className="h-9"
            />
          ) : (
            <p className="text-sm">{formatReadonlyDate(String(data.estimated_departure ?? ""))}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Estimated Arrival</Label>
          {canEdit ? (
            <Input
              type="datetime-local"
              value={estimatedArrival}
              onChange={(e) => setEstimatedArrival(e.target.value)}
              className="h-9"
            />
          ) : (
            <p className="text-sm">{formatReadonlyDate(String(data.estimated_arrival ?? ""))}</p>
          )}
        </div>

        <ReadonlyField label="Actual Departure" value={formatReadonlyDate(String(data.actual_departure ?? ""))} />
        <ReadonlyField label="Actual Arrival" value={formatReadonlyDate(String(data.actual_arrival ?? ""))} />

        {canEdit ? (
          <div className="md:col-span-2 flex justify-end">
            <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
