"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAdminVendorService,
  fetchAdminLocations,
  fetchAdminServiceTypes,
  fetchAdminTransportModes,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { firstLaravelError } from "@/lib/laravel-errors";
import type { LaravelPaginated } from "@/lib/types-api";
import { DIALOG_CREATE_HEADER_CLASS } from "@/lib/dialog-create-header";
import { toast } from "sonner";

type Opt = { id: number; label: string; transportModeId?: number };

export function VendorServiceDialog({
  open,
  onOpenChange,
  vendorId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: number | null;
  onSaved: () => void;
}) {
  const [transportModes, setTransportModes] = useState<Opt[]>([]);
  const [serviceTypes, setServiceTypes] = useState<Opt[]>([]);
  const [locations, setLocations] = useState<Opt[]>([]);
  const [listsLoading, setListsLoading] = useState(false);

  const [transportModeId, setTransportModeId] = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || vendorId == null) return;
    setError(null);
    setTransportModeId("");
    setServiceTypeId("");
    setOriginId("");
    setDestinationId("");
    setIsActive(true);
    let cancelled = false;
    void (async () => {
      setListsLoading(true);
      try {
        const [tm, st, loc] = await Promise.all([
          fetchAdminTransportModes({ perPage: 500 }),
          fetchAdminServiceTypes({ perPage: 500 }),
          fetchAdminLocations({ perPage: 500 }),
        ]);
        if (cancelled) return;
        const tmData = (tm as LaravelPaginated<Record<string, unknown>>).data ?? [];
        const stData = (st as LaravelPaginated<Record<string, unknown>>).data ?? [];
        const locData = (loc as LaravelPaginated<Record<string, unknown>>).data ?? [];
        setTransportModes(
          tmData.map((r) => ({
            id: Number(r.id),
            label: String(r.name ?? r.code ?? r.id),
          }))
        );
        setServiceTypes(
          stData.map((r) => ({
            id: Number(r.id),
            label: String(r.name ?? r.code ?? r.id),
            transportModeId: Number(r.transport_mode_id),
          }))
        );
        setLocations(
          locData.map((r) => ({
            id: Number(r.id),
            label: [r.code, r.name].filter(Boolean).join(" · ") || String(r.id),
          }))
        );
      } catch {
        if (!cancelled) {
          setTransportModes([]);
          setServiceTypes([]);
          setLocations([]);
        }
      } finally {
        if (!cancelled) setListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, vendorId]);

  const save = async () => {
    if (vendorId == null) return;
    setSaving(true);
    setError(null);
    try {
      await createAdminVendorService(vendorId, {
        transport_mode_id: Number(transportModeId),
        service_type_id: Number(serviceTypeId),
        origin_location_id: Number(originId),
        destination_location_id: Number(destinationId),
        is_active: isActive,
      });
      toast.success("Layanan vendor berhasil ditambahkan.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      const msg = e instanceof ApiError ? firstLaravelError(e.body) ?? e.message : "Gagal menyimpan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const disabled =
    vendorId == null ||
    !transportModeId ||
    !serviceTypeId ||
    !originId ||
    !destinationId ||
    saving ||
    listsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className={DIALOG_CREATE_HEADER_CLASS}>
          <DialogTitle>Tambah layanan vendor</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        ) : null}
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Moda transport</Label>
            <Select
              value={transportModeId}
              onValueChange={(v) => {
                if (v) {
                  setTransportModeId(v);
                  setServiceTypeId("");
                }
              }}
              disabled={saving || listsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={listsLoading ? "Memuat…" : "Pilih"}>
                  {transportModeId
                    ? transportModes.find((o) => String(o.id) === transportModeId)?.label ?? undefined
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {transportModes.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Jenis layanan</Label>
            <Select
              value={serviceTypeId}
              onValueChange={(v) => v && setServiceTypeId(v)}
              disabled={saving || listsLoading || !transportModeId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={listsLoading ? "Memuat…" : transportModeId ? "Pilih" : "Pilih moda dulu"}>
                  {serviceTypeId
                    ? serviceTypes.find((o) => String(o.id) === serviceTypeId)?.label ?? undefined
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {serviceTypes
                  .filter((o) => o.transportModeId === Number(transportModeId))
                  .map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Origin</Label>
            <Select
              value={originId}
              onValueChange={(v) => v && setOriginId(v)}
              disabled={listsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={listsLoading ? "Memuat…" : "Pilih"}>
                  {originId
                    ? locations.find((o) => String(o.id) === originId)?.label ?? undefined
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Destination</Label>
            <Select
              value={destinationId}
              onValueChange={(v) => v && setDestinationId(v)}
              disabled={listsLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={listsLoading ? "Memuat…" : "Pilih"}>
                  {destinationId
                    ? locations.find((o) => String(o.id) === destinationId)?.label ?? undefined
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="vs-active" checked={isActive} onCheckedChange={(c) => setIsActive(c === true)} />
            <Label htmlFor="vs-active" className="font-normal cursor-pointer">
              Aktif
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void save()}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
