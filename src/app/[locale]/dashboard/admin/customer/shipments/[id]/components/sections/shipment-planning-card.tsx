"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  fetchAdminLocations,
  fetchAdminTrainSchedules,
  fetchAdminUsers,
  updateAdminShipment,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

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

export function ShipmentPlanningCard({ shipmentId, data, canEdit, onSaved }: Props) {
  const [internalPicId, setInternalPicId] = useState("");
  const [trainScheduleId, setTrainScheduleId] = useState("");
  const [originYardId, setOriginYardId] = useState("");
  const [destinationYardId, setDestinationYardId] = useState("");
  const [plannedDeparture, setPlannedDeparture] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [planningNotes, setPlanningNotes] = useState("");
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [trainSchedules, setTrainSchedules] = useState<
    Array<{ id: number; code?: string; train_number?: string; route?: string; departure_at?: string }>
  >([]);
  const [yards, setYards] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pic = (data.internal_pic ?? data.internalPic) as { id?: number } | undefined;
    const schedule = (data.train_schedule ?? data.trainSchedule) as { id?: number } | undefined;
    const oy = (data.origin_yard ?? data.originYard) as { id?: number } | undefined;
    const dy = (data.destination_yard ?? data.destinationYard) as { id?: number } | undefined;
    setInternalPicId(pic?.id != null ? String(pic.id) : "");
    setTrainScheduleId(
      schedule?.id != null
        ? String(schedule.id)
        : data.train_schedule_id != null
          ? String(data.train_schedule_id)
          : ""
    );
    setOriginYardId(oy?.id != null ? String(oy.id) : "");
    setDestinationYardId(dy?.id != null ? String(dy.id) : "");
    setPlannedDeparture(toInputDateTime(String(data.estimated_departure ?? "")));
    setEstimatedArrival(toInputDateTime(String(data.estimated_arrival ?? "")));
    setPlanningNotes(String(data.planning_notes ?? ""));
  }, [data]);

  useEffect(() => {
    void Promise.all([
      fetchAdminUsers({ perPage: 200, userType: "internal" }),
      fetchAdminTrainSchedules({ perPage: 200 }),
      fetchAdminLocations({ perPage: 500, type: "hub" }),
    ])
      .then(([uRes, tRes, lRes]) => {
        setUsers((((uRes as unknown) as { data?: Array<{ id: number; name: string }> }).data ?? []));
        setTrainSchedules(
          (((tRes as unknown) as {
            data?: Array<{ id: number; code?: string; train_number?: string; route?: string; departure_at?: string }>;
          }).data ?? [])
        );
        setYards((((lRes as unknown) as { data?: Array<{ id: number; name: string }> }).data ?? []));
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminShipment(shipmentId, {
        internal_pic_id: internalPicId ? Number(internalPicId) : null,
        train_schedule_id: trainScheduleId ? Number(trainScheduleId) : null,
        origin_yard_id: originYardId ? Number(originYardId) : null,
        destination_yard_id: destinationYardId ? Number(destinationYardId) : null,
        estimated_departure: plannedDeparture ? new Date(plannedDeparture).toISOString() : null,
        estimated_arrival: estimatedArrival ? new Date(estimatedArrival).toISOString() : null,
        planning_notes: planningNotes.trim() || null,
      });
      toast.success("Planning shipment disimpan.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan planning.");
    } finally {
      setSaving(false);
    }
  };

  const scheduleLabel = (s: { code?: string; train_number?: string; route?: string; departure_at?: string }) => {
    const parts = [s.code, s.train_number, s.route].filter(Boolean);
    if (s.departure_at) {
      parts.push(new Date(s.departure_at).toLocaleString("id-ID"));
    }
    return parts.join(" · ") || `Schedule #${s.code ?? ""}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shipment Planning</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Internal PIC *</Label>
          <Select
            value={internalPicId || "none"}
            onValueChange={(v) => setInternalPicId(!v || v === "none" ? "" : v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih PIC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Train Schedule *</Label>
          <Select
            value={trainScheduleId || "none"}
            onValueChange={(v) => setTrainScheduleId(!v || v === "none" ? "" : v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih jadwal kereta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {trainSchedules.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {scheduleLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origin Yard *</Label>
          <Select
            value={originYardId || "none"}
            onValueChange={(v) => setOriginYardId(!v || v === "none" ? "" : v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {yards.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Destination Yard *</Label>
          <Select
            value={destinationYardId || "none"}
            onValueChange={(v) => setDestinationYardId(!v || v === "none" ? "" : v)}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {yards.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Planned Departure *</Label>
          {canEdit ? (
            <Input
              type="datetime-local"
              className="h-9"
              value={plannedDeparture}
              onChange={(e) => setPlannedDeparture(e.target.value)}
            />
          ) : (
            <p className="text-sm">{plannedDeparture || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Estimated Arrival *</Label>
          {canEdit ? (
            <Input
              type="datetime-local"
              className="h-9"
              value={estimatedArrival}
              onChange={(e) => setEstimatedArrival(e.target.value)}
            />
          ) : (
            <p className="text-sm">{estimatedArrival || "—"}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Planning Notes</Label>
          <Textarea
            value={planningNotes}
            onChange={(e) => setPlanningNotes(e.target.value)}
            rows={3}
            disabled={!canEdit}
          />
        </div>
        {canEdit ? (
          <div className="md:col-span-2">
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Planning"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
