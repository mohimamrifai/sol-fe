"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  fetchAdminTrains,
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

export function ShipmentPlanningCard({ shipmentId, data, canEdit, onSaved }: Props) {
  const [internalPicId, setInternalPicId] = useState("");
  const [trainId, setTrainId] = useState("");
  const [originYardId, setOriginYardId] = useState("");
  const [destinationYardId, setDestinationYardId] = useState("");
  const [planningNotes, setPlanningNotes] = useState("");
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [trains, setTrains] = useState<Array<{ id: number; name: string; code?: string }>>([]);
  const [yards, setYards] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const pic = (data.internal_pic ?? data.internalPic) as { id?: number } | undefined;
    const train = (data.train) as { id?: number } | undefined;
    const oy = (data.origin_yard ?? data.originYard) as { id?: number } | undefined;
    const dy = (data.destination_yard ?? data.destinationYard) as { id?: number } | undefined;
    setInternalPicId(pic?.id != null ? String(pic.id) : "");
    setTrainId(train?.id != null ? String(train.id) : "");
    setOriginYardId(oy?.id != null ? String(oy.id) : "");
    setDestinationYardId(dy?.id != null ? String(dy.id) : "");
    setPlanningNotes(String(data.planning_notes ?? ""));
  }, [data]);

  useEffect(() => {
    void Promise.all([
      fetchAdminUsers({ perPage: 200, userType: "internal" }),
      fetchAdminTrains({ perPage: 200 }),
      fetchAdminLocations({ perPage: 500, type: "hub" }),
    ]).then(([uRes, tRes, lRes]) => {
      setUsers((((uRes as unknown) as { data?: Array<{ id: number; name: string }> }).data ?? []));
      setTrains((((tRes as unknown) as { data?: Array<{ id: number; name: string; code?: string }> }).data ?? []));
      setYards((((lRes as unknown) as { data?: Array<{ id: number; name: string }> }).data ?? []));
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateAdminShipment(shipmentId, {
        internal_pic_id: internalPicId ? Number(internalPicId) : null,
        train_id: trainId ? Number(trainId) : null,
        origin_yard_id: originYardId ? Number(originYardId) : null,
        destination_yard_id: destinationYardId ? Number(destinationYardId) : null,
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Planning</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Internal PIC</Label>
          <Select value={internalPicId || "none"} onValueChange={(v) => setInternalPicId(!v || v === "none" ? "" : v)} disabled={!canEdit}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Pilih PIC" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Train Schedule</Label>
          <Select value={trainId || "none"} onValueChange={(v) => setTrainId(!v || v === "none" ? "" : v)} disabled={!canEdit}>
            <SelectTrigger className="h-9 w-full"><SelectValue placeholder="Pilih kereta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {trains.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}{t.code ? ` (${t.code})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Origin Yard</Label>
          <Select value={originYardId || "none"} onValueChange={(v) => setOriginYardId(!v || v === "none" ? "" : v)} disabled={!canEdit}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {yards.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Destination Yard</Label>
          <Select value={destinationYardId || "none"} onValueChange={(v) => setDestinationYardId(!v || v === "none" ? "" : v)} disabled={!canEdit}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {yards.map((y) => (
                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Planning Notes</Label>
          <Textarea value={planningNotes} onChange={(e) => setPlanningNotes(e.target.value)} rows={3} disabled={!canEdit} />
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
